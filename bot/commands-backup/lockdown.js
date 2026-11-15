const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('🔒 [Admin] ล็อกห้องหรือปลดล็อกห้องแชตฉุกเฉินเมื่อโดนยิง')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option =>
            option.setName('action')
                .setDescription('เลือกการทำงาน')
                .setRequired(true)
                .addChoices(
                    { name: '🔒 ล็อกห้อง (ห้ามทุกคนพิมพ์)', value: 'lock' },
                    { name: '🔓 ปลดล็อกห้อง (อนุญาตให้พิมพ์ตามปกติ)', value: 'unlock' }
                )
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('เหตุผลการล็อกห้อง (ไม่บังคับ)')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.memberPermissions || !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: '⛔ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้ (ต้องการสิทธิ์ Manage Channels)',
                ephemeral: true
            });
        }

        const action = interaction.options.getString('action');
        const reason = interaction.options.getString('reason') || 'ตรวจพบการก่อกวน / ยิงห้องแชต';
        const channel = interaction.channel;
        const everyoneRole = interaction.guild.roles.everyone;

        try {
            if (action === 'lock') {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                    AddReactions: false
                });

                const lockEmbed = new EmbedBuilder()
                    .setTitle('🔒 ห้องนี้ถูกล็อกฉุกเฉิน (Lockdown Active)')
                    .setDescription(`แอดมินได้ทำการล็อกห้องนี้ชั่วคราว\n**เหตุผล:** ${reason}\n*(จะปลดล็อกให้พิมพ์ได้ตามปกติหลังจัดการสถานการณ์เรียบร้อย)*`)
                    .setColor(0xFF0033)
                    .setTimestamp();

                await interaction.reply({ embeds: [lockEmbed] });
            } else {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: null, // Reset to default role permissions
                    AddReactions: null
                });

                const unlockEmbed = new EmbedBuilder()
                    .setTitle('🔓 ปลดล็อกห้องเรียบร้อย (Channel Unlocked)')
                    .setDescription('สถานการณ์ปลอดภัยแล้ว สมาชิกสามารถพูดคุยได้ตามปกติครับ')
                    .setColor(0x00FF88)
                    .setTimestamp();

                await interaction.reply({ embeds: [unlockEmbed] });
            }
        } catch (error) {
            console.error('[Lockdown Command Error]:', error);
            return interaction.reply({
                content: `❌ ไม่สามารถดำเนินการได้: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
