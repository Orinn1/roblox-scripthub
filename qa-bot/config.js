const path = require('path');
const fs = require('fs');

// โหลด .env จากในโฟลเดอร์ qa-bot ก่อน ถ้าไม่มีค่อยดูที่ root
const localEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(localEnvPath)) {
    require('dotenv').config({ path: localEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
    require('dotenv').config({ path: rootEnvPath });
}

// แยกห้อง Q&A ที่อนุญาตให้พิมพ์ถามได้เลยไม่ต้องแท็ก
const parseChannelList = (str) => {
    if (!str) return [];
    return str.split(',').map(id => id.trim()).filter(Boolean);
};

module.exports = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    aiProvider: process.env.AI_PROVIDER || (process.env.GROQ_API_KEY ? 'groq' : 'gemini'),
    qaChannelIds: parseChannelList(process.env.QA_CHANNEL_IDS),
    chatChannelIds: parseChannelList(process.env.CHAT_CHANNEL_IDS),
    allowDmChat: process.env.ALLOW_DM_CHAT !== 'false', // อนุญาตให้คุยใน DM ได้เป็นค่าเริ่มต้น
    privateReply: process.env.PRIVATE_REPLY === 'true',
    cooldownSeconds: parseInt(process.env.COOLDOWN_SECONDS, 10) || 3,
    maxHistoryTurns: parseInt(process.env.MAX_HISTORY_TURNS, 10) || 10,
    botColor: process.env.BOT_COLOR ? parseInt(process.env.BOT_COLOR.replace('#', '0x'), 16) : 0x00d2ff,
};
