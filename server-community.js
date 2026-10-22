/**
 * =========================================================================
 * 🌸🐰 Community & Shop Server (Group 2: Bot 2 + Bot 3)
 * =========================================================================
 * - Bot 2: แม่พระของเซนโย (Super Bot 24 ชม., Voice 24/7, Candy, Leaderboard)
 * - Bot 3: BunnyHelper (Fresshy Shop Bot, Ticket, Fast Slip QR Verification)
 * - Lightweight HTTP Server on PORT for Render Keep-Alive & Health Monitoring
 */
process.env.BOT_GROUP = 'community';
require('dotenv').config();

// Global hooks to prevent Cloudflare/Render 429 rate-limiting
try {
  const { WebSocketManager } = require('@discordjs/ws');
  WebSocketManager.prototype.fetchGatewayInformation = async function () {
    return {
      url: 'wss://gateway.discord.gg',
      shards: 1,
      session_start_limit: { total: 1000, remaining: 999, reset_after: 0, max_concurrency: 1 }
    };
  };
} catch (e) {}

const http = require('http');
const PORT = process.env.PORT || 3000;

// Lightweight HTTP server for Render Web Service binding
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.url === '/api/health' || req.url === '/health' || req.url === '/') {
    res.statusCode = 200;
    return res.end(JSON.stringify({
      status: 'ok',
      service: 'Community & Shop Server (Group 2)',
      bots: [
        '🌸 แม่พระของเซนโย (Super Bot 24/7)',
        '🐰 BunnyHelper (Fresshy Shop Bot)'
      ],
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌸🐰 [Community & Shop Server]: พร้อมทำงานบนพอร์ต ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================\n`);

  // 1️⃣ Bot 2: แม่พระของเซนโย (Super Bot 24 ชม.)
  setTimeout(() => {
    try {
      console.log('🌸 [Super Bot]: เริ่มต้นเปิด แม่พระของเซนโย...');
      require('./super-bot/index.js');
    } catch (superErr) {
      console.error('❌ [Super Bot Load Error]:', superErr.message);
    }
  }, 1500);

  // 2️⃣ Bot 3: BunnyHelper (Fresshy Shop Bot 24 ชม.)
  setTimeout(() => {
    try {
      console.log('🐰 [Shop Bot]: เริ่มต้นเปิด BunnyHelper (Fresshy Shop)...');
      require('./shop-bot/index.js');
    } catch (shopErr) {
      console.error('❌ [Shop Bot Load Error]:', shopErr.message);
    }
  }, 7000);
});

// Auto Keep-Alive (ถ้ามีการระบุ URL ภายนอกของ Render)
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_EXTERNAL_URL) {
  const https = require('https');
  setInterval(() => {
    try {
      https.get(`${RENDER_EXTERNAL_URL}/api/health`, () => {}).on('error', () => {});
    } catch (e) {}
  }, 10 * 60 * 1000);
}
