const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require('discord.js');
const { getFAQList } = require('../ai-service');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('faq')
        .setDescription('ดูคำถามที่พบบ่อย (FAQ) และวิธีแก้ไขปัญหาเบื้องต้น'),
    async execute(interaction) {
        const faqs = getFAQList();

        if (!faqs.length) {
            return interaction.reply({ 
                content: 'ℹ️ ยังไม่มีรายการคำถามที่พบบ่อยในระบบค่ะ', 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setColor(config.botColor)
            .setTitle('📚 รวมคำถามที่พบบ่อย (Frequently Asked Questions)')
            .setDescription('เลือกหัวข้อที่คุณต้องการทราบจากเมนูด้านล่างนี้ได้เลยค่ะ หรือจะพิมพ์ถาม AI ได้โดยตรงผ่านคำสั่ง `/ask` หรือแท็ก `@บอท` ก็ได้เช่นกันค่ะ')
            .setFooter({ text: 'เลือกหัวข้อเพื่อดูคำตอบทันที' })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('faq_select')
            .setPlaceholder('🔍 กรุณาเลือกคำถามที่ต้องการดูคำตอบ...')
            .addOptions(
                faqs.slice(0, 25).map(item => 
                    new StringSelectMenuOptionBuilder()
                        .setLabel(item.question.length > 90 ? item.question.substring(0, 87) + '...' : item.question)
                        .setValue(item.id)
                        .setDescription('คลิกเพื่อดูคำตอบอย่างละเอียด')
                )
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
