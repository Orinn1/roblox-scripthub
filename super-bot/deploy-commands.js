/**
 * 📡 Slash Commands Deployment Script
 * ลงทะเบียนคำสั่ง Slash Commands ทั้งหมดเข้าสู่ Discord API
 */
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function loadCommandsRecursive(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            loadCommandsRecursive(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                console.log(`🔹 [Loaded Command]: /${command.data.name}`);
            } else {
                console.warn(`⚠️ [Warning] ไฟล์ ${file} ไม่มี property data หรือ execute`);
            }
        }
    }
}

loadCommandsRecursive(commandsPath);

const DEFAULT_SUPER_TOKEN = Buffer.from('TVRVMk1qUXhORGc1TlRFek9EUTRNREU0T0EuR3NuM1FDLlgyd2tydlQ3X3AzcDNTNVhhaVRJNG5UN3BRN1ZNekhrVDdxd2FJ', 'base64').toString('utf8');
const token = process.env.SUPER_BOT_TOKEN || process.env.DISCORD_SUPER_BOT_TOKEN || DEFAULT_SUPER_TOKEN;
const clientId = process.env.SUPER_BOT_CLIENT_ID || process.env.DISCORD_SUPER_BOT_CLIENT_ID || '1562414895138480188';
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
    console.error('❌ กรุณากรอก DISCORD_TOKEN และ DISCORD_CLIENT_ID');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`🚀 กำลังส่งคำสั่ง Slash Commands ทั้งหมด ${commands.length} คำสั่งขึ้น Discord...`);

        if (guildId) {
            // อัปเดตเฉพาะใน Guild (อัปเดตทันที ไม่ต้องรอคิว)
            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
            console.log(`✅ ลงทะเบียน Slash Commands เฉพาะเซิร์ฟเวอร์ (${guildId}) สำเร็จแล้ว: ${data.length} คำสั่ง`);
        } else {
            // อัปเดตทั่วโลก (Global - อาจใช้เวลาไม่เกิน 1 ชม.)
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
            console.log(`✅ ลงทะเบียน Global Slash Commands ทั่วโลกสำเร็จแล้ว: ${data.length} คำสั่ง`);
        }
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการลงทะเบียนคำสั่ง:', error);
    }
})();
