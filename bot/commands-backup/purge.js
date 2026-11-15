const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('🧹 [Admin] ล้างข้อความขยะ/สแปมในห้องแชตทีเดียวจำนวนมาก')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('จำนวนข้อความที่ต้องการลบ (1 - 100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('เลือกลบเฉพาะข้อความของผู้ใช้คนนี้ (ไม่บังคับ)')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.memberPermissions || !interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: '⛔ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้ (ต้องการสิทธิ์ Manage Messages)',
                flags: MessageFlags.Ephemeral
            });
        }

        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const channel = interaction.channel;
            const messages = await channel.messages.fetch({ limit: amount });

            let toDelete = messages;
            if (targetUser) {
                toDelete = messages.filter(m => m.author.id === targetUser.id);
            }

            if (toDelete.size === 0) {
                return interaction.editReply({
                    content: '⚠️ ไม่พบข้อความที่ตรงตามเงื่อนไขให้ลบ'
                });
            }

            const deleted = await channel.bulkDelete(toDelete, true);
            return interaction.editReply({
                content: `✅ ลบข้อความสแปมสำเร็จทั้งหมด **${deleted.size}** ข้อความเรียบร้อยแล้ว!`
            });
        } catch (error) {
            console.error('[Purge Command Error]:', error);
            return interaction.editReply({
                content: `❌ เกิดข้อผิดพลาดในการลบข้อความ: ${error.message} *(หมายเหตุ: Discord ไม่อนุญาตให้ลบข้อความที่เก่าเกิน 14 วันแบบกลุ่ม)*`
            });
        }
    }
};
