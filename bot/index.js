const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, ActivityType, Events, MessageFlags } = require('discord.js');
const botConfig = require('./config.js');
const db = require('../db.js');
const { getScripts, getScriptById, onScriptsSynced } = require('./scripts-helper.js');

if (!botConfig.token) {
    console.warn('⚠️ [Discord Bot] ยังไม่ได้ใส่ DISCORD_TOKEN ในไฟล์ .env');
    console.warn('⚠️ กรุณากรอก Token ในไฟล์ .env ก่อนเริ่มรันบอท');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Global Error Resilience
client.on('error', (err) => {
    if (err.code !== 10062 && err.code !== 40060) {
        console.error('⚠️ [Discord Client Error]:', err.message || err);
    }
});

process.on('unhandledRejection', (reason) => {
    const msg = reason?.message || String(reason);
    if (!msg.includes('10062') && !msg.includes('40060')) {
        console.warn('⚠️ [Unhandled Rejection]:', msg);
    }
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

// Update Activity Status
async function updateBotPresence() {
    try {
        const scripts = await getScripts();
        const scriptCount = scripts ? scripts.length : 0;
        if (client.user) {
            client.user.setActivity({
                name: `Roblox | /script ⚡ (${scriptCount} สคริปต์)`,
                type: ActivityType.Playing
            });
        }
    } catch (e) {}
}

onScriptsSynced(() => {
    updateBotPresence();
});

const { deployCommands } = require('./deploy-commands.js');
const { startYouTubeMonitor } = require('./youtube-monitor.js');
const { startRobloxMonitor } = require('./roblox-monitor.js');
const { startStockMonitor } = require('./stock-monitor.js');
const { handleBypassMessage } = require('./bypass-helper.js');
const { handleAntiRaidMessage } = require('./anti-raid.js');

client.once(Events.ClientReady, async (readyClient) => {
    const scripts = await getScripts();
    console.log(`🤖 Discord Bot ออนไลน์แล้วในชื่อ: ${readyClient.user.tag}`);
    console.log(`🌐 บอทเชื่อมต่อกับระบบฐานข้อมูล (${scripts.length} สคริปต์)`);
    updateBotPresence();
    setInterval(updateBotPresence, 5 * 60 * 1000); // ทุก 5 นาที

    // Auto deploy slash commands on startup
    await deployCommands();

    // Start YouTube Upload Monitor (Channel ID: 1549408423068573807)
    startYouTubeMonitor(client);

    // Start Roblox Update & Banwave Monitor (Channel ID: 1549456641379012709)
    startRobloxMonitor(client);

    // Start Blox Fruits Stock Monitor (Auto Stock Alert)
    startStockMonitor(client);
});

// Interaction Handling
client.on(Events.InteractionCreate, async (interaction) => {
    // 1. Handle Autocomplete
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            if (error.code !== 10062 && error.code !== 40060) {
                console.error(`[Autocomplete Error: ${interaction.commandName}]:`, error.message || error);
            }
        }
        return;
    }

    // 2. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        // ตรวจสอบสิทธิ์เฉพาะยศที่กำหนด (Role ID: 1549727990542508083)
        const requiredRoleId = botConfig.requiredRoleId || '1549727990542508083';
        const member = interaction.member;
        
        let isAdmin = false;
        if (interaction.memberPermissions && interaction.memberPermissions.has('Administrator')) {
            isAdmin = true;
        }

        let hasRequiredRole = false;
        if (member) {
            if (member.roles && member.roles.cache) {
                hasRequiredRole = member.roles.cache.has(requiredRoleId);
            } else if (Array.isArray(member.roles)) {
                hasRequiredRole = member.roles.includes(requiredRoleId);
            }
        }

        // 1. ผู้ใช้ต้องมียศ 1549727990542508083 หรือเป็น Administrator
        if (!hasRequiredRole && !isAdmin) {
            return interaction.reply({
                content: `⛔ **คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้!**\nเฉพาะผู้ที่มียศ <@&${requiredRoleId}> เท่านั้นที่สามารถใช้คำสั่งของบอทได้ครับ`,
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }

        // 2. สำหรับผู้ที่มียศ 1549727990542508083 (ที่ไม่ใช่ Admin): อนุญาตให้ใช้ได้เฉพาะ /script, /exploits และ /vip เท่านั้น
        const allowedRoleCommands = ['script', 'exploits', 'vip'];
        if (!isAdmin && !allowedRoleCommands.includes(interaction.commandName)) {
            return interaction.reply({
                content: `⛔ **ไม่อนุญาตให้ใช้งานคำสั่งนี้!**\nยศ <@&${requiredRoleId}> สามารถใช้งานได้เฉพาะคำสั่ง \`/script\`, \`/exploits\` และ \`/vip\` เท่านั้นครับ`,
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            if (error.code !== 10062 && error.code !== 40060) {
                console.error(`[Command Error: ${interaction.commandName}]:`, error);
            }
            const errorMessage = {
                content: '❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่งนี้ กรุณาลองใหม่อีกครั้ง',
                flags: MessageFlags.Ephemeral
            };
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (e) {}
        }
        return;
    }

    // 3. Handle Button Clicks (e.g. Copy Code Button)
    if (interaction.isButton()) {
        const customId = interaction.customId;

        if (customId.startsWith('get_code_')) {
            const scriptId = customId.replace('get_code_', '');
            const script = await getScriptById(scriptId) || (db && db.getScriptById ? db.getScriptById(scriptId) : null);

            if (!script) {
                return interaction.reply({
                    content: '❌ ไม่พบข้อมูลสคริปต์นี้ในฐานข้อมูล',
                    flags: MessageFlags.Ephemeral
                }).catch(() => {});
            }

            return interaction.reply({
                content: `📋 **โค้ด Loadstring สำหรับ [${script.title}]:**\n\`\`\`lua\n${script.loadstring || '-- ไม่พบโค้ด'}\n\`\`\`\n*(ข้อความนี้แสดงเฉพาะคุณ สามารถกดคัดลอกไปวางในตัวรันได้ทันที)*`,
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }

        if (customId === 'stock_refresh') {
            const stockCmd = client.commands.get('stock');
            if (stockCmd) {
                return stockCmd.execute(interaction);
            }
        }
    }
});

// Message Event Handler (Anti-Raid Guard & Auto-Bypass)
client.on(Events.MessageCreate, async (message) => {
    try {
        if (!message || message.author?.bot) return;

        // 1. 🛡️ Hardcore Anti-Raid Guard (ลบข้อความสแปม / ตัวอักษรยาว / Copypasta / Fast Spam / ปิดปากทันที)
        const isRaid = await handleAntiRaidMessage(message);
        if (isRaid) return; // ถ้าเป็นข้อความยิง จัดการทิ้งแล้วข้ามทันที

        // 2. Auto-Bypass Handler (ทำงานเฉพาะห้องที่กำหนด)
        const allowedChannelId = botConfig.bypassChannelId || '1549758071734140958';
        if (message.channelId === allowedChannelId) {
            await handleBypassMessage(message);
        }
    } catch (err) {
        console.error('[MessageCreate Error]:', err);
    }
});

// Start bot if token exists
if (botConfig.token) {
    client.login(botConfig.token).catch(err => {
        console.error('❌ ไม่สามารถล็อกอิน Discord Bot ได้:', err.message);
        console.error('โปรดตรวจสอบว่า DISCORD_TOKEN ในไฟล์ .env ถูกต้องและไม่ได้หมดอายุ');
    });
}

module.exports = { client, updateBotPresence };
