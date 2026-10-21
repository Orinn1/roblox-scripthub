/**
 * 🏓 Slash Command: /ping
 * ตรวจสอบความเร็วและการตอบสนองของบอท
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('เช็คความเร็วและความลื่นของบอท'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: 'รอแป๊บนึงน้า กำลังเช็คปิงให้จ้า...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency = interaction.client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🏓 Pong! บอทยังลื่นหัวแตก')
            .addFields(
                { name: '⚡ ความไวตอบกลับ', value: `\`${latency} ms\``, inline: true },
                { name: '🌐 ปิง Discord', value: `\`${wsLatency} ms\``, inline: true },
                { name: '🤖 สภาพระบบ', value: 'ออนไลน์พร้อมลุย 24 ชม. สบายใจได้ 🚀', inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
