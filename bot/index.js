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
        GatewayIntentBits.GuildMessages
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
                name: `สคริปต์ ${scriptCount} ตัวบนเว็บ ⚡`,
                type: ActivityType.Watching
            });
        }
    } catch (e) {}
}

client.once(Events.ClientReady, (readyClient) => {
    console.log(`🤖 Discord Bot ออนไลน์แล้วในชื่อ: ${readyClient.user.tag}`);
    console.log(`🌐 บอทเชื่อมต่อกับฐานข้อมูล SQLite (${db.getAllScripts().length} สคริปต์)`);
    updateBotPresence();
    setInterval(updateBotPresence, 5 * 60 * 1000); // ทุก 5 นาที
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

// Start bot if token exists
if (botConfig.token) {
    client.login(botConfig.token).catch(err => {
        console.error('❌ ไม่สามารถล็อกอิน Discord Bot ได้:', err.message);
        console.error('โปรดตรวจสอบว่า DISCORD_TOKEN ในไฟล์ .env ถูกต้องและไม่ได้หมดอายุ');
    });
}

module.exports = { client, updateBotPresence };
