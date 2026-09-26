const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const botConfig = require('../config.js');
const { ROLE_DEFINITIONS, resolveUserRoles, generateVipToken } = require('../vip-helper.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vip')
        .setDescription('👑 รับลิงก์เข้าสู่ระบบเว็บไซต์พร้อมแสดงยศ (Admin / Dev / Bypass / Verified)'),

    async execute(interaction) {
        const member = interaction.member;

        let userRoles = [];
        if (member) {
            if (member.roles && member.roles.cache) {
                userRoles = Array.from(member.roles.cache.keys());
            } else if (Array.isArray(member.roles)) {
                userRoles = member.roles;
            }
        }

        let { primaryRole, canBypass } = resolveUserRoles(userRoles);

        if (interaction.memberPermissions && interaction.memberPermissions.has('Administrator')) {
            canBypass = true;
            if (primaryRole.priority > 1) {
                primaryRole = { id: '1549057153585651923', ...ROLE_DEFINITIONS['1549057153585651923'] };
            }
        }

        const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 128 }) || '';

        // สร้าง VIP Token ที่เข้ารหัสและมีลายเซ็น HMAC
        const token = generateVipToken({
            userId: interaction.user.id,
            username: interaction.user.username,
            avatar: avatarUrl,
            roles: userRoles,
            primaryRole,
            canBypass
        });

        const baseUrl = (botConfig.websiteUrl || 'https://blacklistscripty.vercel.app').replace(/\/$/, '');
        let vipAccessUrl = `${baseUrl}/?vip_token=${encodeURIComponent(token)}`;

        const embed = new EmbedBuilder()
            .setColor(canBypass ? 0xffd700 : 0x5865f2)
            .setTitle(canBypass ? '👑 บัตรผ่านสิทธิ์ Bypass (โหมดไร้โฆษณา 100%)' : `👋 เข้าสู่ระบบ BlacklistScriptx [${primaryRole.tag || primaryRole.name}]`)
            .setDescription(`ยินดีต้อนรับคุณ **${interaction.user.username}**!\nระบบได้ออกลิงก์เข้าสู่ระบบสำหรับยศ **${primaryRole.tag || primaryRole.name}** เรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อเข้าสู่ระบบเว็บได้ทันที`)
            .addFields(
                {
                    name: '🎖️ ยศที่ตรวจพบ',
                    value: `\`${primaryRole.tag || primaryRole.name}\``,
                    inline: true
                },
                {
                    name: '⚡ สถานะ Bypass โฆษณา',
                    value: canBypass ? '`✅ ปลดล็อคไร้โฆษณา 100%`' : '`❌ ยังไม่เปิดใช้งาน (ต้องมียศ Bypass)`',
                    inline: true
                },
                {
                    name: '✨ สิทธิประโยชน์',
                    value: canBypass
                        ? '• 🚫 **ปิดโฆษณา 100%:** ไม่มี Adsterra, ไม่มีป๊อปอัป\n• ⚡ **ข้ามเกทถาวร:** ไม่ต้องผ่าน ShrinkEarn / LootLabs\n• 📜 **คัดลอกสคริปต์ทันที:** โหลดสคริปต์ได้โดยตรง'
                        : '• 👤 **แสดงโปรไฟล์และป้ายยศบนเว็บไซต์**\n• ℹ️ **ต้องการปิดโฆษณา?** ติดต่อขอรับยศ Bypass จากผู้ดูแลเซิร์ฟเวอร์'
                }
            )
            .setFooter({ text: '⚡ BlacklistScriptx System • ใช้งานได้บนทุกอุปกรณ์ (PC / มือถือ)' })
            .setTimestamp();

        const buttons = [];
        if (vipAccessUrl.length <= 512) {
            buttons.push(
                new ButtonBuilder()
                    .setLabel('🚀 คลิกเพื่อเข้าสู่ระบบเว็บทันที')
                    .setStyle(ButtonStyle.Link)
                    .setURL(vipAccessUrl)
            );
        }

        buttons.push(
            new ButtonBuilder()
                .setLabel('🌐 เข้าชมเว็บไซต์หลัก')
                .setStyle(ButtonStyle.Link)
                .setURL(baseUrl)
        );

        const row = new ActionRowBuilder().addComponents(buttons);

        return interaction.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    }
};
