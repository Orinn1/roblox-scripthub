const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { askGemini, splitDiscordMessage } = require('../ai-service');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('ถามปัญหาหรือเรื่องสคริปต์กับ Mr.beast (ระวังโดนด่านะ 55555)')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('คำถามที่ต้องการถาม')
                .setRequired(true)
        ),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        await interaction.deferReply();

        try {
            const sessionId = interaction.guild 
                ? `${interaction.channelId}_${interaction.user.id}` 
                : `dm_${interaction.user.id}`;
            const userName = interaction.user.displayName || interaction.user.username;
            const answer = await askGemini(sessionId, question, userName);

            const chunks = splitDiscordMessage(answer);

            // ส่งชิ้นแรกพร้อมบอกคำถาม
            const embed = new EmbedBuilder()
                .setColor(config.botColor)
                .setAuthor({ 
                    name: `คำถามจาก: ${userName}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setDescription(`❓ **คำถาม:**\n> ${question}\n\n🤖 **คำตอบจาก Mr.beast:**\n${chunks[0]}`)
                .setFooter({ text: `โมเดล: ${config.groqModel || config.geminiModel} • แท็ก @Mr.beast หรือใช้ /chat เพื่อคุยเล่น` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // หากมีข้อความยาวเกิน chunk แรก ให้ส่งต่อแบบปกติ
            for (let i = 1; i < chunks.length; i++) {
                await interaction.followUp({ content: chunks[i] });
            }
        } catch (error) {
            console.error('[Command: ask Error]', error);
            await interaction.editReply({ content: `❌ เกิดข้อผิดพลาดในการประมวลผล: ${error.message}` });
        }
    }
};
