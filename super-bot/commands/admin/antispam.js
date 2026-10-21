/**
 * 🛡️ Slash Command: /antispam
 * จัดการเปิด-ปิดระบบกันสแปมและสแกม (Anti-Spam & Anti-Scam Shield) ประจำเซิร์ฟเวอร์
 */
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits 
} = require('discord.js');
const { setAntiScamEnabled } = require('../../database/db');
const { generateAntiSpamPanel } = require('../../modules/anti-scam');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antispam')
        .setDescription('เปิดหรือปิดระบบป้องกันสแปมและสแกมในเซิร์ฟเวอร์')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('status')
                .setDescription('เลือกเปิดหรือปิดการทำงาน (ถ้าไม่เลือกจะเปิดแผงสลับสถานะ)')
                .addChoices(
                    { name: 'เปิดระบบ (Enable)', value: 'on' },
                    { name: 'ปิดระบบ (Disable)', value: 'off' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        const statusOption = interaction.options.getString('status');
        const guildId = interaction.guild.id;

        if (statusOption === 'on') {
            setAntiScamEnabled(guildId, true);
        } else if (statusOption === 'off') {
            setAntiScamEnabled(guildId, false);
        }

        const panel = generateAntiSpamPanel(interaction.guild);

        await interaction.reply({
            ...panel,
            ephemeral: true
        });
    }
};
