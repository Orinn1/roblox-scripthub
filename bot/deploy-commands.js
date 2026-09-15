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

if (!botConfig.token) {
    console.error('❌ ข้อผิดพลาด: ไม่พบ DISCORD_TOKEN ในไฟล์ .env');
    console.error('กรุณาเปิดไฟล์ .env และใส่ DISCORD_TOKEN ก่อนรันสคริปต์นี้');
    process.exit(1);
}

if (!botConfig.clientId) {
    console.error('❌ ข้อผิดพลาด: ไม่พบ DISCORD_CLIENT_ID ในไฟล์ .env');
    console.error('กรุณาเปิดไฟล์ .env และใส่ DISCORD_CLIENT_ID (Application ID) ก่อนรันสคริปต์นี้');
    process.exit(1);
}

const rest = new REST().setToken(botConfig.token);

(async () => {
    try {
        console.log(`⏳ กำลังเริ่มลงทะเบียน Slash Commands ทั้งหมด ${commands.length} คำสั่ง...`);

        if (botConfig.guildId) {
            // Guild-specific registration (Instant updates for testing server)
            console.log(`📍 กำลังลงทะเบียนใน Guild ID: ${botConfig.guildId} (อัปเดตทันที)`);
            const data = await rest.put(
                Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId),
                { body: commands },
            );
            console.log(`✅ สำเร็จ! ลงทะเบียนเรียบร้อยแล้ว ${data.length} คำสั่งในเซิร์ฟเวอร์ทดสอบ`);
        } else {
            // Global registration (Available across all servers, can take up to 1 hour to propagate globally)
            console.log('🌐 กำลังลงทะเบียนแบบ Global (ทุกเซิร์ฟเวอร์)...');
            const data = await rest.put(
                Routes.applicationCommands(botConfig.clientId),
                { body: commands },
            );
            console.log(`✅ สำเร็จ! ลงทะเบียนเรียบร้อยแล้ว ${data.length} คำสั่งแบบ Global`);
        }
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดขณะลงทะเบียนคำสั่ง:', error);
    }
})();
