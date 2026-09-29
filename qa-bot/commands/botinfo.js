const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('ดูข้อมูลและสถานะการทำงานของบอท AI'),
    async execute(interaction) {
        const client = interaction.client;
        const uptime = Math.floor(client.uptime / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const uptimeStr = `${hours} ชม. ${minutes} นาที ${seconds} วินาที`;

        const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const activeModel = config.groqApiKey ? `Groq (${config.groqModel})` : `Gemini (${config.geminiModel})`;
        const embed = new EmbedBuilder()
            .setColor(config.botColor)
            .setTitle(`🤖 ข้อมูลบอท: ${client.user.username}`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🧠 สมองกล AI (Model)', value: `\`${activeModel}\``, inline: true },
                { name: '⚡ ความหน่วง (Ping)', value: `\`${client.ws.ping} ms\``, inline: true },
                { name: '⏱️ เวลาออนไลน์ (Uptime)', value: `\`${uptimeStr}\``, inline: true },
                { name: '🌐 จำนวนเซิร์ฟเวอร์', value: `\`${client.guilds.cache.size}\` เซิร์ฟเวอร์`, inline: true },
                { name: '💾 หน่วยความจำที่ใช้', value: `\`${memUsage} MB\``, inline: true },
                { name: '📦 Node / Discord.js', value: `\`${process.version}\` / \`v${djsVersion}\``, inline: true },
                { name: '🛡️ คูลดาวน์ต่อคำถาม', value: `\`${config.cooldownSeconds} วินาที\``, inline: true },
                { name: '💭 ความจำย้อนหลัง', value: `\`${config.maxHistoryTurns} บทสนทนา\``, inline: true }
            )
            .setFooter({ text: 'บอทตอบคำถามอัจฉริยะ พร้อมให้บริการ 24 ชม.' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
