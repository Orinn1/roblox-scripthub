/**
 * 🍬 Slash Command: /candy
 * ดูจำนวนลูกอมสะสมของตัวเองหรือเพื่อน
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCandyBalance } = require('../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('candy')
        .setDescription('เช็คกระเป๋าลูกอมของตัวเองหรือส่องของเพื่อน')
        .addUserOption(opt => opt.setName('user').setDescription('อยากส่องกระเป๋าใครจิ้มเลย (ไม่เลือกคือดูของตัวเอง)')),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const balance = getCandyBalance(targetUser.id);
        const spinsAvailable = Math.floor(balance / 10);

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle(`🍬 คลังลูกอมของ ${targetUser.username}`)
            .setDescription(`ตอนนี้มีลูกอมตุนไว้ **${balance}** เม็ด ✨\n🎰 เอาไปกดหมุนตู้กาชาได้ตั้ง **${spinsAvailable}** ครั้ง!`)
            .addFields(
                { name: '💡 หาเม็ดเพิ่มยังไง?', value: 'แค่นั่งเม้าท์ในห้องพูดคุย (Voice) ชิลๆ ได้ฟรี ชม.ละ 10 เม็ด (แจกเรื่อยๆ 1 เม็ดทุก 6 นาที) ยิ่งอยู่นานยิ่งรวย!', inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'ใช้ 10 ลูกอมต่อการหมุนตู้ 1 ครั้งจ้า' });

        await interaction.reply({ embeds: [embed] });
    }
};
