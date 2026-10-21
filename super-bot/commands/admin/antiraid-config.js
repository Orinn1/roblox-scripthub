/**
 * 🛡️ Slash Command: /antiraid
 * จัดการการตั้งค่าความปลอดภัย ห้อง Log และบัญชีดำรูปภาพสแกม MrBeast
 */
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChannelType, 
    EmbedBuilder 
} = require('discord.js');
const { setLogChannel, addImageBlacklist, getBlacklist, setAntiScamEnabled } = require('../../database/db');
const { fetchImageHash, generateAntiSpamPanel } = require('../../modules/anti-scam');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('ตั้งค่าระบบความปลอดภัย Anti-Raid และ Anti-Scam')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('set_log_channel')
                .setDescription('กำหนดห้องส่งประวัติการตรวจจับสแกม/ไวรัส (Log Channel)')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('ห้องสำหรับรับแจ้งเตือนความปลอดภัย')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('blacklist_image')
                .setDescription('เพิ่มรูปภาพเข้าบัญชีดำสแกม (เมื่อมีคนส่งรูปนี้จะถูกลบและ Timeout ทันที)')
                .addAttachmentOption(opt =>
                    opt.setName('image')
                        .setDescription('อัปโหลดไฟล์รูปภาพที่ต้องการแบน')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('reason')
                        .setDescription('เหตุผล เช่น MrBeast Casino Scam')
                )
        )
        .addSubcommand(sub =>
            sub.setName('list_blacklist')
                .setDescription('ดูรายการรูปภาพในบัญชีดำความปลอดภัย')
        )
        .addSubcommand(sub =>
            sub.setName('toggle_antispam')
                .setDescription('เปิดหรือปิดระบบป้องกันสแปมและสแกมในเซิร์ฟเวอร์')
                .addStringOption(opt =>
                    opt.setName('status')
                        .setDescription('เลือกเปิดหรือปิดการทำงาน (ถ้าไม่เลือกจะเปิดแผงสลับสถานะ)')
                        .addChoices(
                            { name: 'เปิดระบบ (Enable)', value: 'on' },
                            { name: 'ปิดระบบ (Disable)', value: 'off' }
                        )
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'set_log_channel') {
            const channel = interaction.options.getChannel('channel');
            setLogChannel(guildId, channel.id);

            return interaction.reply({
                content: `จัดให้เตง! ตั้งห้องแจ้งเตือนความปลอดภัยเป็น ${channel} เรียบร้อยแล้ว ✨`,
                ephemeral: true
            });
        }

        if (subcommand === 'blacklist_image') {
            await interaction.deferReply({ ephemeral: true });
            const attachment = interaction.options.getAttachment('image');
            const reason = interaction.options.getString('reason') || 'MrBeast Scam Image';

            const imgData = await fetchImageHash(attachment.url);
            if (!imgData) {
                return interaction.editReply({
                    content: '❌ ดึงข้อมูลรูปภาพไม่ผ่านง่ะเตง ลองใหม่อีกทีน้า'
                });
            }

            addImageBlacklist(guildId, imgData.hash, imgData.size, reason, interaction.user.tag);

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🚫 ขึ้นแบล็กลิสต์รูปภาพเรียบร้อย!')
                .setDescription(`บันทึกรูปนี้ลงระบบดักจับสแกมแล้วน้า\nถ้าใครเผลอส่งรูปนี้ บอทจะลบข้อความทิ้งทันทีพร้อมพักนิ้วคนส่งให้ทันควัน!`)
                .addFields(
                    { name: '📦 ขนาดไฟล์', value: `${imgData.size} bytes`, inline: true },
                    { name: '🔑 รหัสไฟล์ (Hash)', value: `\`${imgData.hash.substring(0, 16)}...\``, inline: true },
                    { name: '📝 สาเหตุที่แบน', value: reason, inline: false }
                )
                .setThumbnail(attachment.url)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === 'list_blacklist') {
            const list = getBlacklist.all(guildId);
            if (list.length === 0) {
                return interaction.reply({
                    content: 'ℹ️ ยังไม่มีรูปภาพในแบล็กลิสต์ของเซิร์ฟนี้เลยเตง ปลอดภัยหายห่วง!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📋 รายการแบล็กลิสต์รูปภาพอันตราย')
                .setDescription(
                    list.map((item, i) => `${i + 1}. ขนาด: \`${item.fileSize} B\` | สาเหตุ: **${item.reason}** | คนลงดาบ: ${item.addedBy}`).join('\n')
                )
                .setFooter({ text: `บันทึกไว้ทั้งหมด ${list.length} รูป` });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'toggle_antispam') {
            const statusOption = interaction.options.getString('status');

            if (statusOption === 'on') {
                setAntiScamEnabled(guildId, true);
            } else if (statusOption === 'off') {
                setAntiScamEnabled(guildId, false);
            }

            const panel = generateAntiSpamPanel(interaction.guild);
            return interaction.reply({
                ...panel,
                ephemeral: true
            });
        }
    }
};
