const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 ตรวจสอบค่าความหน่วง (Ping & Latency) ของบอท KROZ'),
    
    async execute(interaction) {
        const sent = await interaction.reply({ content: '🏓 กำลังตรวจสอบสัญญาณ (Pinging)...', fetchReply: true });
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const websocketPing = interaction.client.ws.ping;

        let statusColor = 0x00FF88; // Green
        let statusEmoji = '🟢';
        let statusText = 'ยอดเยี่ยม (Excellent)';

        if (websocketPing > 250 || roundtripLatency > 300) {
            statusColor = 0xFF4444; // Red
            statusEmoji = '🔴';
            statusText = 'ล่าช้า (High Latency)';
        } else if (websocketPing > 120 || roundtripLatency > 180) {
            statusColor = 0xFFA500; // Orange
            statusEmoji = '🟡';
            statusText = 'ปานกลาง (Good)';
        }

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong! สถานะการเชื่อมต่อบอท KROZ')
            .setColor(statusColor)
            .addFields([
                { name: '⚡ Roundtrip Latency (API)', value: `\`${roundtripLatency}ms\``, inline: true },
                { name: '💓 WebSocket Ping', value: `\`${websocketPing}ms\``, inline: true },
                { name: '📶 สภาพการเชื่อมต่อ', value: `${statusEmoji} **${statusText}**`, inline: true }
            ])
            .setFooter({ text: 'KROZ Community • Powered by @itzkroz' })
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
