/**
 * คลังข้อมูลสคริปต์ (Script Database)
 * สามารถเพิ่ม ลบ แก้ไขสคริปต์ได้ที่นี่ หรือผ่านหน้าตั้งค่าบนเว็บ
 */
const INITIAL_SCRIPTS = [];

// โหลดข้อมูลสคริปต์จาก LocalStorage หากมีการเพิ่ม/แก้ไข
function getScriptsData() {
    try {
        const saved = localStorage.getItem("nova_scripts_db");
        if (saved !== null) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn("Could not load custom scripts", e);
    }
    return INITIAL_SCRIPTS;
}

function saveScriptsData(scripts) {
    localStorage.setItem("nova_scripts_db", JSON.stringify(scripts));
}
