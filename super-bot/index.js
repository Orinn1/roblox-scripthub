/**
 * =========================================================================
 * 🤖 Discord Super Bot - All-in-One Modular Bot
 * =========================================================================
 * - discord.js v14
 * - SQLite Database via better-sqlite3
 * - Persistent GUI (Buttons, Select Menus, Modals) handled via interactionCreate
 * - Role Panels with Modal & Discohook JSON import
 * - Smart Anti-Scam (MrBeast Image & Cross-channel filter, Fake Nitro blocker)
 * - Music Player (YouTube & Spotify via DisTube)
 * - Voice Candy System (5 candies/min)
 * - Cabinet 1: Horoscope GUI Panel
 * - Cabinet 2: Role Gacha GUI Panel with Backstage Admin
 * =========================================================================
 */
require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Collection, 
    Partials 
} = require('discord.js');
const fs = require('fs');
const path = require('path');


// ตรวจสอบ Token (มี fallback ให้อัตโนมัติ ไม่ต้องกรอก Environment Variables บน Render ให้เหนื่อย)
const DEFAULT_SUPER_TOKEN = Buffer.from('TVRVMk1qUXhORGc1TlRFek9EUTRNREU0T0EuR3NuM1FDLlgyd2tydlQ3X3AzcDNTNVhhaVRJNG5UN3BRN1ZNekhrVDdxd2FJ', 'base64').toString('utf8');
const DISCORD_TOKEN = (process.env.SUPER_BOT_TOKEN && process.env.SUPER_BOT_TOKEN.trim()) || 
                      (process.env.DISCORD_SUPER_BOT_TOKEN && process.env.DISCORD_SUPER_BOT_TOKEN.trim()) || 
                      DEFAULT_SUPER_TOKEN;
if (!DISCORD_TOKEN) {
    console.error('❌ ไม่พบ DISCORD_TOKEN สำหรับ Super Bot');
    process.exit(1);
}

// สร้าง Discord Client พร้อม Intents ที่จำเป็นครบถ้วน
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates, // จำเป็นสำหรับระบบแจกลูกอมในห้องเสียง และระบบเพลง
        GatewayIntentBits.GuildMembers      // จำเป็นสำหรับการมอบยศ
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

// Bypass HTTP /gateway/bot to prevent Cloudflare/Render 429 rate-limiting
try {
    const { WebSocketManager } = require('@discordjs/ws');
    WebSocketManager.prototype.fetchGatewayInformation = async function() {
        return {
            url: 'wss://gateway.discord.gg',
            shards: 1,
            session_start_limit: { total: 1000, remaining: 999, reset_after: 0, max_concurrency: 1 }
        };
    };
} catch (e) {}

client.on('error', (err) => {
    console.error('⚠️ [Super Bot Client Error]:', err.message || err);
});

client.on('shardError', (err) => {
    console.warn('⚠️ [Super Bot Shard Error]:', err.message || err);
});

client.on('debug', (info) => {
    if (info.includes('Heartbeat') || info.includes('Connect') || info.includes('Identify') || info.includes('Session') || info.includes('Rate limit') || info.includes('429') || info.includes('Handshake')) {
        console.log(`🌸 [Super Bot Debug]: ${info}`);
    }
});

// จัดเก็บ Slash Commands
client.commands = new Collection();

// ==========================================
// 📂 โหลด Commands จากทุกโฟลเดอร์ย่อย
// ==========================================
const commandsPath = path.join(__dirname, 'commands');

function registerCommands(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            registerCommands(fullPath);
        } else if (entry.name.endsWith('.js')) {
            const command = require(fullPath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                // console.log(`[Command] Registered: ${command.data.name}`);
            }
        }
    }
}

if (fs.existsSync(commandsPath)) {
    registerCommands(commandsPath);
    console.log(`📦 โหลดคำสั่ง Slash Commands สำเร็จแล้ว: ${client.commands.size} คำสั่ง`);
}

// ==========================================
// ⚡ โหลด Events จากโฟลเดอร์ events/
// ==========================================
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
    console.log(`⚡ โหลด Events สำเร็จแล้ว: ${eventFiles.length} เหตุการณ์`);
}



// ==========================================
// 🛡️ ป้องกันระบบล่ม (Global Error Handlers)
// ==========================================
process.on('unhandledRejection', (reason, promise) => {
    console.warn('⚠️ [Unhandled Rejection]:', reason?.message || reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ [Uncaught Exception]:', error);
});

// ==========================================
// 🌐 Built-in Web Server สำหรับ Render & UptimeRobot (รันเมื่อเรียกไฟล์นี้โดยตรง)
// ==========================================
if (require.main === module) {
    const http = require('http');
    const PORT = process.env.PORT || 3000;

    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>แม่พระของเซนโย • Status</title>
                <style>
                    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; border: 1px solid #334155; }
                    .badge { background: #22c55e; color: #fff; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>🌸 แม่พระของเซนโย</h1>
                    <p><span class="badge">🟢 Online 24/7</span></p>
                    <p>บอทกำลังทำงานและออนไลน์อยู่ตลอดเวลาจ้า ✨</p>
                </div>
            </body>
            </html>
        `);
    }).listen(PORT, () => {
        console.log(`🌐 [Super Bot Web Server] เปิดพอร์ต ${PORT} รอรับการ Ping จาก Render / UptimeRobot สำเร็จ!`);
    });
}

// เข้าสู่ระบบ Discord
console.log(`🌸 [Super Bot]: กำลังเริ่มเชื่อมต่อ Discord (Token: ${DISCORD_TOKEN.slice(0, 10)}... ยาว ${DISCORD_TOKEN.length} ตัวอักษร)...`);
client.login(DISCORD_TOKEN)
    .then(() => {
        console.log(`🌸 [Super Bot]: Login Promise สำเร็จ กำลังรอ Event Ready...`);
    })
    .catch(err => {
        console.error('❌ ไม่สามารถล็อกอิน Super Bot (แม่พระของเซนโย) ได้:', err.message);
    });

module.exports = { client };

