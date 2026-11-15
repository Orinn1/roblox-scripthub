const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionFlagsBits } = require('discord.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📖 ดูคำสั่งทั้งหมดของบอท BlacklistScriptx')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(botConfig.botColor)
            .setTitle('📖 คู่มือการใช้งานบอท BlacklistScriptx')
            .setDescription('รายการ Slash Commands ทั้งหมดที่คุณสามารถใช้งานได้:')
            .addFields(
                { name: '⚡ `/script <ชื่อสคริปต์/เกม>`', value: 'ค้นหาสคริปต์ ดูรายละเอียด และกดปุ่มเพื่อคัดลอกโค้ด Loadstring ได้ทันที' },
                { name: '👑 `/vip`', value: 'รับลิงก์เข้าใช้งานเว็บไซต์แบบ VIP ไร้โฆษณา 100% (เฉพาะผู้มียศ VIP)' },
                { name: '🆕 `/latest [จำนวน]`', value: 'ดูรายการสคริปต์ที่เพิ่งอัปเดตลงเว็บล่าสุด (1 - 10 รายการ)' },
                { name: '🍇 `/stock`', value: 'เช็คผลปีศาจและไอเทมในร้านค้า Blox Fruits แบบสดๆ (Mirage, Normal, Sword, Haki)' },
                { name: '🛡️ `/exploits`', value: 'เช็คสถานะตัวรันสคริปต์ (Executor Status) จาก WEAO API แบบเรียลไทม์' },
                { name: '📊 `/stats`', value: 'ตรวจสอบสถิติรวมของเว็บไซต์ จำนวนสคริปต์ ยอดวิว และสถานะระบบ' },
                { name: '🧪 `/testyt` *(Admin)*', value: 'ทดสอบส่งการ์ดแจ้งเตือนคลิป YouTube ล่าสุด' },
                { name: '🧪 `/testroblox` *(Admin)*', value: 'ทดสอบส่งการ์ดแจ้งเตือน Roblox Update หรือ Banwave' },
                { name: '🧹 `/purge <จำนวน>` *(Admin)*', value: 'ล้างข้อความขยะ/สแปมในห้องแชตรวดเดียว 1 - 100 ข้อความ' },
                { name: '🔒 `/lockdown <lock/unlock>` *(Admin)*', value: 'ล็อกห้องฉุกเฉินไม่ให้พิมพ์ หรือปลดล็อกห้องเมื่อปลอดภัย' },
                { name: '📖 `/help`', value: 'เปิดหน้านี้เพื่อดูคำสั่งทั้งหมด' }
            )
            .setFooter({ text: 'BlacklistScriptx Discord Assistant' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 เว็บไซต์หลัก')
                .setStyle(ButtonStyle.Link)
                .setURL(botConfig.websiteUrl)
        );

        return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    }
};
