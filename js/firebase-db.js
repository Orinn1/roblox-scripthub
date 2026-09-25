/**
 * Firebase Firestore Manager for BlacklistScriptx
 * Connects directly to Google Cloud Firebase Firestore (50,000 free reads/day)
 * Supports Multi-Database Isolation:
 *  - 'hub' for Thai site (Vercel / default)
 *  - 'hub_global' for Global site (Cloudflare Workers / blacklisthub)
 */

(function () {
    const CACHE_DURATION_MS = 60 * 1000; // 60 seconds client-side cache

    let dbInstance = null;

    // Detect which database collection to use based on hostname or manual override
    function getHubCollectionName() {
        if (typeof window !== "undefined") {
            const override = sessionStorage.getItem("blacklist_active_db_target");
            if (override === "hub" || override === "hub_global") {
                return override;
            }
            if (window.location && window.location.hostname) {
                const host = window.location.hostname.toLowerCase();
                // ONLY hub.blacklisthub.workers.dev uses hub_global. Other domains (th., roblox-scripthub., vercel) use 'hub'
                if (host.startsWith("hub.") || host.includes("global")) {
                    return "hub_global";
                }
            }
        }
        return "hub";
    }

    function getScriptsCacheKey() {
        return getHubCollectionName() === "hub_global" ? "nova_scripts_db_global" : "nova_scripts_db";
    }

    function getScriptsTimeKey() {
        return getHubCollectionName() === "hub_global" ? "nova_scripts_cache_time_global" : "nova_scripts_cache_time";
    }

    function getFirestore() {
        if (dbInstance) return dbInstance;
        try {
            if (typeof firebase !== "undefined" && window.SITE_CONFIG && window.SITE_CONFIG.firebaseConfig) {
                if (!firebase.apps || !firebase.apps.length) {
                    firebase.initializeApp(window.SITE_CONFIG.firebaseConfig);
                }
                dbInstance = firebase.firestore();
                return dbInstance;
            }
        } catch (e) {
            console.warn("[Firebase] SDK init error, fallback will be used:", e);
        }
        return null;
    }

    const FirebaseDB = {
        isAvailable: function () {
            return Boolean(window.SITE_CONFIG && window.SITE_CONFIG.firebaseConfig && window.SITE_CONFIG.firebaseConfig.projectId);
        },

        getCollectionName: function () {
            return getHubCollectionName();
        },

        getScriptsCacheKey: function () {
            return getScriptsCacheKey();
        },

        getScriptsTimeKey: function () {
            return getScriptsTimeKey();
        },

        setTargetCollection: function (colName) {
            if (colName === "hub" || colName === "hub_global") {
                sessionStorage.setItem("blacklist_active_db_target", colName);
                console.log("[Firebase] Target DB collection switched to:", colName);
                return true;
            }
            return false;
        },

        // โหลดข้อมูลสคริปต์ทั้งหมดตาม Collection ประจำโดเมน (hub หรือ hub_global)
        getScripts: async function (forceRefresh = false) {
            const cacheKey = getScriptsCacheKey();
            const timeKey = getScriptsTimeKey();
            const col = getHubCollectionName();

            // 1. ตรวจสอบ Smart Cache
            if (!forceRefresh) {
                const cachedTime = parseInt(sessionStorage.getItem(timeKey) || "0", 10);
                const hasCache = localStorage.getItem(cacheKey);
                if (hasCache && (Date.now() - cachedTime < CACHE_DURATION_MS)) {
                    try {
                        const parsed = JSON.parse(hasCache);
                        if (Array.isArray(parsed)) {
                            return parsed;
                        }
                    } catch (e) {}
                }
            }

            // 2. ลองโหลดผ่าน Firebase SDK
            const db = getFirestore();
            if (db) {
                try {
                    const docSnap = await db.collection(col).doc("database").get();
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        let result = null;
                        if (Array.isArray(data.scripts)) {
                            result = data.scripts;
                        } else if (typeof data.scriptsJson === "string") {
                            try { result = JSON.parse(data.scriptsJson); } catch (e) {}
                        }
                        if (Array.isArray(result)) {
                            localStorage.setItem(cacheKey, JSON.stringify(result));
                            sessionStorage.setItem(timeKey, Date.now().toString());
                            console.log(`[Firebase] [${col}] Successfully loaded scripts via SDK. Total:`, result.length);
                            return result;
                        }
                    }
                } catch (sdkErr) {
                    console.warn(`[Firebase] [${col}] SDK fetch warning, trying REST API:`, sdkErr);
                }
            }

            // 3. Fallback: Firebase REST API
            if (this.isAvailable()) {
                try {
                    const { projectId, apiKey } = window.SITE_CONFIG.firebaseConfig;
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/database?key=${apiKey}`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const json = await res.json();
                        let result = null;
                        if (json.fields && json.fields.scriptsJson && json.fields.scriptsJson.stringValue) {
                            try { result = JSON.parse(json.fields.scriptsJson.stringValue); } catch (e) {}
                        }
                        if (Array.isArray(result)) {
                            localStorage.setItem(cacheKey, JSON.stringify(result));
                            sessionStorage.setItem(timeKey, Date.now().toString());
                            console.log(`[Firebase] [${col}] Successfully loaded scripts via REST API. Total:`, result.length);
                            return result;
                        }
                    }
                } catch (restErr) {
                    console.warn(`[Firebase] [${col}] REST fetch warning:`, restErr);
                }
            }

            // 4. Fallback ไปที่ LocalStorage หรือค่าเริ่มต้น
            const localSaved = localStorage.getItem(cacheKey);
            if (localSaved) {
                try {
                    return JSON.parse(localSaved);
                } catch (e) {}
            }

            return [];
        },

        // บันทึกข้อมูลสคริปต์ทั้งหมดขึ้น Firebase Firestore ตาม Collection ประจำโดเมน
        saveScripts: async function (scriptsArray) {
            if (!Array.isArray(scriptsArray)) return false;

            const cacheKey = getScriptsCacheKey();
            const timeKey = getScriptsTimeKey();
            const col = getHubCollectionName();

            // อัปเดตแคชในเครื่องทันที
            localStorage.setItem(cacheKey, JSON.stringify(scriptsArray));
            sessionStorage.setItem(timeKey, Date.now().toString());

            let savedSuccessfully = false;

            // 1. บันทึกผ่าน Firebase SDK
            const db = getFirestore();
            if (db) {
                try {
                    await db.collection(col).doc("database").set({
                        scripts: scriptsArray,
                        scriptsJson: JSON.stringify(scriptsArray),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    console.log(`[Firebase] [${col}] Successfully saved scripts via SDK`);
                    savedSuccessfully = true;
                } catch (sdkErr) {
                    console.warn(`[Firebase] [${col}] SDK save warning, trying REST API:`, sdkErr);
                }
            }

            // 2. Fallback: บันทึกผ่าน REST API
            if (!savedSuccessfully && this.isAvailable()) {
                try {
                    const { projectId, apiKey } = window.SITE_CONFIG.firebaseConfig;
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/database?key=${apiKey}`;
                    const res = await fetch(url, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fields: {
                                scriptsJson: { stringValue: JSON.stringify(scriptsArray) },
                                updatedAt: { stringValue: new Date().toISOString() }
                            }
                        })
                    });
                    if (res.ok) {
                        console.log(`[Firebase] [${col}] Successfully saved scripts via REST API`);
                        savedSuccessfully = true;
                    }
                } catch (restErr) {
                    console.warn(`[Firebase] [${col}] REST save error:`, restErr);
                }
            }

            return savedSuccessfully;
        },

        // เพิ่มยอดการดูสคริปต์ (View Counter)
        incrementView: async function (scriptId) {
            if (!scriptId) return;
            const cacheKey = getScriptsCacheKey();
            const col = getHubCollectionName();

            try {
                let cached = [];
                const localSaved = localStorage.getItem(cacheKey);
                if (localSaved) {
                    try { cached = JSON.parse(localSaved); } catch (e) {}
                }
                const target = cached.find(s => String(s.id) === String(scriptId));
                if (target) {
                    target.views = (Number(target.views) || 0) + 1;
                    localStorage.setItem(cacheKey, JSON.stringify(cached));
                }

                const db = getFirestore();
                if (db) {
                    const docRef = db.collection(col).doc("database");
                    await db.runTransaction(async (transaction) => {
                        const doc = await transaction.get(docRef);
                        if (!doc.exists) return;
                        const data = doc.data();
                        let currentScripts = [];
                        if (Array.isArray(data.scripts)) currentScripts = data.scripts;
                        else if (typeof data.scriptsJson === "string") currentScripts = JSON.parse(data.scriptsJson);

                        const item = currentScripts.find(s => String(s.id) === String(scriptId));
                        if (item) {
                            item.views = (Number(item.views) || 0) + 1;
                            transaction.update(docRef, {
                                scripts: currentScripts,
                                scriptsJson: JSON.stringify(currentScripts)
                            });
                        }
                    });
                    return;
                }

                if (this.isAvailable() && cached.length > 0) {
                    await this.saveScripts(cached);
                }
            } catch (err) {
                console.warn(`[Firebase] [${col}] View increment notice:`, err);
            }
        },

        // กดถูกใจ / ยกเลิกถูกใจ (Like Toggle)
        toggleLike: async function (scriptId, increment = true) {
            if (!scriptId) return;
            const cacheKey = getScriptsCacheKey();
            const col = getHubCollectionName();

            try {
                let cached = [];
                const localSaved = localStorage.getItem(cacheKey);
                if (localSaved) {
                    try { cached = JSON.parse(localSaved); } catch (e) {}
                }
                const target = cached.find(s => String(s.id) === String(scriptId));
                if (target) {
                    target.likes = Math.max(0, (Number(target.likes) || 0) + (increment ? 1 : -1));
                    localStorage.setItem(cacheKey, JSON.stringify(cached));
                }

                const db = getFirestore();
                if (db) {
                    const docRef = db.collection(col).doc("database");
                    await db.runTransaction(async (transaction) => {
                        const doc = await transaction.get(docRef);
                        if (!doc.exists) return;
                        const data = doc.data();
                        let currentScripts = [];
                        if (Array.isArray(data.scripts)) currentScripts = data.scripts;
                        else if (typeof data.scriptsJson === "string") currentScripts = JSON.parse(data.scriptsJson);

                        const item = currentScripts.find(s => String(s.id) === String(scriptId));
                        if (item) {
                            item.likes = Math.max(0, (Number(item.likes) || 0) + (increment ? 1 : -1));
                            transaction.update(docRef, {
                                scripts: currentScripts,
                                scriptsJson: JSON.stringify(currentScripts)
                            });
                        }
                    });
                    return;
                }

                if (this.isAvailable() && cached.length > 0) {
                    await this.saveScripts(cached);
                }
            } catch (err) {
                console.warn(`[Firebase] [${col}] Like toggle notice:`, err);
            }
        },

        // โหลดการตั้งค่าเว็บไซต์ (Site Config) จาก Firestore
        getConfig: async function () {
            const col = getHubCollectionName();

            // 1. ลองโหลดผ่าน Firebase SDK
            const db = getFirestore();
            if (db) {
                try {
                    const docSnap = await db.collection(col).doc("config").get();
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        let result = {};
                        if (data.configJson && typeof data.configJson === "string") {
                            try {
                                result = JSON.parse(data.configJson);
                            } catch (e) {}
                        }
                        result = { ...result, ...data };
                        delete result.configJson;
                        console.log(`[Firebase] [${col}] Successfully loaded config via SDK`);
                        return result;
                    }
                } catch (e) {
                    console.warn(`[Firebase] [${col}] Failed to load config via SDK, trying REST API fallback:`, e);
                }
            }

            // 2. Fallback: Firebase REST API
            if (this.isAvailable()) {
                try {
                    const { projectId, apiKey } = window.SITE_CONFIG.firebaseConfig;
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/config?key=${apiKey}`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const json = await res.json();
                        let result = {};
                        if (json.fields && json.fields.configJson && json.fields.configJson.stringValue) {
                            try {
                                result = JSON.parse(json.fields.configJson.stringValue);
                            } catch (e) {}
                        }
                        console.log(`[Firebase] [${col}] Successfully loaded config via REST API fallback`);
                        return result;
                    }
                } catch (restErr) {
                    console.warn(`[Firebase] [${col}] REST fetch config warning:`, restErr);
                }
            }

            return null;
        },

        // บันทึกการตั้งค่าเว็บไซต์ขึ้น Firestore ตาม Collection ประจำโดเมน
        saveConfig: async function (configData) {
            if (!configData || typeof configData !== "object") return false;
            const col = getHubCollectionName();

            let savedSuccessfully = false;
            let clean = {};
            try {
                clean = JSON.parse(JSON.stringify(configData));
                delete clean.configJson;
            } catch (e) {
                clean = { ...configData };
                delete clean.configJson;
            }

            // 1. ลองบันทึกผ่าน Firebase SDK
            const db = getFirestore();
            if (db) {
                try {
                    const payload = {
                        ...clean,
                        configJson: JSON.stringify(clean)
                    };
                    if (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue) {
                        payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    } else {
                        payload.updatedAt = new Date().toISOString();
                    }
                    await db.collection(col).doc("config").set(payload, { merge: true });
                    console.log(`[Firebase] [${col}] Successfully saved config to Firestore via SDK`);
                    savedSuccessfully = true;
                } catch (e) {
                    console.warn(`[Firebase] [${col}] Failed to save config via SDK, trying REST API fallback:`, e);
                }
            }

            // 2. Fallback: Firebase REST API
            if (!savedSuccessfully && this.isAvailable()) {
                try {
                    const { projectId, apiKey } = window.SITE_CONFIG.firebaseConfig;
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/config?key=${apiKey}`;
                    const res = await fetch(url, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fields: {
                                configJson: { stringValue: JSON.stringify(clean) },
                                updatedAt: { stringValue: new Date().toISOString() }
                            }
                        })
                    });
                    if (res.ok) {
                        console.log(`[Firebase] [${col}] Successfully saved config to Firestore via REST API fallback`);
                        savedSuccessfully = true;
                    }
                } catch (restErr) {
                    console.warn(`[Firebase] [${col}] REST save config warning:`, restErr);
                }
            }

            return savedSuccessfully;
        }
    };

    window.FirebaseDB = FirebaseDB;
})();
