/**
 * =========================================================================
 * ☁️ DisCloud 24/7 Multi-Bot Master Entry Point
 * =========================================================================
 * รันบอทครบทั้ง 4 ตัวพร้อมกันในโปรเซสเดียว เพื่อให้อยู่ในขอบเขต RAM 100MB ของ DisCloud Free
 * - 🤖 Bot 1: BlacklistScriptx (Roblox Script Hub)
 * - 🌸 Bot 2: แม่พระของเซนโย (Super Bot 24 ชม. + สิงห้องเสียง)
 * - 🐰 Bot 3: BunnyHelper (Fresshy Shop Bot ตรวจสลิป + เปิดตั๋ว)
 * - 🟣 Bot 4: blacklisthub (สถานะสตรีมมิ่งสีม่วง 24 ชม.)
 * =========================================================================
 */
require('dotenv').config();

console.log('====================================================');
console.log('☁️ [DisCloud Master]: กำลังเริ่มระบบบอททั้งหมด 4 ตัว...');
console.log('====================================================');

// ป้องกัน Process ล่มจาก Unhandled Errors ใน DisCloud
process.on('unhandledRejection', (reason) => {
    const msg = reason?.message || String(reason);
    if (!msg.includes('10062') && !msg.includes('40060')) {
        console.warn('⚠️ [Unhandled Rejection]:', msg);
    }
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ [Uncaught Exception]:', err.message || err);
});

// 1️⃣ Bot 1: BlacklistScriptx (Roblox Script Hub)
setTimeout(() => {
    try {
        console.log('🤖 [Bot 1]: เริ่มต้นเปิด BlacklistScriptx...');
        const botConfig = require('./bot/config.js');
        if (process.env.DISCORD_TOKEN || botConfig.token) {
            require('./bot/index.js');
        }
    } catch (e) {
        console.error('❌ [Bot 1 Error]:', e.message);
    }
}, 1500);

// 2️⃣ Bot 2: แม่พระของเซนโย (Super Bot 24 ชม.)
setTimeout(() => {
    try {
        console.log('🌸 [Super Bot]: เริ่มต้นเปิด แม่พระของเซนโย...');
        require('./super-bot/index.js');
    } catch (superErr) {
        console.error('❌ [Super Bot Error]:', superErr.message);
    }
}, 6000);

// 3️⃣ Bot 3: BunnyHelper (Fresshy Shop Bot)
setTimeout(() => {
    try {
        console.log('🐰 [Shop Bot]: เริ่มต้นเปิด BunnyHelper (Fresshy Shop)...');
        require('./shop-bot/index.js');
    } catch (shopErr) {
        console.error('❌ [Shop Bot Error]:', shopErr.message);
    }
}, 11000);

// 4️⃣ Bot 4: blacklisthub (สตรีมมิ่งสีม่วง 24 ชม.)
setTimeout(() => {
    try {
        console.log('🟣 [Presence Stream]: เริ่มต้นรักษาสถานะสตรีมมิ่งสีม่วง 24/7...');
        require('./bot/presence-stream.js');
    } catch (presenceErr) {
        console.error('❌ [Presence Stream Error]:', presenceErr.message);
    }
}, 16000);
