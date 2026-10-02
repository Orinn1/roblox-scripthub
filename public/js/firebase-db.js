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
            if (window.location && window.location.hostname) {
                const host = window.location.hostname.toLowerCase();
                // Explicitly Thai domain: th.blacklisthub.workers.dev or localhost always uses 'hub'
                if (host.startsWith("th.")) {
                    return "hub";
                }
                // ONLY hub.blacklisthub.workers.dev or explicit global subdomains use hub_global
                if (host.startsWith("hub.") || host.includes("global")) {
                    return "hub_global";
                }
            }
            const override = sessionStorage.getItem("blacklist_active_db_target");
            if (override === "hub" || override === "hub_global") {
                return override;
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

            function normalizeScriptsList(raw) {
                if (raw === null || raw === undefined) return null;
                let list = null;
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (typeof raw === "object") {
                    if (Array.isArray(raw.value)) list = raw.value;
                    else if (Array.isArray(raw.scripts)) list = raw.scripts;
                    else if (Array.isArray(raw.data)) list = raw.data;
                }
                if (Array.isArray(list)) {
                    const cleanList = [];
                    list.forEach(s => {
                        if (s && typeof s === "object") {
                            const copy = { ...s };
                            delete copy.views;
                            delete copy.likes;
                            cleanList.push(copy);
                        }
                    });
                    return cleanList;
                }
                return null;
            }

            // 1. ตรวจสอบ Smart Cache
            if (!forceRefresh) {
                const cachedTime = parseInt(sessionStorage.getItem(timeKey) || "0", 10);
                const hasCache = localStorage.getItem(cacheKey);
                if (hasCache !== null && (Date.now() - cachedTime < CACHE_DURATION_MS)) {
                    try {
                        const parsed = JSON.parse(hasCache);
                        const clean = normalizeScriptsList(parsed);
                        if (clean !== null) return clean;
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
                        if (typeof data.scriptsJson === "string") {
                            try { result = JSON.parse(data.scriptsJson); } catch (e) {}
                        }
                        if (!result && data.scripts) {
                            result = data.scripts;
                        }
                        const clean = normalizeScriptsList(result);
                        if (clean !== null) {
                            try {
                                localStorage.setItem(cacheKey, JSON.stringify(clean));
                                sessionStorage.setItem(timeKey, Date.now().toString());
                            } catch (e) {}
                            console.log(`[Firebase] [${col}] Successfully loaded scripts via SDK. Total:`, clean.length);
                            return clean;
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
                        const clean = normalizeScriptsList(result);
                        if (clean !== null) {
                            localStorage.setItem(cacheKey, JSON.stringify(clean));
                            sessionStorage.setItem(timeKey, Date.now().toString());
                            console.log(`[Firebase] [${col}] Successfully loaded scripts via REST API. Total:`, clean.length);
                            return clean;
                        }
                    }
                } catch (restErr) {
                    console.warn(`[Firebase] [${col}] REST fetch warning:`, restErr);
                }
            }

            // 4. Fallback ไปที่ LocalStorage หรือค่าเริ่มต้น
            const localSaved = localStorage.getItem(cacheKey);
            if (localSaved !== null) {
                try {
                    const parsed = JSON.parse(localSaved);
                    const clean = normalizeScriptsList(parsed);
                    if (clean !== null) return clean;
                } catch (e) {}
            }

            // 5. Fallback ไปที่ static data/scripts.json
            try {
                const staticRes = await fetch("data/scripts.json").catch(() => null);
                if (staticRes && staticRes.ok) {
                    const staticRaw = await staticRes.json();
                    const clean = normalizeScriptsList(staticRaw);
                    if (clean !== null) {
                        localStorage.setItem(cacheKey, JSON.stringify(clean));
                        console.log(`[Firebase] [${col}] Fallback to static data/scripts.json. Total:`, clean.length);
                        return clean;
                    }
                }
            } catch (staticErr) {}

            return (typeof INITIAL_SCRIPTS !== "undefined" && Array.isArray(INITIAL_SCRIPTS)) ? INITIAL_SCRIPTS : [];
        },

        // บันทึกข้อมูลสคริปต์ทั้งหมดขึ้น Firebase Firestore ตาม Collection ประจำโดเมน
        saveScripts: async function (scriptsArray) {
            if (!Array.isArray(scriptsArray)) return false;

            // คลีนข้อมูล: ลบ views และ likes ออกจากทุก object ก่อนบันทึกเข้า DB
            const sanitized = scriptsArray.map(item => {
                if (!item || typeof item !== 'object') return item;
                const copy = { ...item };
                delete copy.views;
                delete copy.likes;
                return copy;
            });
            // กรองค่า undefined ออกเพื่อป้องกัน Firebase SDK แจ้งเตือนข้อผิดพลาด
            const cleanSanitized = JSON.parse(JSON.stringify(sanitized));

            const cacheKey = getScriptsCacheKey();
            const timeKey = getScriptsTimeKey();
            const col = getHubCollectionName();

            // อัปเดตแคชในเครื่องทันที (พร้อมป้องกัน QuotaExceededError)
            try {
                localStorage.setItem(cacheKey, JSON.stringify(cleanSanitized));
                sessionStorage.setItem(timeKey, Date.now().toString());
            } catch (storageErr) {
                console.warn("[Firebase] LocalStorage cache quota notice:", storageErr);
            }

            const serialized = JSON.stringify(cleanSanitized);
            const approxBytes = serialized.length;
            if (approxBytes > 850000) {
                console.warn(`[Firebase] [${col}] PAYLOAD WARNING: Size is ${Math.round(approxBytes / 1024)} KB (Firestore limit is 1,024 KB). Consider using external image URLs instead of uploaded images.`);
            }

            let savedSuccessfully = false;

            // 1. บันทึกผ่าน Firebase SDK (เก็บเฉพาะ scriptsJson เพื่อประหยัดพื้นที่ 50% ป้องกันชนเพดาน 1MB)
            const db = getFirestore();
            if (db) {
                try {
                    await db.collection(col).doc("database").set({
                        scriptsJson: serialized,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    console.log(`[Firebase] [${col}] Successfully saved scripts via SDK (${cleanSanitized.length} items, ${Math.round(approxBytes / 1024)} KB)`);
                    savedSuccessfully = true;
                } catch (sdkErr) {
                    console.warn(`[Firebase] [${col}] SDK save warning, trying REST API:`, sdkErr);
                }
            }

            // 2. Fallback: บันทึกผ่าน REST API
            if (!savedSuccessfully && this.isAvailable()) {
                try {
                    const { projectId, apiKey } = window.SITE_CONFIG.firebaseConfig;
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/database?key=${apiKey}&updateMask.fieldPaths=scriptsJson&updateMask.fieldPaths=updatedAt`;
                    const res = await fetch(url, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fields: {
                                scriptsJson: { stringValue: JSON.stringify(cleanSanitized) },
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

        // เพิ่มยอดการดูสคริปต์ (View Counter) - ปิดการทำงานเพื่อไม่ให้รก DB
        incrementView: async function (scriptId) {
            return;
        },

        // กดถูกใจ / ยกเลิกถูกใจ (Like Toggle) - ปิดการทำงานเพื่อไม่ให้รก DB
        toggleLike: async function (scriptId, increment = true) {
            return;
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
