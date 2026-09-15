const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getScripts } = require('../scripts-helper.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('latest')
        .setDescription('⚡ ดูรายการสคริปต์ที่เพิ่งอัปเดตลงเว็บล่าสุด')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('จำนวนสคริปต์ที่ต้องการดู (1 - 10, ค่าเริ่มต้น: 5)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        ),

    async execute(interaction) {
        const count = interaction.options.getInteger('count') || 5;
        const allScripts = await getScripts();
        const latestScripts = allScripts.slice(0, count);

        if (latestScripts.length === 0) {
            return interaction.reply({
                content: '⚠️ ยังไม่มีสคริปต์ในฐานข้อมูลขณะนี้',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(botConfig.themeColor)
            .setTitle(`⚡ ${latestScripts.length} สคริปต์มาใหม่ & อัปเดตล่าสุด`)
            .setDescription(`รายชื่อสคริปต์ที่เพิ่งเพิ่มลงใน **BlacklistScriptx** ใช้คำสั่ง \`/script <ชื่อ>\` เพื่อดูรายละเอียดและรับโค้ดได้เลย!`)
            .setFooter({ text: `มีสคริปต์ทั้งหมดในระบบ ${allScripts.length} สคริปต์` })
            .setTimestamp();

        latestScripts.forEach((s, idx) => {
            const keyBadge = s.isKeyless ? '🟢 Keyless' : '🟠 Key';
            const platform = s.isMobile && s.isPC ? '📱/💻' : (s.isMobile ? '📱 Mobile' : '💻 PC');
            embed.addFields({
                name: `${idx + 1}. ${s.title}`,
                value: `🎮 เกม: **${s.game}** | ${keyBadge} | ${platform} | 👁️ ${s.views || 0} วิว\n> *${(s.description || 'สคริปต์อัปเดตล่าสุด').slice(0, 80)}...*`
            });
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 เข้าสู่เว็บไซต์หลัก')
                .setStyle(ButtonStyle.Link)
                .setURL(botConfig.websiteUrl)
        );

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
