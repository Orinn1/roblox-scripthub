const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const botConfig = require('../config.js');
const { VIP_ROLE_ID, generateVipToken } = require('../vip-helper.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vip')
        .setDescription('👑 รับลิงก์เข้าใช้งานเว็บไซต์แบบ VIP ไร้โฆษณา 100% (เฉพาะผู้มียศ VIP)'),

    async execute(interaction) {
        const member = interaction.member;
        const requiredRoleId = botConfig.requiredRoleId || VIP_ROLE_ID;

        let isAdmin = false;
        if (interaction.memberPermissions && interaction.memberPermissions.has('Administrator')) {
            isAdmin = true;
        }

        let hasVipRole = false;
        if (member) {
            if (member.roles && member.roles.cache) {
                hasVipRole = member.roles.cache.has(requiredRoleId);
            } else if (Array.isArray(member.roles)) {
                hasVipRole = member.roles.includes(requiredRoleId);
            }
        }

        // ตรวจสอบสิทธิ์ยศ VIP
        if (!hasVipRole && !isAdmin) {
            return interaction.reply({
                content: `⛔ **คุณยังไม่ได้รับสิทธิ์ VIP!**\nคำสั่งนี้สงวนไว้เฉพาะผู้ที่มียศ <@&${requiredRoleId}> เท่านั้นครับ\n*(หากต้องการสิทธิ์ VIP ไร้โฆษณา กรุณาติดตามประกาศจากทางเซิร์ฟเวอร์)*`,
                flags: MessageFlags.Ephemeral
            });
        }

        // สร้าง VIP Token ที่เข้ารหัสและมีลายเซ็น HMAC
        const token = generateVipToken({
            userId: interaction.user.id,
            username: interaction.user.username,
            roleId: requiredRoleId,
            durationDays: 30
        });

        const baseUrl = (botConfig.websiteUrl || 'https://blacklistscripty.vercel.app').replace(/\/$/, '');
        const vipAccessUrl = `${baseUrl}/?vip_token=${encodeURIComponent(token)}`;

        const embed = new EmbedBuilder()
            .setColor(0xffd700) // Gold Color
            .setTitle('👑 บัตรผ่าน VIP BlacklistScriptx (โหมดไร้โฆษณา 100%)')
            .setDescription(`ยินดีต้อนรับคุณ **${interaction.user.username}**!\nระบบได้ออกบัตรผ่านสิทธิ์ VIP ให้กับคุณเรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อเข้าสู่ระบบเว็บได้ทันที`)
            .addFields(
                {
                    name: '✨ สิทธิพิเศษที่คุณจะได้รับ',
                    value: '• 🚫 **ปิดโฆษณา 100%:** ไม่เจอ Adsterra, ไม่มี Popunder, ไร้ป้ายโฆษณากวนใจ\n• ⚡ **ข้ามเกทถาวร:** ไม่ต้องผ่าน ShrinkEarn / LootLabs ทุกวัน\n• 📜 **คัดลอกสคริปต์ทันที:** เข้าถึงโค้ด Loadstring ทุกเกมได้รวดเร็วที่สุด\n• 👑 **ป้ายทอง VIP Member:** ตราสัญลักษณ์พิเศษบนหน้าเว็บ'
                },
                {
                    name: '⏳ ระยะเวลาใช้งาน',
                    value: '`30 วัน` *(หากหมดอายุ สามารถพิมพ์คำสั่ง `/vip` เพื่อรับบัตรผ่านใหม่ได้ตลอดเวลา)*',
                    inline: true
                },
                {
                    name: '🔒 ความปลอดภัย',
                    value: 'บัตรผ่านนี้ผูกกับบัญชี Discord ของคุณโดยเฉพาะ',
                    inline: true
                }
            )
            .setFooter({ text: '⚡ BlacklistScriptx VIP Pass • ใช้งานได้บนทุกอุปกรณ์ (PC / มือถือ)' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🚀 คลิกเพื่อเปิดใช้งานเว็บ VIP ทันที')
                .setStyle(ButtonStyle.Link)
                .setURL(vipAccessUrl),
            new ButtonBuilder()
                .setLabel('🌐 เข้าชมเว็บไซต์หลัก')
                .setStyle(ButtonStyle.Link)
                .setURL(baseUrl)
        );

        return interaction.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    }
};
