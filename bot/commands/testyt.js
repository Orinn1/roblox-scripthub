const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { fetchLatestVideo, sendVideoNotification } = require('../youtube-monitor.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testyt')
        .setDescription('🧪 ทดสอบส่งการ์ดแจ้งเตือนคลิป YouTube ล่าสุดเข้าห้องที่กำหนด')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const channelId = botConfig.youtubeNotifyChannelId || '1549408423068573807';
        const video = await fetchLatestVideo();

        if (!video) {
            return interaction.editReply({
                content: '❌ ไม่สามารถดึงข้อมูลคลิปล่าสุดจาก YouTube RSS Feed ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง'
            });
        }

        const success = await sendVideoNotification(interaction.client, video, true);

        if (success) {
            return interaction.editReply({
                content: `✅ ส่งการ์ดแจ้งเตือนคลิป **"${video.title}"** ไปที่ห้อง <#${channelId}> เรียบร้อยแล้ว! ลองเข้าไปเช็คดูในห้องได้เลยครับ 🚀`
            });
        } else {
            return interaction.editReply({
                content: `⚠️ ไม่สามารถส่งข้อความเข้าห้อง <#${channelId}> ได้ กรุณาตรวจสอบว่าบอทมีสิทธิ์ Send Messages ในห้องนั้นหรือไม่`
            });
        }
    }
};
