/**
 * 🏆 Slash Command: /leaderboard
 * ดูทำเนียบกระดานผู้นำเศรษฐีลูกอมและสายคุยนานที่สุด
 */
const { SlashCommandBuilder } = require('discord.js');
const { generateLeaderboardData } = require('../../modules/leaderboard-updater');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('ส่องกระดานตัวตึง ใครรวยลูกอมหรือคุยนานสุดในเซิร์ฟ'),

    async execute(interaction) {
        const data = generateLeaderboardData();
        await interaction.reply({
            ...data,
            ephemeral: true
        });
    }
};
