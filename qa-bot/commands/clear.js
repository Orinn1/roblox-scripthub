const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { clearSessionMemory } = require('../ai-service');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('ล้างความจำและประวัติการสนทนาของ AI ในห้องนี้'),
    async execute(interaction) {
        const isDM = !interaction.guild;
        const userSessionKey = isDM ? `dm_${interaction.user.id}` : `${interaction.channelId}_${interaction.user.id}`;
        const clearedUser = clearSessionMemory(userSessionKey);
        const clearedChannel = clearSessionMemory(interaction.channelId);
        const cleared = clearedUser || clearedChannel;

        const embed = new EmbedBuilder()
            .setColor(config.botColor)
            .setTitle('🧹 ล้างประวัติการสนทนาเรียบร้อยแล้ว')
            .setDescription(cleared 
                ? 'AI ได้ลืมบทสนทนาก่อนหน้านี้ทั้งหมดแล้วจ้า! สามารถเริ่มชวนคุยหรือถามหัวข้อใหม่ได้ทันทีเลยนะ 555 ✨' 
                : 'ยังไม่มีประวัติการสนทนาก่อนหน้านี้ที่ถูกบันทึกไว้ค่ะ สามารถเริ่มพิมพ์คุยได้เลยนะคะ!')
            .setFooter({ text: 'AI พร้อมสำหรับคำถามใหม่แล้ว ✨' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
