const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { forceSyncScripts } = require('../scripts-helper.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sync')
        .setDescription('🔄 ซิงค์สคริปต์ล่าสุดจาก Firebase เข้าบอททันที (ดึงข้อมูลล่าสุดจากเว็บ)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const scripts = await forceSyncScripts();
            const count = scripts ? scripts.length : 0;

            const embed = new EmbedBuilder()
                .setColor(0x00ff88)
                .setTitle('🔄 ซิงค์ข้อมูลสคริปต์สำเร็จ!')
                .setDescription(`บอทได้ดึงข้อมูลสคริปต์ล่าสุดจากระบบ Firebase เรียบร้อยแล้ว\n📊 **จำนวนสคริปต์ทั้งหมด:** \`${count}\` สคริปต์`)
                .setFooter({ text: '⚡ BlacklistScriptx Auto Sync Engine' })
                .setTimestamp();

            if (count > 0) {
                const sampleList = scripts.slice(0, 5).map((s, i) => `${i + 1}. **[${s.game || 'ทั่วไป'}]** ${s.title}`).join('\n');
                embed.addFields({
                    name: '📜 สคริปต์ล่าสุดในระบบ',
                    value: sampleList
                });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('🌐 ตรวจสอบบนเว็บไซต์')
                    .setStyle(ButtonStyle.Link)
                    .setURL(botConfig.websiteUrl)
            );

            return await interaction.editReply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error('[Sync Command Error]:', err);
            return await interaction.editReply({
                content: `❌ เกิดข้อผิดพลาดในการซิงค์ข้อมูล: ${err.message}`
            });
        }
    }
};
