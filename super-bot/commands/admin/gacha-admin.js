/**
 * ⚙️ Slash Command: /gacha_admin
 * จัดการตู้กาชาและแจกลูกอมสำหรับแอดมิน (เพิ่ม/ลบยศ, แก้ไขเรท, เสกลูกอม)
 */
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder,
    ActionRowBuilder,
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { saveGachaRole, deleteGachaRole, rewardVoiceCandy, modifyUserCandy } = require('../../database/db');
const { getGachaRateList } = require('../../modules/gacha-engine');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gacha_admin')
        .setDescription('จัดการระบบตู้กาชาและลูกอมสำหรับผู้ดูแลระบบ')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('panel')
                .setDescription('ติดตั้งแผงควบคุมตู้กาชาและจัดการยศในห้องแอดมิน')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('ห้องแชทที่ต้องการส่งแผงจัดการไปติดตั้ง (ถ้าไม่เลือกจะส่งห้องปัจจุบัน)')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('add_role')
                .setDescription('เพิ่มยศหรืออัปเดตเรทในตู้กาชา')
                .addRoleOption(opt => opt.setName('role').setDescription('ยศที่ต้องการใส่ลงในตู้').setRequired(true))
                .addNumberOption(opt => opt.setName('weight').setDescription('ค่าน้ำหนักเรท (เช่น 10, 25, 50)').setRequired(true))
                .addStringOption(opt => 
                    opt.setName('rarity')
                        .setDescription('ระดับความหายาก')
                        .addChoices(
                            { name: 'Common (ทั่วไป)', value: 'Common' },
                            { name: 'Rare (หายาก)', value: 'Rare' },
                            { name: 'Epic (สุดยอด)', value: 'Epic' },
                            { name: 'Legendary (ตำนาน)', value: 'Legendary' }
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('remove_role')
                .setDescription('ลบยศออกจากตู้กาชา')
                .addRoleOption(opt => opt.setName('role').setDescription('ยศที่ต้องการนำออก').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('give_candy')
                .setDescription('เสก/มอบลูกอมให้สมาชิก')
                .addUserOption(opt => opt.setName('user').setDescription('สมาชิกที่ต้องการมอบลูกอมให้').setRequired(true))
                .addIntegerOption(opt => opt.setName('amount').setDescription('จำนวนลูกอม (ใส่เลขติดลบเพื่อลด)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('ดูรายการยศและเรทปัจจุบันในตู้กาชา')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'panel') {
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

            const roleSelect = new RoleSelectMenuBuilder()
                .setCustomId('gacha_add_role_select')
                .setPlaceholder('👉 จิ้มเลือกยศที่อยากใส่ตู้ หรืออยากปรับเรท...')
                .setMinValues(1)
                .setMaxValues(1);

            const row1 = new ActionRowBuilder().addComponents(roleSelect);

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

            return interaction.reply({
                content: `จัดไป! วางแผงคุมหลังบ้านไว้ที่ห้อง ${targetChannel} เรียบร้อยแล้วเตง ✨`,
                ephemeral: true
            });
        }

        if (subcommand === 'add_role') {
            const role = interaction.options.getRole('role');
            const weight = interaction.options.getNumber('weight');
            const rarity = interaction.options.getString('rarity') || 'Normal';

            saveGachaRole(guildId, role.id, role.name, weight, rarity);

            const rates = getGachaRateList(guildId);
            const thisItem = rates.find(r => r.roleId === role.id);

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ ยัดยศลงตู้กาชาเรียบร้อย!')
                .setDescription(`ยศ: <@&${role.id}>\nระดับความแรร์: **${rarity}**\nค่าน้ำหนัก: **${weight}**\nโอกาสดรอปโดยประมาณ: **${thisItem ? thisItem.percent : weight}%**`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'remove_role') {
            const role = interaction.options.getRole('role');
            const success = deleteGachaRole(guildId, role.id);

            return interaction.reply({
                content: success ? `🗑️ ถอดยศ <@&${role.id}> ออกจากตู้เรียบร้อยวัยรุ่น!` : `⚠️ หายศ <@&${role.id}> ในตู้ไม่เจออ่าเตง`,
                ephemeral: true
            });
        }

        if (subcommand === 'give_candy') {
            const user = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');

            const newBalance = rewardVoiceCandy(guildId, user.id, amount);

            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('🎁 เสกลูกอมเรียบร้อยจ้า!')
                .setDescription(`เปย์ลูกอมให้ <@${user.id}> ในเซิร์ฟนี้ไป **${amount > 0 ? '+' + amount : amount}** เม็ด\n🍬 กระเป๋าตอนนี้มี: **${newBalance}** เม็ด ✨`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'list') {
            const rates = getGachaRateList(guildId);

            if (rates.length === 0) {
                return interaction.reply({
                    content: '⚠️ ตู้กาชายังโล่งอยู่เลยเตง! ใช้ `/gacha_admin add_role` เพื่อเพิ่มยศก่อนน้า',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📋 เรทตู้กาชาปัจจุบัน (Gacha Drop Rates)')
                .setDescription(
                    rates.map((r, i) => `${i + 1}. <@&${r.roleId}> | แรร์: **${r.rarity}** | เรทดรอป: **${r.percent}%** (น้ำหนัก: ${r.weight})`).join('\n')
                )
                .setFooter({ text: `ยศทั้งหมดในตู้: ${rates.length} ยศ` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
