const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📖 ดูคำสั่งทั้งหมดของบอท BlacklistScriptx'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(botConfig.botColor)
            .setTitle('⚡ คู่มือคำสั่ง Discord Bot - BlacklistScriptx')
            .setDescription('บอทเชื่อมต่อคลังสคริปต์ Roblox สำหรับค้นหาสคริปต์ ดึง Loadstring และเช็คสถานะตัวรัน')
            .addFields(
                {
                    name: '🔍 `/script <ชื่อเกม หรือ ชื่อสคริปต์>`',
                    value: 'ค้นหาสคริปต์ในระบบ มีระบบช่วยแนะนำคำค้นหา (Autocomplete) พร้อมดึงโค้ด Loadstring ให้ทันที'
                },
                {
                    name: '⚡ `/latest [จำนวน]`',
                    value: 'ดูสคริปต์ที่เพิ่งอัปเดตลงเว็บล่าสุด (ค่าเริ่มต้น 5 รายการ)'
                },
                {
                    name: '🛡️ `/exploits`',
                    value: 'ตรวจสอบสถานะตัวรันสคริปต์ (Executors Live Status) จาก WEAO API แบบเรียลไทม์'
                },
                {
                    name: '📊 `/stats`',
                    value: 'ดูข้อมูลสถิติภาพรวม ยอดวิว ยอดกดถูกใจ และจำนวนสคริปต์ทั้งหมด'
                },
                {
                    name: '📖 `/help`',
                    value: 'แสดงหน้าต่างช่วยเหลือและคำสั่งทั้งหมดนี้'
                }
            )
            .setFooter({ text: 'BlacklistScriptx Discord Assistant' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 เว็บไซต์หลัก')
                .setStyle(ButtonStyle.Link)
                .setURL(botConfig.websiteUrl)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
    }
};
