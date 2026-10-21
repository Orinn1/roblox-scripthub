/**
 * 🎰 Slash Command: /setup_gacha
 * ติดตั้งตู้สุ่มกาชารับยศ (Role Gacha GUI Panel) ในห้องที่เลือก
 */
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChannelType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup_gacha')
        .setDescription('ติดตั้งตู้สุ่มกาชารับยศ (Role Gacha Machine) ในห้องที่เลือก')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('ห้องแชทที่ต้องการส่งตู้สุ่มกาชาไปติดตั้ง')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');

        // Embed หน้าตู้กาชา
        const gachaEmbed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🎰 ตู้สุ่มกาชาล่ารางวัลยศตัวตึง (Role Gacha)')
            .setDescription(
                'มาหมุนกาชากันเต๊อะ! ใครดวงดีลุ้นรับยศระดับตำนานไปประดับชื่อเท่ๆ\n' +
                'แค่นั่งเม้าท์ในห้องพูดคุย (Voice) เพลินๆ รับฟรี ชม.ละ 10 เม็ด เอามาหมุนลุ้นได้เลย!\n\n' +
                '🪙 **ค่าหมุน:** ใช้ `10 ลูกอม` ต่อ 1 สปิน\n' +
                '🎁 **ของรางวัล:** ยศเท่ๆ ประจำเซิร์ฟ (มีหลายระดับความแรร์)\n' +
                '⚡ **ระบบแจกยศ:** สุ่มได้ปุ๊บ บอทใส่ยศเข้าตัวให้ทันทีอัตโนมัติ ไม่ต้องรอใครกดให้!\n\n' +
                '*ผลการสุ่มจะเห็นแค่เราคนเดียวน้า ไม่ต้องกลัวเด้งรกห้องแชท*'
            )
            .setImage('https://media1.tenor.com/m/h2sWwX5P4WcAAAAC/gacha-pull.gif')
            .setFooter({ text: 'ตู้เปิดตลอด 24 ชม. • ขอให้เกลือน้อยที่สุดนะวัยรุ่น 🍀' })
            .setTimestamp();

        // ปุ่มกดแถวที่ 1 (สำหรับผู้เล่นทั่วไป)
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('gacha_spin')
                .setLabel('หมุนกาชาล่ารางวัล (10 ลูกอม)')
                .setEmoji('🎰')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('gacha_balance')
                .setLabel('ดูกระเป๋าลูกอม')
                .setEmoji('🍬')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('gacha_rates')
                .setLabel('ส่องเรทของในตู้')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Secondary)
        );

        // ส่งตู้ไปยังห้องเป้าหมาย (มีเฉพาะปุ่มสำหรับสมาชิกทั่วไป)
        await targetChannel.send({
            embeds: [gachaEmbed],
            components: [row1]
        });

        // ตอบกลับแอดมิน
        await interaction.reply({
            content: `✅ ติดตั้งตู้สุ่มกาชาลงห้อง ${targetChannel} เรียบร้อยแล้วจ้า! ไปลุยกันเล้ยย`,
            ephemeral: true
        });
    }
};
