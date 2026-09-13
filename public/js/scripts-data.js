/**
 * คลังข้อมูลสคริปต์ (Script Database)
 * สามารถเพิ่ม ลบ แก้ไขสคริปต์ได้ที่นี่ หรือผ่านหน้าตั้งค่าบนเว็บ
 */
const INITIAL_SCRIPTS = [
    {
        id: "blox-fruits-redz",
        title: "Blox Fruits - Redz Hub (Auto Farm & Raid)",
        game: "Blox Fruits",
        category: "bloxfruits",
        version: "v3.2.0",
        updated: "วันนี้",
        views: 14850,
        likes: 1240,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working", // "working", "updated", "patched"
        badge: "🔥 ยอดนิยม",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์ Blox Fruits ที่เสถียรที่สุดในตอนนี้ ฟาร์มเลเวล 1-2600 ออโต้เควสต์ ล่าค่าหัว ออโต้เรดผลปีศาจ ดึงดาบคู่โซโร ผลตื่นครบทุกสาย ไม่หลุดง่าย",
        features: [
            "Auto Farm Level 1 - Max (เร็วมาก ไม่ค้าง)",
            "Auto Sea 1 / 2 / 3 (เดินทางข้ามทะเลอัตโนมัติ)",
            "Auto Soul Guitar / Cursed Dual Katana",
            "Auto Raid (ลงดันเจี้ยน อัปผลตื่น 100%)",
            "Teleport & Fruit Finder (แจ้งเตือนผลปีศาจเกิด)",
            "ESP Player & Chests"
        ],
        loadstring: `loadstring(game:HttpGet("https://raw.githubusercontent.com/realredz/BloxFruits/refs/heads/main/Source.lua"))()`
    },
    {
        id: "fisch-speed-hub",
        title: "Fisch - Speed Hub X (Auto Catch & Shake)",
        game: "Fisch",
        category: "fisch",
        version: "v1.8",
        updated: "2 วันที่แล้ว",
        views: 9230,
        likes: 854,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "🎣 กำลังฮิต",
        thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์เกมตกปลา Fisch ตกปลาติด 100% ออโต้เชคคันเบ็ด ออโต้ขายปลา ล็อกปลา Mythic และ Secret วาปไปเกาะต่างๆ ฟรี",
        features: [
            "Auto Catch Fish (ตกปลาอัตโนมัติ ไม่หลุด)",
            "Perfect Shake 100% (กดแถบเพอร์เฟกต์ทุกตัว)",
            "Auto Sell Fish (ขายปลาอัตโนมัติเมื่อกระเป๋าเต็ม)",
            "Teleport to Islands & Totems",
            "Infinite Oxygen & Walk on Water",
            "Auto Enchant Rod"
        ],
        loadstring: `loadstring(game:HttpGet("https://raw.githubusercontent.com/AhmadV99/Speed-Hub-X/main/Fisch.lua"))()`
    },
    {
        id: "steal-an-egg-hub",
        title: "Steal An Egg - Auto Steal & Hatch Fast",
        game: "Steal An Egg",
        category: "stealanegg",
        version: "v2.0",
        updated: "เมื่อวาน",
        views: 6410,
        likes: 512,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "🥚 มาแรง",
        thumbnail: "https://images.unsplash.com/photo-1516339901601-2e1562986307?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์ขโมยไข่ Steal An Egg ขโมยไข่ทันทีแบบไร้ดีเลย์ ออโต้ฟักไข่ ปลดล็อคความเร็วสูงสุด กระโดดสูง วาปกลับรังปลอดภัย",
        features: [
            "Auto Steal Egg (ขโมยไข่อัตโนมัติ วาปเก็บไว)",
            "Auto Hatch / Open Egg Fast",
            "Instant Deposit to Base",
            "Godmode / Invisible from guards",
            "Speed Boost & Infinite Jump",
            "Auto Upgrade Skills"
        ],
        loadstring: `loadstring(game:HttpGet("https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source"))()`
    },
    {
        id: "blox-fruits-w-azure",
        title: "Blox Fruits - W-Azure Hub (PVP & Auto Bounty)",
        game: "Blox Fruits",
        category: "bloxfruits",
        version: "v2.8.5",
        updated: "3 วันที่แล้ว",
        views: 11200,
        likes: 980,
        isKeyless: false,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "⚔️ PVP เทพ",
        thumbnail: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์สายล่าค่าหัวยอดนิยม ฟังก์ชั่น Silent Aim คอมโบสกิลอัตโนมัติ ล่าค่าหัว 30M ไวมาก ฟาร์มของครบ",
        features: [
            "Auto Bounty Hunt (30M Bounty Hunter)",
            "Auto Combo Skill (สลับผล/หมัด/ดาบ แม่นยำ)",
            "Silent Aim & Aimbot Guns",
            "Ken Haki V2 ESP",
            "Fast Attack & No Cooldown"
        ],
        loadstring: `loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/3b2169cf53bc6104dabe8e19562e5cc2.lua"))()`
    },
    {
        id: "blade-ball-auto-parry",
        title: "Blade Ball - FFJ Hub (Auto Parry 100% Curve)",
        game: "Blade Ball",
        category: "bladeball",
        version: "v4.5",
        updated: "วันนี้",
        views: 18900,
        likes: 1650,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "⚽ ฟาดไม่พลาด",
        thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์ฟาดบอลออโต้ Blade Ball คำนวณความเร็วบอลและทิศทางแบบเรียลไทม์ ฟาดลูกโค้งแม่นยำ 100% ไม่โดนแบน",
        features: [
            "Auto Parry 100% (คำนวณปิงและทิศทางอัตโนมัติ)",
            "Curve Ball Detection (จับทิศทางบอลโค้ง)",
            "Spam Click / Fast Block Close Range",
            "Auto Open Crates / Swords",
            "Custom Visualizer & Hitbox"
        ],
        loadstring: `loadstring(game:HttpGet("https://raw.githubusercontent.com/FFJ1/Roblox-Exploits/main/scripts/BladeBall.lua"))()`
    },
    {
        id: "anime-defenders-hub",
        title: "Anime Defenders - Auto Macro & Infinite Gem",
        game: "Anime Defenders",
        category: "animedefenders",
        version: "v1.4",
        updated: "4 วันที่แล้ว",
        views: 7850,
        likes: 640,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "💎 ฟาร์มเพชร",
        thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์บอท Anime Defenders ลงด่านสตอรี่/เรด วางยูนิต อัปเกรดอัตโนมัติ ฟาร์มเพชรไม่จำกัด รองรับการเปิดบอททิ้งไว้ข้ามคืน",
        features: [
            "Auto Story / Infinite / Raid Mode",
            "Smart Unit Placement (วางยูนิตตำแหน่งที่ดีที่สุด)",
            "Auto Upgrade & Auto Sell",
            "Auto Replay / Next Wave",
            "Anti-AFK 24 ชั่วโมง"
        ],
        loadstring: `loadstring(game:HttpGet("https://raw.githubusercontent.com/hubscripts/AnimeDefenders/main/Loader.lua"))()`
    },
    {
        id: "pet-sim-99-zap",
        title: "Pet Simulator 99 - Auto Farm Gems & Huge Pet",
        game: "Pet Simulator 99",
        category: "petsim99",
        version: "v2.1",
        updated: "5 วันที่แล้ว",
        views: 13400,
        likes: 1100,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "🐾 สัตว์เลี้ยงเทพ",
        thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์ฟาร์มเพชร PS99 เดินตีกล่องอัตโนมัติ วาปเก็บของตก ดึงสัตว์เลี้ยงระดับ Huge สุ่มไข่ไวไร้แอนิเมชั่น",
        features: [
            "Auto Farm Highest Zone (ฟาร์มโซนสูงสุด)",
            "Fast Auto Hatch Eggs (ฟักไข่ความเร็วสูง)",
            "Auto Collect Coins & Orbs",
            "Auto Mini-games (Stairway to Heaven, Digsite)",
            "Merchant Auto Buy"
        ],
        loadstring: `loadstring(game:HttpGet("https://raw.githubusercontent.com/ZepsyyCodesLUA/Utilities/main/PetSimulator99.lua"))()`
    },
    {
        id: "rivals-aimbot-esp",
        title: "Rivals - Silent Aim & Wallhack ESP",
        game: "Rivals",
        category: "rivals",
        version: "v1.2",
        updated: "วันนี้",
        views: 15600,
        likes: 1420,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "🎯 ยิงหัว 100%",
        thumbnail: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์เกมยิงปืน Rivals ล็อกหัวเนียน Silent Aim ส่องทะลูกำแพง ESP แสดงเลือด ระยะห่าง และไร้แรงดีดปืน",
        features: [
            "Silent Aim (ยิงโดนหัวแม้เล็งไม่ตรง)",
            "ESP Box, Tracers, Health Bar",
            "No Recoil & No Spread (ปืนนิ่ง)",
            "Speed Walk & Infinite Stamina",
            "Triggerbot (ยิงอัตโนมัติเมื่อเป้าตรงศัตรู)"
        ],
        loadstring: `loadstring(game:HttpGet("https://raw.githubusercontent.com/rivals-hub/Rivals/main/Loader.lua"))()`
    }
];

// โหลดข้อมูลสคริปต์จาก LocalStorage หากมีการเพิ่ม/แก้ไข
function getScriptsData() {
    try {
        const saved = localStorage.getItem("nova_scripts_db");
        if (saved) {
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
