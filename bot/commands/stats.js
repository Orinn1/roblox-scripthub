const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionFlagsBits } = require('discord.js');
const db = require('../../db.js');
const { getScripts } = require('../scripts-helper.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 ตรวจสอบสถิติเว็บไซต์ BlacklistScriptx และสถานะระบบ')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const stats = db.getDatabaseStats ? db.getDatabaseStats() : {};
        const scripts = await getScripts();
        const totalViews = scripts.reduce((acc, s) => acc + (s.views || 0), 0);
        const totalLikes = scripts.reduce((acc, s) => acc + (s.likes || 0), 0);
        const keylessCount = scripts.filter(s => s.isKeyless).length;
        const mobileCount = scripts.filter(s => s.isMobile).length;

        const uptimeSeconds = Math.floor(process.uptime());
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        const uptimeStr = `${hours} ชม. ${minutes} นาที ${seconds} วินาที`;

        const embed = new EmbedBuilder()
            .setColor(botConfig.botColor)
            .setTitle('📊 ข้อมูลสถิติและสถานะระบบ BlacklistScriptx')
            .addFields(
                { name: '📜 สคริปต์ทั้งหมด', value: `**${scripts.length}** สคริปต์`, inline: true },
                { name: '🟢 สคริปต์ไร้คีย์ (Keyless)', value: `**${keylessCount}** สคริปต์`, inline: true },
                { name: '📱 รองรับมือถือ', value: `**${mobileCount}** สคริปต์`, inline: true },
                { name: '👁️ ยอดวิวรวมทั้งหมด', value: `**${totalViews.toLocaleString()}** ครั้ง`, inline: true },
                { name: '❤️ ยอดกดถูกใจรวม', value: `**${totalLikes.toLocaleString()}** ครั้ง`, inline: true },
                { name: '🛡️ IP ที่ถูกระงับ', value: `**${stats.totalBannedIps || 0}** รายการ`, inline: true },
                { name: '⏱️ บอทเปิดต่อเนื่อง', value: uptimeStr, inline: true },
                { name: '📶 ปิงบอท (WebSocket)', value: `**${interaction.client.ws.ping} ms**`, inline: true },
                { name: '💻 Node.js Runtime', value: `**${process.version}**`, inline: true }
            )
            .setFooter({ text: '⚡ BlacklistScriptx System Monitor' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 เข้าชมเว็บไซต์')
                .setStyle(ButtonStyle.Link)
                .setURL(botConfig.websiteUrl)
        );

        return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    }
};
