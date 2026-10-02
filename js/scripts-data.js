/**
 * คลังข้อมูลสคริปต์ (Script Database)
 * สามารถเพิ่ม ลบ แก้ไขสคริปต์ได้ที่นี่ หรือผ่านหน้าตั้งค่าบนเว็บ
 */
const INITIAL_SCRIPTS = [];

function getScriptsStorageKey() {
    if (typeof window !== "undefined") {
        if (window.FirebaseDB && typeof window.FirebaseDB.getScriptsCacheKey === "function") {
            return window.FirebaseDB.getScriptsCacheKey();
        }
        if (window.location && window.location.hostname) {
            const host = window.location.hostname.toLowerCase();
            if (host.startsWith("th.")) return "nova_scripts_db";
            if (host.startsWith("hub.") || host.includes("global")) {
                return "nova_scripts_db_global";
            }
        }
        const override = sessionStorage.getItem("blacklist_active_db_target");
        if (override === "hub_global") return "nova_scripts_db_global";
        if (override === "hub") return "nova_scripts_db";
    }
    return "nova_scripts_db";
}

// โหลดข้อมูลสคริปต์จาก LocalStorage หากมีการเพิ่ม/แก้ไข
function getScriptsData() {
    try {
        const key = getScriptsStorageKey();
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            let list = JSON.parse(saved);
            if (list && typeof list === "object") {
                if (Array.isArray(list.value)) list = list.value;
                else if (Array.isArray(list.scripts)) list = list.scripts;
                else if (Array.isArray(list.data)) list = list.data;
            }
            if (Array.isArray(list)) {
                const clean = [];
                list.forEach(s => {
                    if (s && typeof s === "object") {
                        const copy = { ...s };
                        delete copy.views;
                        delete copy.likes;
                        clean.push(copy);
                    }
                });
                return clean;
            }
        }
    } catch (e) {
        console.warn("Could not load custom scripts", e);
    }
    return (typeof INITIAL_SCRIPTS !== "undefined" && Array.isArray(INITIAL_SCRIPTS)) ? INITIAL_SCRIPTS : [];
}

function saveScriptsData(scripts) {
    const key = getScriptsStorageKey();
    if (Array.isArray(scripts)) {
        scripts.forEach(s => {
            if (s && typeof s === "object") {
                delete s.views;
                delete s.likes;
            }
        });
    }
    try {
        localStorage.setItem(key, JSON.stringify(scripts));
    } catch (e) {
        console.warn("[Storage] LocalStorage quota reached while caching scripts:", e);
    }
}

if (typeof window !== "undefined") {
    window.getScriptsData = getScriptsData;
    window.saveScriptsData = saveScriptsData;
    window.getScriptsStorageKey = getScriptsStorageKey;
}