/**
 * =========================================================================
 * 🚀 Multi-Bot Master Runner (รันบอท Discord ครบทั้ง 4 ตัวในเครื่องตัวเอง)
 * =========================================================================
 * - 🤖 Bot 1: BlacklistScriptx (Roblox Script Hub Bot)
 * - 🌸 Bot 2: แม่พระของเซนโย (Super Bot 24 ชม. + สิงห้องเสียง)
 * - 🐰 Bot 3: BunnyHelper (Fresshy Shop Bot ตรวจสลิป + เปิดตั๋ว)
 * - 🟣 Bot 4: blacklisthub (สถานะสตรีมมิ่งสีม่วง 24 ชม.)
 * 
 * ✨ คุณสมบัติ:
 * 1. เว้นระยะ Login แต่ละตัว 4 วินาที ป้องกัน Discord บล็อกการเชื่อมต่อ
 * 2. มีสีและป้ายกำกับชื่อบอทชัดเจนในคอนโซล
 * 3. ระบบ Auto-Restart: ถ้าบอทตัวไหนหลุด จะรีสตาร์ทตัวนั้นอัตโนมัติ
 * 4. กด Ctrl+C ปิดโปรเซสบอททุกตัวอย่างปลอดภัย
 * =========================================================================
 */
const { spawn } = require('child_process');
const path = require('path');

const BOTS = [
  {
    name: '🤖 RobloxHub',
    color: '\x1b[36m', // Cyan
    script: path.join(__dirname, 'bot', 'index.js'),
    delay: 1000
  },
  {
    name: '🌸 แม่พระ',
    color: '\x1b[35m', // Magenta
    script: path.join(__dirname, 'super-bot', 'index.js'),
    delay: 5000
  },
  {
    name: '🐰 ShopBot',
    color: '\x1b[32m', // Green
    script: path.join(__dirname, 'shop-bot', 'index.js'),
    delay: 9000
  },
  {
    name: '🟣 สตรีมม่วง',
    color: '\x1b[34m', // Blue
    script: path.join(__dirname, 'bot', 'presence-stream.js'),
    delay: 13000
  }
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const activeProcesses = new Map();
let isShuttingDown = false;

console.clear();
console.log(`${BOLD}\x1b[33m========================================================`);
console.log(`       🚀 DISCORD MULTI-BOT MASTER RUNNER (LOCAL)`);
console.log(`          กำลังเริ่มเปิดบอททั้ง 4 ตัวบนเครื่องของคุณ...`);
console.log(`========================================================${RESET}\n`);

function launchBot(bot) {
  if (isShuttingDown) return;

  const prefix = `${bot.color}[${bot.name}]${RESET}`;
  console.log(`${prefix} กำลังเริ่มทำงาน...`);

  const child = spawn(process.execPath, [bot.script], {
    cwd: __dirname,
    env: {
      ...process.env,
      IS_CHILD_WORKER: '1'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  activeProcesses.set(bot.name, child);

  child.stdout.on('data', (data) => {
    const lines = data.toString('utf8').split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${prefix} ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString('utf8').split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${prefix} \x1b[31m${line}${RESET}`);
      }
    });
  });

  child.on('exit', (code, signal) => {
    activeProcesses.delete(bot.name);
    if (!isShuttingDown) {
      console.warn(`\x1b[33m${prefix} ⚠️ บอทหยุดทำงาน (code: ${code}) -> จะรีสตาร์ทให้อัตโนมัติใน 5 วินาที...${RESET}`);
      setTimeout(() => {
        launchBot(bot);
      }, 5000);
    }
  });

  child.on('error', (err) => {
    console.error(`\x1b[31m${prefix} ❌ Spawn Error: ${err.message}${RESET}`);
  });
}

// Staggered boot
BOTS.forEach((bot) => {
  setTimeout(() => {
    launchBot(bot);
  }, bot.delay);
});

// Clean Exit
function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${BOLD}\x1b[31m🛑 กำลังปิดบอททุกตัวอย่างปลอดภัย...${RESET}`);
  for (const [name, child] of activeProcesses.entries()) {
    try {
      child.kill('SIGINT');
    } catch (e) {}
  }
  setTimeout(() => {
    process.exit(0);
  }, 1500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
