const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const botConfig = require('./config.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`[Warning] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

async function deployCommands() {
    if (!botConfig.token || !botConfig.clientId) {
        console.warn('⚠️ [Deploy Commands] ไม่พบ DISCORD_TOKEN หรือ DISCORD_CLIENT_ID ข้ามการลงทะเบียนคำสั่ง');
        return false;
    }

    const rest = new REST().setToken(botConfig.token);
    try {
        console.log(`⏳ กำลังเริ่มลงทะเบียน Slash Commands ทั้งหมด ${commands.length} คำสั่ง...`);

        if (botConfig.guildId) {
            const data = await rest.put(
                Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId),
                { body: commands },
            );
            console.log(`✅ สำเร็จ! ลงทะเบียนเรียบร้อยแล้ว ${data.length} คำสั่งใน Guild: ${botConfig.guildId}`);
        } else {
            const data = await rest.put(
                Routes.applicationCommands(botConfig.clientId),
                { body: commands },
            );
            console.log(`✅ สำเร็จ! ลงทะเบียนเรียบร้อยแล้ว ${data.length} คำสั่งแบบ Global`);
        }
        return true;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดขณะลงทะเบียนคำสั่ง:', error.message);
        return false;
    }
}

if (require.main === module) {
    if (!botConfig.token) {
        console.error('❌ ข้อผิดพลาด: ไม่พบ DISCORD_TOKEN ในไฟล์ .env');
        process.exit(1);
    }
    if (!botConfig.clientId) {
        console.error('❌ ข้อผิดพลาด: ไม่พบ DISCORD_CLIENT_ID ในไฟล์ .env');
        process.exit(1);
    }
    deployCommands();
}

module.exports = { deployCommands, commands };
