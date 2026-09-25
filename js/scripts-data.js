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
        const override = sessionStorage.getItem("blacklist_active_db_target");
        if (override === "hub_global") return "nova_scripts_db_global";
        if (override === "hub") return "nova_scripts_db";
        if (window.location && window.location.hostname) {
            const host = window.location.hostname.toLowerCase();
            if (host.includes("blacklisthub") || host.includes("workers.dev") || host.includes("global")) {
                return "nova_scripts_db_global";
            }
        }
    }
    return "nova_scripts_db";
}

// โหลดข้อมูลสคริปต์จาก LocalStorage หากมีการเพิ่ม/แก้ไข
function getScriptsData() {
    try {
        const key = getScriptsStorageKey();
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn("Could not load custom scripts", e);
    }
    return INITIAL_SCRIPTS;
}

function saveScriptsData(scripts) {
    const key = getScriptsStorageKey();
    localStorage.setItem(key, JSON.stringify(scripts));
}

