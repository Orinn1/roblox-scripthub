/**
 * ⚙️ Slash Command: /setup_gacha_admin
 * ติดตั้งแผงควบคุมตู้กาชาและจัดการยศในห้องแอดมิน
 */
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChannelType, 
    ActionRowBuilder, 
    RoleSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup_gacha_admin')
        .setDescription('ติดตั้งแผงควบคุมตู้กาชาและจัดการยศในห้องแอดมิน')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('ห้องแชทที่ต้องการส่งแผงจัดการไปติดตั้ง (ถ้าไม่เลือกจะส่งห้องปัจจุบัน)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        const adminEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('🛠️ ห้องคุมหลังบ้านตู้กาชา (Gacha Admin Lab)')
            .setDescription(
                'ศูนย์สั่งการหลังบ้านตู้กาชา สำหรับแอดมินตัวตึงเท่านั้นน้า 👑\n' +
                'อยากเพิ่มยศ ปรับเรท หรือแจกลูกอม จัดการตรงนี้ได้เลย:\n\n' +
                '✨ **เพิ่มยศเข้าตู้ / ปรับเรทดรอป:**\n' +
                'จิ้มเลือกยศที่เมนูด้านล่างได้เลย เดี๋ยวมีฟอร์มขึ้นมาให้ใส่ค่าน้ำหนักกับระดับความแรร์แบบชิลๆ\n\n' +
                '⚡ **ปุ่มลัดจัดการด่วน:**\n' +
                '• `📋 ดูเรทและยศในตู้`: ส่องเปอร์เซ็นต์ดรอปกับค่าน้ำหนักล่าสุด\n' +
                '• `🗑️ ลบยศออกจากตู้`: ปลดเกษียณยศที่ไม่ใช้ออกจากตู้สุ่ม\n' +
                '• `🎁 เสก/มอบลูกอม`: เติมลูกอมให้สมาชิกในเซิร์ฟไวๆ'
            )
            .setFooter({ text: 'ระบบหลังบ้านแอดมิน • ห้ามกดเล่นน้าา' })
            .setTimestamp();

        // 1. Role Select Menu สำหรับเพิ่มยศหรือปรับเรท
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('gacha_add_role_select')
            .setPlaceholder('👉 จิ้มเลือกยศที่อยากใส่ตู้ หรืออยากปรับเรท...')
            .setMinValues(1)
            .setMaxValues(1);

        const row1 = new ActionRowBuilder().addComponents(roleSelect);

        // 2. ปุ่มจัดการด่วน
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('gacha_panel_list')
                .setLabel('ดูเรทและยศในตู้')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('gacha_panel_remove_role')
                .setLabel('ลบยศออกจากตู้')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('gacha_panel_give_candy')
                .setLabel('เสก/มอบลูกอม')
                .setEmoji('🎁')
                .setStyle(ButtonStyle.Success)
        );

        await targetChannel.send({
            embeds: [adminEmbed],
            components: [row1, row2]
        });

        await interaction.reply({
            content: `จัดไป! วางแผงคุมหลังบ้านไว้ที่ห้อง ${targetChannel} เรียบร้อยแล้วเตง ✨`,
            ephemeral: true
        });
    }
};
