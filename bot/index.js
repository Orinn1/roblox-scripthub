const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, ActivityType, Events } = require('discord.js');
const botConfig = require('./config.js');
const db = require('../db.js');

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
function updateBotPresence() {
    try {
        const scripts = db.getAllScripts();
        const scriptCount = scripts ? scripts.length : 0;
        if (client.user) {
            client.user.setActivity({
                name: `Roblox | /script ⚡ (${scriptCount} สคริปต์)`,
                type: ActivityType.Playing
            });
        }
    } catch (e) {}
}

const { deployCommands } = require('./deploy-commands.js');
const { startYouTubeMonitor } = require('./youtube-monitor.js');
const { startRobloxMonitor } = require('./roblox-monitor.js');
const { handleBypassMessage } = require('./bypass-helper.js');

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`🤖 Discord Bot ออนไลน์แล้วในชื่อ: ${readyClient.user.tag}`);
    console.log(`🌐 บอทเชื่อมต่อกับฐานข้อมูล SQLite (${db.getAllScripts().length} สคริปต์)`);
    updateBotPresence();
    setInterval(updateBotPresence, 5 * 60 * 1000); // ทุก 5 นาที

    // Auto deploy slash commands on startup
    await deployCommands();

    // Start YouTube Upload Monitor (Channel ID: 1549408423068573807)
    startYouTubeMonitor(client);

    // Start Roblox Update & Banwave Monitor (Channel ID: 1549456641379012709)
    startRobloxMonitor(client);
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
            console.error(`[Autocomplete Error: ${interaction.commandName}]:`, error);
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
        let hasPermission = false;

        if (member) {
            if (member.roles && member.roles.cache) {
                hasPermission = member.roles.cache.has(requiredRoleId);
            } else if (Array.isArray(member.roles)) {
                hasPermission = member.roles.includes(requiredRoleId);
            }

            // อนุญาตให้ Administrator หรือเจ้าของเซิร์ฟเวอร์ด้วย
            if (!hasPermission && interaction.memberPermissions && interaction.memberPermissions.has('Administrator')) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return interaction.reply({
                content: `⛔ **คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้!**\nเฉพาะผู้ที่มียศ <@&${requiredRoleId}> เท่านั้นที่สามารถใช้คำสั่งของบอทได้ครับ`,
                ephemeral: true
            });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`[Command Error: ${interaction.commandName}]:`, error);
            const errorMessage = {
                content: '❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่งนี้ กรุณาลองใหม่อีกครั้ง',
                ephemeral: true
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage).catch(() => {});
            } else {
                await interaction.reply(errorMessage).catch(() => {});
            }
        }
        return;
    }

    // 3. Handle Button Clicks (e.g. Copy Code Button)
    if (interaction.isButton()) {
        const customId = interaction.customId;

        if (customId.startsWith('get_code_')) {
            const scriptId = customId.replace('get_code_', '');
            const script = db.getScriptById(scriptId);

            if (!script) {
                return interaction.reply({
                    content: '❌ ไม่พบข้อมูลสคริปต์นี้ในฐานข้อมูล',
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: `📋 **โค้ด Loadstring สำหรับ [${script.title}]:**\n\`\`\`lua\n${script.loadstring || '-- ไม่พบโค้ด'}\n\`\`\`\n*(ข้อความนี้แสดงเฉพาะคุณ สามารถกดคัดลอกไปวางในตัวรันได้ทันที)*`,
                ephemeral: true
            });
        }
    }
});

// Auto-Bypass Handler (ทำงานเฉพาะห้องที่กำหนด)
client.on(Events.MessageCreate, async (message) => {
    try {
        if (message.author.bot) return;

        // ตรวจสอบว่าส่งในห้องที่กำหนดไว้หรือไม่ (ค่าเริ่มต้น: 1549758071734140958)
        const allowedChannelId = botConfig.bypassChannelId || '1549758071734140958';
        if (message.channelId !== allowedChannelId) return;

        await handleBypassMessage(message);
    } catch (err) {
        console.error('[MessageCreate Bypass Error]:', err);
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
