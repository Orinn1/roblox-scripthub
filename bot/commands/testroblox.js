const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { fetchRobloxVersion, sendRobloxUpdateAlert, sendBanwaveAlert } = require('../roblox-monitor.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testroblox')
        .setDescription('🧪 ทดสอบส่งการ์ดแจ้งเตือน Roblox Update หรือ Banwave เข้าห้องที่กำหนด')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('เลือกประเภทการแจ้งเตือนที่ต้องการทดสอบ')
                .setRequired(true)
                .addChoices(
                    { name: '🚨 Roblox Update (อัปเดตแพตช์)', value: 'update' },
                    { name: '🛡️ Banwave Alert (เตือนภัยคลื่นแบน)', value: 'banwave' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const type = interaction.options.getString('type');
        const channelId = botConfig.robloxAlertChannelId || '1549456641379012709';

        if (type === 'update') {
            const info = await fetchRobloxVersion();
            const success = await sendRobloxUpdateAlert(interaction.client, info || {
                version: '0.739.0.7390687',
                clientVersionUpload: 'version-4310300497aa4917'
            }, true);

            if (success) {
                return interaction.editReply({
                    content: `✅ ส่งการ์ดจำลอง **Roblox Client Update** ไปที่ห้อง <#${channelId}> เรียบร้อยแล้ว! ลองเข้าไปเช็คดูได้เลยครับ 🚨`
                });
            } else {
                return interaction.editReply({
                    content: `⚠️ ไม่สามารถส่งข้อความเข้าห้อง <#${channelId}> ได้ กรุณาตรวจสอบว่าบอทมีสิทธิ์ Send Messages ในห้องนั้นหรือไม่`
                });
            }
        } else {
            const success = await sendBanwaveAlert(interaction.client, 'ตรวจพบการอัปเดตระบบตรวจจับโปรของ Byfron / Hyperion บนเซิร์ฟเวอร์ Roblox', true);

            if (success) {
                return interaction.editReply({
                    content: `✅ ส่งการ์ดจำลอง **Banwave Alert** ไปที่ห้อง <#${channelId}> เรียบร้อยแล้ว! ลองเข้าไปเช็คดูได้เลยครับ 🛡️`
                });
            } else {
                return interaction.editReply({
                    content: `⚠️ ไม่สามารถส่งข้อความเข้าห้อง <#${channelId}> ได้ กรุณาตรวจสอบว่าบอทมีสิทธิ์ Send Messages ในห้องนั้นหรือไม่`
                });
            }
        }
    }
};
