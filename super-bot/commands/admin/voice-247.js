/**
 * 🎧 Slash Command: /voice247
 * จัดการให้บอทเข้าสิงห้องพูดคุย Voice Channel ตลอด 24 ชม.
 */
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChannelType, 
    EmbedBuilder 
} = require('discord.js');

const { joinVoice, leaveVoice } = require('../../modules/voice-247');
const { get247Channel } = require('../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice247')
        .setDescription('จัดการให้บอทเข้าสิงห้องพูดคุย Voice Channel ตลอด 24 ชม.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('join')
                .setDescription('สั่งให้บอทเข้าสิงห้อง Voice ตลอด 24 ชม. (เลือกห้องได้ หรือจอยห้องที่คุณอยู่)')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('ห้อง Voice ที่ต้องการให้บอทไปสิง (ถ้าไม่เลือกจะเข้าห้องที่คุณอยู่)')
                        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('leave')
                .setDescription('สั่งให้บอทออกจากห้อง Voice และยกเลิกระบบสิง 24 ชม.')
        )
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('เช็คสถานะการเข้าห้อง Voice ปัจจุบันของบอท')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // 1. สั่งให้บอทเข้าห้อง Voice
        if (subcommand === 'join') {
            const targetChannel = interaction.options.getChannel('channel') || interaction.member.voice.channel;

            if (!targetChannel) {
                return interaction.reply({
                    content: '⚠️ เข้าห้องไหนดีเตง? เข้าไปนั่งในห้อง Voice ก่อน หรือจิ้มเลือกห้องในคำสั่งได้เลยน้า',
                    ephemeral: true
                });
            }

            const result = await joinVoice(interaction.client, guildId, targetChannel.id);
            if (!result.success) {
                return interaction.reply({
                    content: `❌ เข้าห้องไม่ได้ง่ะเตง: ${result.message}`,
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🎧 สิงห้อง Voice 24 ชม. สำเร็จ!')
                .setDescription(
                    `🎉 วาร์ปเข้าห้อง <#${targetChannel.id}> เรียบร้อยแล้วเตง!\n\n` +
                    `✨ **สถานะ:** 🟢 สิงอยู่ตลอด 24 ชม. ถาวร\n` +
                    `🔄 **ระบบ Reconnect:** แม้บอทจะรีสตาร์ทหรือมีคนแกล้งเตะ บอทจะรีบมุดกลับเข้ามาเองอัตโนมัติ!\n\n` +
                    `*(ถ้าอยากให้บอทออก ให้พิมพ์ \`/voice247 leave\` ได้เลยนะ)*`
                )
                .setFooter({ text: 'แม่พระของเซนโย • นั่งเป็นเพื่อน 24 ชม. ชิลๆ' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // 2. สั่งให้บอทออกจากห้อง Voice
        if (subcommand === 'leave') {
            const success = leaveVoice(interaction.client, guildId);

            if (!success) {
                return interaction.reply({
                    content: '⚠️ ตอนนี้บอทไม่ได้อยู่ในห้อง Voice ไหนเลยเตง',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('👋 ออกจากห้อง Voice เรียบร้อยแล้ว')
                .setDescription('วาร์ปออกจากห้องเรียบร้อยจ้า! ปิดระบบสิงห้อง 24 ชม. ในเซิร์ฟเวอร์นี้แล้วน้า ถ้าอยากให้กลับมาใหม่ใช้ `/voice247 join` ได้ตลอดเลย ✨')
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // 3. เช็คสถานะ
        if (subcommand === 'status') {
            const channelId = get247Channel(guildId);

            const embed = new EmbedBuilder()
                .setColor(channelId ? '#2ECC71' : '#F1C40F')
                .setTitle('🎧 สถานะระบบสิงห้อง Voice 24 ชม.')
                .setDescription(
                    channelId 
                        ? `🟢 **กำลังเปิดใช้งานอยู่!**\nสิงอยู่ในห้อง: <#${channelId}>\nบอทจะคอยเฝ้าห้องนี้ตลอด 24 ชม. ถาวรจ้า`
                        : `🔴 **ยังไม่ได้เปิดใช้งาน**\nยังไม่มีห้องที่ตั้งค่าไว้ ใช้คำสั่ง \`/voice247 join\` เพื่อให้บอทเข้าห้องได้เลยเตง!`
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
