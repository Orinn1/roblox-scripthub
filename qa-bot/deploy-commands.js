const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

try {
    if (fs.existsSync(commandsPath) && fs.statSync(commandsPath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                console.log(`[Deploy] โหลดคำสั่ง: /${command.data.name}`);
            } else {
                console.log(`[Deploy Warning] ไฟล์ ${file} ขาด data หรือ execute property`);
            }
        }
    }
} catch (e) {
    console.warn('[Deploy Notice] ไม่สามารถอ่านโฟลเดอร์ commands ได้:', e.message);
}

// หากไม่มีคำสั่ง ให้ใช้ Built-in commands สำรอง
if (commands.length === 0) {
    try {
        const builtinCommands = require('./builtin-commands');
        for (const cmd of builtinCommands) {
            if (cmd && 'data' in cmd) {
                commands.push(cmd.data.toJSON());
                console.log(`[Deploy] โหลด Built-in คำสั่ง: /${cmd.data.name}`);
            }
        }
    } catch (err) {
        console.error('[Deploy Error] ไม่สามารถโหลด Built-in commands ได้:', err.message);
    }
}

if (!config.token || !config.clientId) {
    console.error('[Deploy Error] กรุณาตั้งค่า DISCORD_TOKEN และ DISCORD_CLIENT_ID ในไฟล์ .env ก่อนรัน deploy');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log(`[Deploy] กำลังเริ่มรีเฟรชคำสั่ง Slash Commands (${commands.length} คำสั่ง)...`);

        if (config.guildId) {
            // ลงทะเบียนเฉพาะกิลด์เพื่อผลทันที (ไม่ดีเลย์)
            console.log(`[Deploy] ลงทะเบียนแบบ Guild Commands ในเซิร์ฟเวอร์: ${config.guildId}`);
            const data = await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commands }
            );
            console.log(`✅ สำเร็จ! อัปเดต Slash Commands ${data.length} คำสั่งในเซิร์ฟเวอร์เรียบร้อยแล้ว`);
        } else {
            // ลงทะเบียนทั่วโลก
            console.log('[Deploy] ลงทะเบียนแบบ Global Commands...');
            const data = await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands }
            );
            console.log(`✅ สำเร็จ! อัปเดต Global Slash Commands ${data.length} คำสั่งเรียบร้อยแล้ว`);
        }
    } catch (error) {
        console.error('[Deploy Error]', error);
    }
})();
