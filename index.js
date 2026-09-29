/**
 * Entry point for bot hosting platforms (Pterodactyl, Discloud, Bot-Hosting, etc.)
 */
require('dotenv').config();

// 1. บอทเซิร์ฟเวอร์หลัก (Anti-Raid, Blox Fruits Stock, Roblox Alerts, Commands)
try {
    require('./bot/index.js');
} catch (err) {
    console.error('❌ [Server Bot Error]:', err.message);
}

// 2. บอทสถานะสตรีมมิ่ง 24/7 บัญชี Oasis (ม่วง 🟣 + GIF Satono Diamond + @ 𝙱𝚕𝚊𝚌𝚔𝚕𝚒𝚜𝚝 𝙷𝚞𝚋)
try {
    require('./bot/presence-stream.js');
} catch (err) {
    console.error('❌ [Presence Stream Error]:', err.message);
}
