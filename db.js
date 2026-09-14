/**
 * SQLite Database Manager for RocketScriptz
 * Uses Node.js v24 native node:sqlite DatabaseSync (No external packages needed)
 * File: data/database.sqlite
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'database.sqlite');
const db = new DatabaseSync(DB_PATH);

// Initialize Tables
db.exec(`
CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    game TEXT NOT NULL,
    category TEXT NOT NULL,
    version TEXT DEFAULT 'v1.0',
    updated TEXT DEFAULT 'วันนี้',
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    isKeyless INTEGER DEFAULT 1,
    isMobile INTEGER DEFAULT 1,
    isPC INTEGER DEFAULT 1,
    status TEXT DEFAULT 'working',
    badge TEXT DEFAULT 'มาใหม่',
    thumbnail TEXT,
    description TEXT,
    loadstring TEXT NOT NULL,
    created_at INTEGER
);

CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
);
`);

// Default Initial Scripts Seed Data
const DEFAULT_SCRIPTS = [
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
        status: "working",
        badge: "ยอดนิยม",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์ Blox Fruits ที่เสถียรที่สุดในตอนนี้ ฟาร์มเลเวล 1-2600 ออโต้เควสต์ ล่าค่าหัว ออโต้เรดผลปีศาจ ดึงดาบคู่โซโร ผลตื่นครบทุกสาย ไม่หลุดง่าย",
        loadstring: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/realredz/BloxFruits/refs/heads/main/Source.lua"))()'
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
        badge: "กำลังฮิต",
        thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์เกมตกปลา Fisch ตกปลาติด 100% ออโต้เชคคันเบ็ด ออโต้ขายปลา ล็อกปลา Mythic และ Secret วาปไปเกาะต่างๆ ฟรี",
        loadstring: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/AhmadV99/Speed-Hub-X/main/Fisch.lua"))()'
    },
    {
        id: "steal-an-egg-hub",
        title: "Steal An Egg - Auto Steal & Hatch Fast",
        game: "Steal An Egg",
        category: "stealanegg",
        version: "v1.0",
        updated: "วันนี้",
        views: 4500,
        likes: 380,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "มาแรง",
        thumbnail: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
        description: "ขโมยไข่อัตโนมัติ ฟักไข่เร็ว เทเลพอร์ตขโมยรังของผู้เล่นคนอื่นแบบไม่มีใครจับได้ ปลดล็อคเพ็ทระดับสูงใน 5 นาที",
        loadstring: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/EggHub/StealAnEgg/main/Source.lua"))()'
    },
    {
        id: "blade-ball-ffj",
        title: "Blade Ball - FFJ Hub Auto Parry & Spam",
        game: "Blade Ball",
        category: "bladeball",
        version: "v2.1",
        updated: "3 วันที่แล้ว",
        views: 8900,
        likes: 760,
        isKeyless: false,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "กันบอล 100%",
        thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
        description: "ออโต้แพรี่ Auto Parry แม่นยำ 99.9% คำนวณระยะและความเร็วลูกบอลอัตโนมัติ มีโหมด Spam Block และ Visualizer แสดงวงแหวนระยะฟัน",
        loadstring: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/FFJ1/Roblox-Exploits/main/scripts/BladeBall.lua"))()'
    },
    {
        id: "pet-sim-99-zap",
        title: "Pet Simulator 99 - ZapHub Auto Farm & Coins",
        game: "Pet Simulator 99",
        category: "petsim99",
        version: "v4.0",
        updated: "เมื่อวาน",
        views: 11200,
        likes: 980,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "เหรียญไว",
        thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์ฟาร์มเพชรและเหรียญเร็วที่สุด ออโต้เคลียร์ด่าน ปลดล็อคโซนใหม่อัตโนมัติ ออโต้เปิดไข่แบบไม่แล็ก",
        loadstring: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/zap-hub/ps99/main/zap.lua"))()'
    },
    {
        id: "anime-defenders-hub",
        title: "Anime Defenders - Auto Place & Macro Farm",
        game: "Anime Defenders",
        category: "animedefenders",
        version: "v2.0",
        updated: "วันนี้",
        views: 7400,
        likes: 620,
        isKeyless: true,
        isMobile: true,
        isPC: true,
        status: "working",
        badge: "ผ่าน Infinite",
        thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        description: "บอทฟาร์มอัตโนมัติ วางยูนิตตามตำแหน่งที่กำหนด อัปเกรดยูนิตเองเมื่อเงินพอ เล่นโหมด Infinite และ Story ได้โดยไม่ต้องเฝ้าจอ",
        loadstring: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/AnimeDefenders/Script/main/AutoFarm.lua"))()'
    },
    {
        id: "rivals-aimbot",
        title: "Rivals - Silent Aim & Player ESP",
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
        badge: "ยิงหัว 100%",
        thumbnail: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&auto=format&fit=crop&q=80",
        description: "สคริปต์เกมยิงปืน Rivals ล็อกหัวเนียน Silent Aim ส่องทะลูกำแพง ESP แสดงเลือด ระยะห่าง และไร้แรงดีดปืน",
        loadstring: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/rivals-hub/Rivals/main/Loader.lua"))()'
    }
];

const DEFAULT_CONFIG = {
    siteName: "BlacklistScriptx",
    brandPrefix: "Blacklist",
    brandSuffix: "Scriptx",
    siteTagline: "ศูนย์รวมสคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
    unlockTasks: {
        youtubeChannelUrl: "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1",
        youtubeChannelName: "ช่อง Blacklistxyx",
        affiliateUrl: "https://shopee.co.th",
        affiliateTitle: "สนับสนุนช่อง / ดูสินค้าราคาพิเศษ",
        latestVideoUrl: "https://www.youtube.com/@Blacklistxyx",
        latestVideoTitle: "กดไลค์และคอมเมนต์คลิปแจกสคริปต์ล่าสุด",
        verificationSeconds: 5
    },
    socialLinks: {
        youtube: "https://www.youtube.com/@Blacklistxyx",
        discord: "https://discord.gg/YOUR_DISCORD",
        tiktok: "https://www.tiktok.com/@YOUR_TIKTOK"
    },
    lootlabsGate: {
        enabled: true,
        token: "blacklist_vip",
        lootlabsUrl: "https://loot-link.com/s?example",
        expiryHours: 24,
        bypassMessage: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน LootLabs เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
    }
};

// Seed initial data if empty
function seedDatabaseIfEmpty() {
    const countRow = db.prepare("SELECT COUNT(*) AS total FROM scripts").get();
    if (countRow.total === 0) {
        console.log("[DB] Seeding default scripts into SQLite database...");
        // Check if data/scripts.json exists first to preserve user modifications
        let initialList = DEFAULT_SCRIPTS;
        const jsonPath = path.join(DATA_DIR, 'scripts.json');
        if (fs.existsSync(jsonPath)) {
            try {
                const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                if (Array.isArray(parsed) && parsed.length > 0) {
                    initialList = parsed;
                }
            } catch (e) {}
        }

        const insert = db.prepare(`
            INSERT INTO scripts 
            (id, title, game, category, version, updated, views, likes, isKeyless, isMobile, isPC, status, badge, thumbnail, description, loadstring, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const [i, s] of initialList.entries()) {
            insert.run(
                s.id || ('script-' + (Date.now() - i * 1000)),
                s.title || '',
                s.game || '',
                s.category || 'all',
                s.version || 'v1.0',
                s.updated || 'วันนี้',
                s.views || 0,
                s.likes || 0,
                s.isKeyless ? 1 : 0,
                s.isMobile ? 1 : 0,
                s.isPC ? 1 : 0,
                s.status || 'working',
                s.badge || '',
                s.thumbnail || '',
                s.description || '',
                s.loadstring || '',
                Date.now() - i * 1000
            );
        }
    }

    // Seed Config if empty
    const cfgCount = db.prepare("SELECT COUNT(*) AS total FROM config").get();
    if (cfgCount.total === 0) {
        let conf = DEFAULT_CONFIG;
        const cfgJsonPath = path.join(DATA_DIR, 'config.json');
        if (fs.existsSync(cfgJsonPath)) {
            try {
                conf = JSON.parse(fs.readFileSync(cfgJsonPath, 'utf8'));
            } catch (e) {}
        }
        saveConfig(conf);
    }
}

seedDatabaseIfEmpty();

// =============================================================================
// DB Operations API
// =============================================================================

function formatScriptRow(r) {
    if (!r) return null;
    return {
        id: r.id,
        title: r.title,
        game: r.game,
        category: r.category,
        version: r.version,
        updated: r.updated,
        views: Number(r.views) || 0,
        likes: Number(r.likes) || 0,
        isKeyless: Boolean(r.isKeyless),
        isMobile: Boolean(r.isMobile),
        isPC: Boolean(r.isPC),
        status: r.status,
        badge: r.badge,
        thumbnail: r.thumbnail,
        description: r.description,
        loadstring: r.loadstring,
        created_at: r.created_at
    };
}

function getAllScripts() {
    const rows = db.prepare("SELECT * FROM scripts ORDER BY created_at DESC").all();
    return rows.map(formatScriptRow);
}

function getScriptById(id) {
    const row = db.prepare("SELECT * FROM scripts WHERE id = ?").get(id);
    return formatScriptRow(row);
}

function addScript(s) {
    const id = s.id || ('script-' + Date.now());
    const createdAt = s.created_at || Date.now();

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO scripts 
        (id, title, game, category, version, updated, views, likes, isKeyless, isMobile, isPC, status, badge, thumbnail, description, loadstring, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        id,
        s.title || '',
        s.game || '',
        s.category ? s.category.toLowerCase() : 'all',
        s.version || 'v1.0',
        s.updated || 'วันนี้',
        Number(s.views) || 0,
        Number(s.likes) || 0,
        s.isKeyless ? 1 : 0,
        s.isMobile ? 1 : 0,
        s.isPC ? 1 : 0,
        s.status || 'working',
        s.badge || 'มาใหม่',
        s.thumbnail || '',
        s.description || '',
        s.loadstring || '',
        createdAt
    );

    // Sync to data/scripts.json as backup
    syncJsonBackup();

    return getScriptById(id);
}

function deleteScript(id) {
    const stmt = db.prepare("DELETE FROM scripts WHERE id = ?");
    const info = stmt.run(id);
    syncJsonBackup();
    return info.changes > 0;
}

function deleteMultipleScripts(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM scripts WHERE id IN (${placeholders})`);
    const info = stmt.run(...ids);
    syncJsonBackup();
    return info.changes;
}

function clearAllScripts() {
    db.exec("DELETE FROM scripts");
    syncJsonBackup();
    return true;
}

function resetDefaultScripts() {
    db.exec("DELETE FROM scripts");
    const insert = db.prepare(`
        INSERT INTO scripts 
        (id, title, game, category, version, updated, views, likes, isKeyless, isMobile, isPC, status, badge, thumbnail, description, loadstring, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [i, s] of DEFAULT_SCRIPTS.entries()) {
        insert.run(
            s.id,
            s.title,
            s.game,
            s.category,
            s.version,
            s.updated,
            s.views,
            s.likes,
            s.isKeyless ? 1 : 0,
            s.isMobile ? 1 : 0,
            s.isPC ? 1 : 0,
            s.status,
            s.badge,
            s.thumbnail,
            s.description,
            s.loadstring,
            Date.now() - i * 1000
        );
    }
    syncJsonBackup();
    return getAllScripts();
}

function getConfig() {
    const rows = db.prepare("SELECT key, value FROM config").all();
    const config = {};
    for (const r of rows) {
        try {
            config[r.key] = JSON.parse(r.value);
        } catch (e) {
            config[r.key] = r.value;
        }
    }
    return { ...DEFAULT_CONFIG, ...config };
}

function saveConfig(updates) {
    const insert = db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)");
    for (const [key, val] of Object.entries(updates)) {
        insert.run(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
    }
    // Also backup to config.json
    try {
        const full = getConfig();
        fs.writeFileSync(path.join(DATA_DIR, 'config.json'), JSON.stringify(full, null, 2), 'utf8');
    } catch (e) {}
    return getConfig();
}

function syncJsonBackup() {
    try {
        const scripts = getAllScripts();
        fs.writeFileSync(path.join(DATA_DIR, 'scripts.json'), JSON.stringify(scripts, null, 2), 'utf8');
    } catch (e) {}
}

function getDatabaseStats() {
    const scriptCount = db.prepare("SELECT COUNT(*) AS total FROM scripts").get().total;
    let size = 0;
    try {
        if (fs.existsSync(DB_PATH)) {
            size = fs.statSync(DB_PATH).size;
        }
    } catch (e) {}

    return {
        totalScripts: scriptCount,
        dbPath: DB_PATH,
        sizeBytes: size,
        sizeFormatted: (size / 1024).toFixed(1) + ' KB'
    };
}

module.exports = {
    db,
    DB_PATH,
    getAllScripts,
    getScriptById,
    addScript,
    deleteScript,
    deleteMultipleScripts,
    clearAllScripts,
    resetDefaultScripts,
    getConfig,
    saveConfig,
    getDatabaseStats
};
