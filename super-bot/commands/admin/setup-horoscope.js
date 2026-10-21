/**
 * 🃏 Slash Command: /setup_horoscope
 * ติดตั้งตู้พยากรณ์เปิดไพ่ทาโรต์ (Tarot Card Horoscope Panel)
 * ให้สมาชิกเลือกได้ว่าจะดูดวงเรื่องอะไร (ความรัก, การงาน, การเงิน, ภาพรวม)
 */
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChannelType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    EmbedBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup_horoscope')
        .setDescription('ติดตั้งตู้เปิดไพ่ทาโรต์พยากรณ์ดวง (เลือกหมวดหมู่ได้) ในห้องที่เลือก')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('ห้องแชทที่ต้องการส่งตู้เปิดไพ่ทาโรต์ไปติดตั้ง')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');

        // Embed หน้าตู้ไพ่ทาโรต์
        const panelEmbed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('🔮 สำนักไพ่ทาโรต์แม่พระ (Daily Tarot Reading)')
            .setDescription(
                'ตั้งจิตนิ่งๆ นึกถึงเรื่องที่ค้างคาใจ... แล้วจิ้มเลือกเรื่องที่อยากรู้ด้านล่างได้เล้ยย!\n\n' +
                '💖 **เรื่องหัวใจ & คนคุย:** เค้าคิดยังไง มีแววสมหวังมั้ย หรือต้องพักก่อน\n' +
                '💼 **การงาน & การเรียน:** งานจะรอดมั้ย จะติดเอฟรึเปล่า โปรเจกต์จะปังมั้ย\n' +
                '💰 **การเงิน & โชคลาภ:** กระเป๋าจะแบนมั้ย ลาภลอยจะเข้าตอนไหน\n' +
                '🌟 **ดวงโดยรวมวันนี้:** เช็คพลังงานชีวิตประจำวัน พร้อมเลขนำโชคและสีมงคลเสริมเฮง\n\n' +
                '*คำทำนายเปิดดูได้แค่เราคนเดียวน้า แม่นไม่แม่นลองดู๊!*'
            )
            .setImage('https://media1.tenor.com/m/7x7K6hqJY6UAAAAC/umamusume-satono-diamond.gif')
            .setFooter({ text: 'จิ้มเลือกจากเมนูด้านล่าง หรือกดปุ่มด่วนได้เลยจ้า' })
            .setTimestamp();

        // 1. เมนูดรอปดาวน์เลือกเรื่องที่ต้องการดู
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('horoscope_select_topic')
            .setPlaceholder('🔮 เลือกเรื่องที่คุณต้องการเปิดไพ่ทาโรต์...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('💖 ดวงความรัก & คนคุย')
                    .setDescription('เปิดไพ่ทำนายเรื่องหัวใจ คนคุย แฟน และเสน่ห์')
                    .setValue('love')
                    .setEmoji('💖'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('💼 ดวงการงาน & การเรียน')
                    .setDescription('เปิดไพ่ทำนายเรื่องงาน ภาระหน้าที่ และการเรียน')
                    .setValue('work')
                    .setEmoji('💼'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('💰 ดวงการเงิน & โชคลาภ')
                    .setDescription('เปิดไพ่ทำนายเรื่องเงิน ลาภลอย และการลงทุน')
                    .setValue('money')
                    .setEmoji('💰'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('🌟 ดวงชะตาภาพรวมชีวิต')
                    .setDescription('เปิดไพ่ดูพลังงานชีวิตและโชคชะตาโดยรวมวันนี้')
                    .setValue('overall')
                    .setEmoji('🌟')
            );

        const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

        // 2. แถวปุ่มกดด่วน 1 คลิก
        const rowButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('horoscope_topic:love')
                .setLabel('ความรัก')
                .setEmoji('💖')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('horoscope_topic:work')
                .setLabel('การงาน')
                .setEmoji('💼')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('horoscope_topic:money')
                .setLabel('การเงิน')
                .setEmoji('💰')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('horoscope_topic:overall')
                .setLabel('ดวงรวม')
                .setEmoji('🌟')
                .setStyle(ButtonStyle.Secondary)
        );

        // ส่งตู้ไปยังห้องเป้าหมาย
        await targetChannel.send({
            embeds: [panelEmbed],
            components: [rowSelect, rowButtons]
        });

        // ตอบกลับแอดมิน
        await interaction.reply({
            content: `✅ วางสำนักไพ่ทาโรต์ลงห้อง ${targetChannel} เรียบร้อยแล้วจ้า! มามูกันโลดด`,
            ephemeral: true
        });
    }
};
