/**
 * 🗄️ Database Manager (SQLite via better-sqlite3)
 * จัดการฐานข้อมูลแบบถาวร รวดเร็ว และปลอดภัยจากข้อมูลสูญหาย
 */
let DatabaseSync;
try {
    DatabaseSync = require('node:sqlite').DatabaseSync;
} catch {
    DatabaseSync = require('better-sqlite3');
}

const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bot.sqlite');
const db = new DatabaseSync(dbPath);

// ปรับแต่งประสิทธิภาพ SQLite (WAL Mode เพื่อความเร็วและทนทาน)
try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA synchronous = NORMAL;');
} catch (e) {}

// ==========================================
// 🛠️ สร้างตารางฐานข้อมูลอัตโนมัติ
// ==========================================
db.exec(`
    -- ตารางผู้ใช้และลูกอมแบบแยกตามแต่ละเซิร์ฟเวอร์ (Guild-specific)
    CREATE TABLE IF NOT EXISTS guild_users (
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        candy INTEGER DEFAULT 0,
        total_voice_minutes INTEGER DEFAULT 0,
        last_voice_reward INTEGER DEFAULT 0,
        PRIMARY KEY (guildId, userId)
    );

    -- ตารางผู้ใช้และลูกอม (ตารางเก่าเพื่อรองรับ migration)
    CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        candy INTEGER DEFAULT 0,
        total_voice_minutes INTEGER DEFAULT 0,
        last_voice_reward INTEGER DEFAULT 0
    );

    -- ตารางการตั้งค่าเซิร์ฟเวอร์
    CREATE TABLE IF NOT EXISTS guild_settings (
        guildId TEXT PRIMARY KEY,
        logChannelId TEXT,
        antiScamEnabled INTEGER DEFAULT 1,
        voiceCandyRate INTEGER DEFAULT 5
    );

    -- ตารางบัญชีดำรูปภาพ (Blacklisted Images - MrBeast/Casino Scam)
    CREATE TABLE IF NOT EXISTS blacklisted_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT,
        hash TEXT,
        fileSize INTEGER,
        reason TEXT DEFAULT 'MrBeast Scam / Phishing Image',
        addedBy TEXT,
        createdAt INTEGER
    );

    -- ตารางตู้กาชาและยศรางวัล
    CREATE TABLE IF NOT EXISTS gacha_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL,
        roleId TEXT NOT NULL,
        roleName TEXT,
        weight REAL NOT NULL DEFAULT 10.0,
        rarity TEXT DEFAULT 'Normal'
    );

    -- ตารางแผงรับยศ (Role Panels)
    CREATE TABLE IF NOT EXISTS role_panels (
        messageId TEXT PRIMARY KEY,
        guildId TEXT,
        channelId TEXT,
        embedData TEXT,
        rolesJson TEXT
    );

    -- ตารางกระดานผู้นำ (Leaderboard Panels)
    CREATE TABLE IF NOT EXISTS leaderboard_panels (
        guildId TEXT PRIMARY KEY,
        channelId TEXT,
        messageId TEXT,
        updatedAt INTEGER
    );

    -- ตารางห้อง Voice 24 ชม. (24/7 Voice Channel)
    CREATE TABLE IF NOT EXISTS voice_247 (
        guildId TEXT PRIMARY KEY,
        channelId TEXT NOT NULL
    );
`);

// Migration: ย้ายข้อมูลจาก users เดิมมายัง guild_users (ถ้ามี)
try {
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (tableInfo) {
        const existingCount = db.prepare('SELECT COUNT(*) as cnt FROM guild_users').get()?.cnt || 0;
        if (existingCount === 0) {
            const panels = db.prepare('SELECT guildId FROM leaderboard_panels LIMIT 1').all();
            const defaultGuildId = panels.length > 0 ? panels[0].guildId : '1499540513777254621';
            db.exec(`
                INSERT OR IGNORE INTO guild_users (guildId, userId, candy, total_voice_minutes, last_voice_reward)
                SELECT '${defaultGuildId}', userId, candy, total_voice_minutes, last_voice_reward FROM users;
            `);
        }
    }
} catch (e) {
    console.warn('[DB Migration] Warning:', e.message);
}

// ==========================================
// 🍬 User & Candy Helpers (แยกข้อมูลตาม Guild / เซิร์ฟเวอร์)
// ==========================================
const getUser = db.prepare('SELECT * FROM guild_users WHERE guildId = ? AND userId = ?');
const createUser = db.prepare('INSERT OR IGNORE INTO guild_users (guildId, userId, candy, total_voice_minutes, last_voice_reward) VALUES (?, ?, 0, 0, 0)');
const addCandy = db.prepare('UPDATE guild_users SET candy = candy + ?, last_voice_reward = ? WHERE guildId = ? AND userId = ?');
const deductCandy = db.prepare('UPDATE guild_users SET candy = candy - ? WHERE guildId = ? AND userId = ? AND candy >= ?');
const setCandy = db.prepare('UPDATE guild_users SET candy = ? WHERE guildId = ? AND userId = ?');
const addVoiceMinute = db.prepare('UPDATE guild_users SET total_voice_minutes = total_voice_minutes + 1, last_voice_reward = ? WHERE guildId = ? AND userId = ?');
const addVoiceCandyAndMinute = db.prepare('UPDATE guild_users SET candy = candy + 1, total_voice_minutes = total_voice_minutes + 1, last_voice_reward = ? WHERE guildId = ? AND userId = ?');

const BOT_USER_IDS = new Set(['1562414895138480188', '1549395921228271686']);

function isBotUserId(userId) {
    return BOT_USER_IDS.has(userId);
}

function getCandyBalance(guildId, userId) {
    // รองรับการเรียกแบบเดิม getCandyBalance(userId) ในกรณีฉุกเฉิน
    if (!userId && guildId) {
        userId = guildId;
        guildId = null;
    }
    if (!guildId || !userId || isBotUserId(userId)) return 0;
    createUser.run(guildId, userId);
    const row = getUser.get(guildId, userId);
    return row ? row.candy : 0;
}

/**
 * ติดตามเวลาการอยู่ในห้องเสียงทุกๆ 1 นาที (แยกตามแต่ละเซิร์ฟเวอร์)
 * อัตรา: 1 ชั่วโมง (60 นาที) ได้ 10 เม็ด -> ทุกๆ 6 นาทีได้รับ 1 เม็ด สะสมถาวร
 * (บอทที่ออนไลน์ 24 ชม. ไม่นับลูกอมและไม่นับนาทีเด็ดขาด)
 */
function trackVoiceMinute(guildId, userId) {
    if (!guildId || !userId || isBotUserId(userId)) return { rewarded: false, candy: 0, totalMinutes: 0 };
    createUser.run(guildId, userId);
    const now = Date.now();
    const user = getUser.get(guildId, userId);
    const currentMinutes = user ? (user.total_voice_minutes || 0) : 0;
    const newMinutes = currentMinutes + 1;

    if (newMinutes % 6 === 0) {
        addVoiceCandyAndMinute.run(now, guildId, userId);
        return { rewarded: true, candy: 1, totalMinutes: newMinutes };
    } else {
        addVoiceMinute.run(now, guildId, userId);
        return { rewarded: false, candy: 0, totalMinutes: newMinutes };
    }
}

function rewardVoiceCandy(guildId, userId, amount = 10) {
    if (!guildId || !userId) return 0;
    createUser.run(guildId, userId);
    const now = Date.now();
    addCandy.run(amount, now, guildId, userId);
    return getCandyBalance(guildId, userId);
}

function consumeCandy(guildId, userId, amount = 10) {
    if (!guildId || !userId) return false;
    createUser.run(guildId, userId);
    const info = deductCandy.run(amount, guildId, userId, amount);
    return info.changes > 0;
}

function modifyUserCandy(guildId, userId, newAmount) {
    if (!guildId || !userId) return 0;
    createUser.run(guildId, userId);
    setCandy.run(newAmount, guildId, userId);
    return getCandyBalance(guildId, userId);
}

// ==========================================
// 🎰 Gacha Pool Helpers
// ==========================================
const getGuildGachaPool = db.prepare('SELECT * FROM gacha_pools WHERE guildId = ? ORDER BY weight DESC');
const addGachaRole = db.prepare('INSERT INTO gacha_pools (guildId, roleId, roleName, weight, rarity) VALUES (?, ?, ?, ?, ?)');
const removeGachaRole = db.prepare('DELETE FROM gacha_pools WHERE guildId = ? AND roleId = ?');
const clearGuildGacha = db.prepare('DELETE FROM gacha_pools WHERE guildId = ?');

function getGachaPool(guildId) {
    return getGuildGachaPool.all(guildId);
}

function saveGachaRole(guildId, roleId, roleName, weight, rarity = 'Normal') {
    // ลบอันเดิมออกก่อนถ้ามี เพื่ออัปเดตเรทใหม่
    removeGachaRole.run(guildId, roleId);
    addGachaRole.run(guildId, roleId, roleName, Number(weight), rarity);
    return getGachaPool(guildId);
}

function deleteGachaRole(guildId, roleId) {
    const info = removeGachaRole.run(guildId, roleId);
    return info.changes > 0;
}

// ==========================================
// 🛡️ Anti-Scam / Image Blacklist Helpers
// ==========================================
const getBlacklist = db.prepare("SELECT * FROM blacklisted_images WHERE guildId = ? OR guildId = 'GLOBAL'");
const checkImageBlacklist = db.prepare("SELECT * FROM blacklisted_images WHERE (guildId = ? OR guildId = 'GLOBAL') AND (hash = ? OR (fileSize > 0 AND fileSize = ?))");
const insertBlacklist = db.prepare('INSERT INTO blacklisted_images (guildId, hash, fileSize, reason, addedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
const deleteBlacklist = db.prepare('DELETE FROM blacklisted_images WHERE id = ?');

function isImageBlacklisted(guildId, hash, fileSize) {
    return checkImageBlacklist.get(guildId, hash || '', fileSize || 0);
}

function addImageBlacklist(guildId, hash, fileSize, reason, addedBy) {
    return insertBlacklist.run(guildId, hash, fileSize, reason, addedBy, Date.now());
}

// ==========================================
// ⚙️ Guild Settings Helpers
// ==========================================
const getSettings = db.prepare('SELECT * FROM guild_settings WHERE guildId = ?');
const initSettings = db.prepare(`
    INSERT OR IGNORE INTO guild_settings (guildId, logChannelId, antiScamEnabled, voiceCandyRate)
    VALUES (?, NULL, 1, 5)
`);

const updateLogChannel = db.prepare(`
    INSERT INTO guild_settings (guildId, logChannelId, antiScamEnabled, voiceCandyRate)
    VALUES (?, ?, 1, 5)
    ON CONFLICT(guildId) DO UPDATE SET
        logChannelId = excluded.logChannelId
`);

const updateAntiScam = db.prepare(`
    INSERT INTO guild_settings (guildId, logChannelId, antiScamEnabled, voiceCandyRate)
    VALUES (?, NULL, ?, 5)
    ON CONFLICT(guildId) DO UPDATE SET
        antiScamEnabled = excluded.antiScamEnabled
`);

function getGuildConfig(guildId) {
    initSettings.run(guildId);
    let conf = getSettings.get(guildId);
    return conf;
}

function setLogChannel(guildId, logChannelId) {
    updateLogChannel.run(guildId, logChannelId);
}

function setAntiScamEnabled(guildId, enabled) {
    const val = enabled ? 1 : 0;
    updateAntiScam.run(guildId, val);
    return getGuildConfig(guildId);
}

// ==========================================
// 🏆 Leaderboard Helpers (สถิติตลอดชีพ แยกตามแต่ละเซิร์ฟเวอร์ ไม่นับบอท)
// ==========================================
const getTopCandiesQuery = db.prepare(`SELECT userId, candy FROM guild_users WHERE guildId = ? AND candy > 0 AND userId NOT IN ('1562414895138480188', '1549395921228271686') ORDER BY candy DESC LIMIT ?`);
const getTopVoiceMinutesQuery = db.prepare(`SELECT userId, total_voice_minutes FROM guild_users WHERE guildId = ? AND total_voice_minutes > 0 AND userId NOT IN ('1562414895138480188', '1549395921228271686') ORDER BY total_voice_minutes DESC LIMIT ?`);

const savePanelQuery = db.prepare(`
    INSERT INTO leaderboard_panels (guildId, channelId, messageId, updatedAt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(guildId) DO UPDATE SET
        channelId = excluded.channelId,
        messageId = excluded.messageId,
        updatedAt = excluded.updatedAt
`);
const getPanelQuery = db.prepare('SELECT * FROM leaderboard_panels WHERE guildId = ?');
const getAllPanelsQuery = db.prepare('SELECT * FROM leaderboard_panels');

function getTopCandies(guildId, limit = 10) {
    if (!guildId) return [];
    return getTopCandiesQuery.all(guildId, limit);
}

function getTopVoiceMinutes(guildId, limit = 10) {
    if (!guildId) return [];
    return getTopVoiceMinutesQuery.all(guildId, limit);
}

function saveLeaderboardPanel(guildId, channelId, messageId) {
    savePanelQuery.run(guildId, channelId, messageId, Date.now());
}

function getLeaderboardPanel(guildId) {
    return getPanelQuery.get(guildId);
}

function getAllLeaderboardPanels() {
    return getAllPanelsQuery.all();
}

// ==========================================
// 🎧 24/7 Voice Channel Helpers
// ==========================================
const save247Query = db.prepare(`
    INSERT INTO voice_247 (guildId, channelId) VALUES (?, ?)
    ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId
`);
const get247Query = db.prepare('SELECT channelId FROM voice_247 WHERE guildId = ?');
const getAll247Query = db.prepare('SELECT * FROM voice_247');
const remove247Query = db.prepare('DELETE FROM voice_247 WHERE guildId = ?');

function save247Channel(guildId, channelId) {
    save247Query.run(guildId, channelId);
}

function get247Channel(guildId) {
    const row = get247Query.get(guildId);
    return row ? row.channelId : null;
}

function getAll247Channels() {
    return getAll247Query.all();
}

function remove247Channel(guildId) {
    const info = remove247Query.run(guildId);
    return info.changes > 0;
}

module.exports = {
    db,
    getCandyBalance,
    rewardVoiceCandy,
    trackVoiceMinute,
    consumeCandy,
    modifyUserCandy,
    getGachaPool,
    saveGachaRole,
    deleteGachaRole,
    clearGuildGacha,
    isImageBlacklisted,
    addImageBlacklist,
    getBlacklist,
    deleteBlacklist,
    getGuildConfig,
    setLogChannel,
    setAntiScamEnabled,
    getTopCandies,
    getTopVoiceMinutes,
    saveLeaderboardPanel,
    getLeaderboardPanel,
    getAllLeaderboardPanels,
    save247Channel,
    get247Channel,
    getAll247Channels,
    remove247Channel
};
