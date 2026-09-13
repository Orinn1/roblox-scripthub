/**
 * Firebase Firestore Manager for BlacklistScriptx
 * Connects directly to Google Cloud Firebase Firestore (50,000 free reads/day)
 * Supports both Firebase JS SDK and REST API fallback with client caching.
 */

(function () {
    const CACHE_KEY = "nova_scripts_db";
    const TIME_KEY = "nova_scripts_cache_time";
    const CACHE_DURATION_MS = 60 * 1000; // 60 วินาที client-side cache

    let dbInstance = null;

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

        // โหลดข้อมูลสคริปต์ทั้งหมด
        getScripts: async function (forceRefresh = false) {
            // 1. ตรวจสอบ Smart Cache
            if (!forceRefresh) {
                const cachedTime = parseInt(sessionStorage.getItem(TIME_KEY) || "0", 10);
                const hasCache = localStorage.getItem(CACHE_KEY);
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
                    const docSnap = await db.collection("hub").doc("database").get();
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        let result = [];
                        if (Array.isArray(data.scripts)) {
                            result = data.scripts;
                        } else if (typeof data.scriptsJson === "string") {
                            result = JSON.parse(data.scriptsJson);
                        }
                        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
                        sessionStorage.setItem(TIME_KEY, Date.now().toString());
                        console.log("[Firebase] Successfully loaded scripts via SDK. Total:", result.length);
                        return result;
                    }
                } catch (sdkErr) {
                    console.warn("[Firebase] SDK fetch warning, trying REST API:", sdkErr);
                }
            }

            // 3. Fallback: Firebase REST API (กรณี SDK ไม่โหลดหรือโดนบล็อก)
            if (this.isAvailable()) {
                try {
                    const { projectId, apiKey } = window.SITE_CONFIG.firebaseConfig;
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/hub/database?key=${apiKey}`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const json = await res.json();
                        let result = [];
                        if (json.fields && json.fields.scriptsJson && json.fields.scriptsJson.stringValue) {
                            result = JSON.parse(json.fields.scriptsJson.stringValue);
                        }
                        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
                        sessionStorage.setItem(TIME_KEY, Date.now().toString());
                        console.log("[Firebase] Successfully loaded scripts via REST API. Total:", result.length);
                        return result;
                    }
                } catch (restErr) {
                    console.warn("[Firebase] REST fetch warning:", restErr);
                }
            }

            // 4. Fallback ไปที่ LocalStorage หรือค่าเริ่มต้น
            const localSaved = localStorage.getItem(CACHE_KEY);
            if (localSaved) {
                try {
                    return JSON.parse(localSaved);
                } catch (e) {}
            }

            return [];
        },

        // บันทึกข้อมูลสคริปต์ทั้งหมดขึ้น Firebase Firestore
        saveScripts: async function (scriptsArray) {
            if (!Array.isArray(scriptsArray)) return false;

            // อัปเดตแคชในเครื่องทันที
            localStorage.setItem(CACHE_KEY, JSON.stringify(scriptsArray));
            sessionStorage.setItem(TIME_KEY, Date.now().toString());

            let savedSuccessfully = false;

            // 1. บันทึกผ่าน Firebase SDK
            const db = getFirestore();
            if (db) {
                try {
                    await db.collection("hub").doc("database").set({
                        scripts: scriptsArray,
                        scriptsJson: JSON.stringify(scriptsArray),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    console.log("[Firebase] Successfully saved scripts via SDK");
                    savedSuccessfully = true;
                } catch (sdkErr) {
                    console.warn("[Firebase] SDK save warning, trying REST API:", sdkErr);
                }
            }

            // 2. Fallback: บันทึกผ่าน REST API
            if (!savedSuccessfully && this.isAvailable()) {
                try {
                    const { projectId, apiKey } = window.SITE_CONFIG.firebaseConfig;
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/hub/database?key=${apiKey}`;
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
                        console.log("[Firebase] Successfully saved scripts via REST API");
                        savedSuccessfully = true;
                    }
                } catch (restErr) {
                    console.warn("[Firebase] REST save error:", restErr);
                }
            }

            return savedSuccessfully;
        },

        // โหลดการตั้งค่าเว็บไซต์ (Site Config) จาก Firestore
        getConfig: async function () {
            const db = getFirestore();
            if (db) {
                try {
                    const docSnap = await db.collection("hub").doc("config").get();
                    if (docSnap.exists) {
                        return docSnap.data();
                    }
                } catch (e) {
                    console.warn("[Firebase] Failed to load config via SDK:", e);
                }
            }
            return null;
        },

        // บันทึกการตั้งค่าเว็บไซต์ขึ้น Firestore
        saveConfig: async function (configData) {
            const db = getFirestore();
            if (db) {
                try {
                    await db.collection("hub").doc("config").set(configData, { merge: true });
                    console.log("[Firebase] Saved config to Firestore");
                    return true;
                } catch (e) {
                    console.warn("[Firebase] Failed to save config to Firestore:", e);
                }
            }
            return false;
        }
    };

    window.FirebaseDB = FirebaseDB;
})();
