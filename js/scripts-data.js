/**
 * คลังข้อมูลสคริปต์ (Script Database)
 * สามารถเพิ่ม ลบ แก้ไขสคริปต์ได้ที่นี่ หรือผ่านหน้าตั้งค่าบนเว็บ
 */
const INITIAL_SCRIPTS = [
    {
        "id":  "script-1789309376069",
        "title":  "Roblox แจกสคริป Steal An Egg ฟรี AFK 24 ชั่วโมงชิวๆ🎁🎈 (AJJANS Hub)",
        "game":  "Steal An Egg",
        "category":  "stealanegg",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  false,
        "isMobile":  true,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "https://i.postimg.cc/NjhnhRkJ/153b5a40-0a72-4b41-ab3d-a784d6cff6ec.png",
        "description":  "สคริปต์ Steal An Egg อัปเดตล่าสุด ฟังก์ชันครบ ใช้งานง่าย ปลอดภัย",
        "title_en":  "",
        "thumbnail_en":  "",
        "description_en":  "",
        "loadstring":  "loadstring(game:HttpGet(\"https://api.luarmor.net/files/v4/loaders/359e97f8618e9008afe5f496184ebb7c.lua\"))()",
        "created_at":  1790718911997
    },
    {
        "id":  "script-1789400876314",
        "title":  "Blox Fruits แจกสคริปฟรี! 🤯 ไม่มีคีย์ พร้อมฟาร์มออโต้ (Gravity Hub)",
        "game":  "Blox Fruits",
        "category":  "bloxfruits",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  true,
        "isMobile":  true,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "https://i.postimg.cc/QdMcnX6k/c83f1d25-2231-4a10-95d3-e39b21b902ba.png",
        "description":  "สคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
        "title_en":  "",
        "thumbnail_en":  "",
        "description_en":  "",
        "loadstring":  "GravityHub = {\n    Key = \"\",\n    Team = \"Pirates\",\n    Color = \"Red\",\n    SaveSetting = false,\n    AutoExecute = false\n}\nloadstring(game:HttpGet(\"https://raw.githubusercontent.com/Dev-GravityHub/BloxFruit/refs/heads/main/MainPremium.lua\"))()",
        "created_at":  1790718911988
    },
    {
        "id":  "script-1789490850185",
        "title":  "แจกสคริปต์ Steal An Egg 🔥 ฟาร์มไข่อัตโนมัติ + Auto Steal 24 ชม (ZeroinHub)",
        "game":  "Steal An Egg",
        "category":  "stealanegg",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  false,
        "isMobile":  true,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "https://i.postimg.cc/Tw5QWxyN/Chat-GPT-Image-Sep-15-2026-11-45-45-PM.png",
        "description":  "สคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
        "title_en":  "",
        "thumbnail_en":  "https://i.postimg.cc/ydn5BLQh/Chat-GPT-Image-Sep-18-2026-09-25-03-PM.png",
        "description_en":  "",
        "loadstring":  "loadstring(game:HttpGet(\"https://zeroinhub.com/api/script\"))()",
        "created_at":  1790718911983
    },
    {
        "id":  "script-1789655182421",
        "title":  "Roblox แจกสคริปต์ Ride A Pet 🔥 ไม่มีคีย์! ออโต้ทุกอย่าง ฟาร์มชิวๆ",
        "game":  "Ride A Pet",
        "category":  "ride a pet",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  true,
        "isMobile":  true,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "Logo.ico",
        "description":  "สคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
        "title_en":  "",
        "thumbnail_en":  "",
        "description_en":  "",
        "loadstring":  "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/joustingmatch/Ouroboros/main/loader.lua\"))()",
        "created_at":  1790718911974
    },
    {
        "id":  "script-1790231804563",
        "title":  "Slayers 2 Script 🔥 แจกสคริปต์ BigFroot โคตรโกง! 1 คลิกเวลอัป + Instant Kill วันช็อตมอน",
        "game":  "Slayers 2",
        "category":  "slayers2",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  false,
        "isMobile":  true,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "Logo.ico",
        "description":  "สคริปต์ Slayers 2 อัปเดตล่าสุด ฟังก์ชันครบ ใช้งานง่าย ปลอดภัย",
        "title_en":  "",
        "thumbnail_en":  "",
        "description_en":  "",
        "loadstring":  "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/hanniii1/Loader/refs/heads/main/BFLoader.lua\"))()",
        "created_at":  1790718911967
    },
    {
        "id":  "script-1790345741707",
        "title":  "[แจกสคริปต์] Slayers 2 ออโต้ฟาร์มเวลตัน + หา มุซัน + ลงดันเจี้ยนอัตโนมัติ (ไม่มีคีย์ โคตรโกง)",
        "game":  "Slayers 2",
        "category":  "slayers2",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  true,
        "isMobile":  true,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "Logo.ico",
        "description":  "สคริปต์ Slayers 2 (คนเล่นปัจจุบัน ~165,048 คน) อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
        "title_en":  "Slayers 2 Script - Auto Farm \u0026 Hub",
        "thumbnail_en":  "",
        "description_en":  "",
        "loadstring":  "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/joustingmatch/Ouroboros/main/loader.lua\"))()",
        "created_at":  1790718911959
    },
    {
        "id":  "script-1790593586261",
        "title":  "Slayers 2 Script 🔥 แจก Config BigFroot ลงดันโคตรโกง! ปล่อยจอสบายๆ จบไวทุกเวฟ [Auto Dungeon]",
        "game":  "Slayers 2",
        "category":  "slayers 2",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  false,
        "isMobile":  true,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "Logo.ico",
        "description":  "สคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
        "title_en":  "",
        "thumbnail_en":  "",
        "description_en":  "",
        "loadstring":  "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/hanniii1/Loader/refs/heads/main/BFLoader.lua\"))()",
        "created_at":  1790718911951
    },
    {
        "id":  "script-1789880768357",
        "title":  "Slayers 2 Script 🔥 แจกสคริปต์โคตรโกง! Auto Boss, Dungeon Instakill + วาร์ปตลาดมืด [ไม่มีคีย์]",
        "game":  "Slayers 2",
        "category":  "slayers 2",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  true,
        "isMobile":  true,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "Logo.ico",
        "description":  "สคริปต์ Slayers 2 อัปเดตล่าสุด ฟังก์ชันครบ ใช้งานง่าย ปลอดภัย",
        "title_en":  "Slayers 2 Script - Auto Farm \u0026 Hub",
        "thumbnail_en":  "",
        "description_en":  "",
        "loadstring":  "loadstring(game:HttpGet(\"https://api.luarmor.net/files/v4/loaders/aa4e52f143ce2264c6fc74475781d247.lua\"))()",
        "created_at":  1790174330341
    },
    {
        "id":  "script-1789880900671",
        "title":  "Slayers 2 Script 🔥 แจกฟรี ไม่มีคีย์! Auto Farm \u0026 Auto Dungeon",
        "game":  "slayers 2",
        "category":  "slayers 2",
        "version":  "v1.0",
        "updated":  "วันนี้",
        "isKeyless":  true,
        "isMobile":  false,
        "isPC":  true,
        "status":  "working",
        "badge":  "มาใหม่",
        "thumbnail":  "Logo.ico",
        "description":  "0",
        "title_en":  "Slayers 2 Script - Auto Farm \u0026 Hub",
        "thumbnail_en":  "",
        "description_en":  "",
        "loadstring":  "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/gather1231-source/Freemium/refs/heads/main/FreemiumLoader\"))()",
        "created_at":  1790174330332
    }
];

function getScriptsStorageKey() {
    if (typeof window !==  undefined) {
        if (window.FirebaseDB && typeof window.FirebaseDB.getScriptsCacheKey === function) {
            return window.FirebaseDB.getScriptsCacheKey();
        }
        const override = sessionStorage.getItem(blacklist_active_db_target);
        if (override === hub_global) return nova_scripts_db_global;
        if (override === hub) return nova_scripts_db;
        if (window.location && window.location.hostname) {
            const host = window.location.hostname.toLowerCase();
            // ONLY hub.blacklisthub.workers.dev uses nova_scripts_db_global
            if (host.startsWith(hub.) || host.includes(global)) {
                return nova_scripts_db_global;
            }
        }
    }
    return nova_scripts_db;
}

// โหลดข้อมูลสคริปต์จาก LocalStorage หากมีการเพิ่ม/แก้ไข
function getScriptsData() {
    try {
        const key = getScriptsStorageKey();
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            let list = JSON.parse(saved);
            if (list && typeof list === object) {
                if (Array.isArray(list.value)) list = list.value;
                else if (Array.isArray(list.scripts)) list = list.scripts;
            }
            if (Array.isArray(list) && list.length > 0) {
                list.forEach(s => {
                    if (s) {
                        delete s.views;
                        delete s.likes;
                    }
                });
                return list;
            }
        }
    } catch (e) {
        console.warn(Could not load custom scripts, e);
    }
    return (Array.isArray(INITIAL_SCRIPTS) && INITIAL_SCRIPTS.length > 0) ? INITIAL_SCRIPTS : [];
}

function saveScriptsData(scripts) {
    const key = getScriptsStorageKey();
    if (Array.isArray(scripts)) {
        scripts.forEach(s => {
            if (s) {
                delete s.views;
                delete s.likes;
            }
        });
    }
    localStorage.setItem(key, JSON.stringify(scripts));
}