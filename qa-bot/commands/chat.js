const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { askGemini, splitDiscordMessage } = require('../ai-service');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('ชวน Mr.beast คุยเล่น หรือมาท้าทายให้โดนด่า! 🔥')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('ข้อความที่อยากคุยหรือบวกกับ Mr.beast')
                .setRequired(true)
        ),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        await interaction.deferReply();

        try {
            const isDM = !interaction.guild;
            const sessionId = isDM ? `dm_${interaction.user.id}` : `${interaction.channelId}_${interaction.user.id}`;
            const userName = interaction.user.displayName || interaction.user.username;
            
            const replyText = await askGemini(sessionId, message, userName);
            const chunks = splitDiscordMessage(replyText);

            if (chunks.length > 0) {
                // ส่งคำตอบโดยแสดงข้อความที่ผู้ใช้ชวนคุยด้วย
                await interaction.editReply({ 
                    content: `💬 **คุณ ${userName}:** ${message}\n\n🤖 **Mr.beast:** ${chunks[0]}` 
                });
            }

            // หากข้อความยาวเกิน chunk แรก
            for (let i = 1; i < chunks.length; i++) {
                await interaction.followUp({ content: chunks[i] });
            }
        } catch (error) {
            console.error('[Command: chat Error]', error);
            await interaction.editReply({ content: `❌ ขออภัยค่ะ เกิดข้อผิดพลาดในการคุย: ${error.message}` });
        }
    }
};
