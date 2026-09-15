const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const botConfig = require('../config.js');

const REQUIRED_ROLE_ID = '1549057153585651923';
const FIREBASE_PROJECT_ID = 'blacklistscripts';
const FIREBASE_API_KEY = 'AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lootlabs')
        .setDescription('💎 ดูสถิติจำนวนผู้ใช้งานที่ปลดล็อคผ่าน LootLabs วันนี้ (เฉพาะแอดมิน/ยศที่กำหนด)'),

    async execute(interaction) {
        // Check Role Permission
        const memberRoles = interaction.member?.roles;
        const hasRole = memberRoles?.cache ? memberRoles.cache.has(REQUIRED_ROLE_ID) : (Array.isArray(memberRoles) && memberRoles.includes(REQUIRED_ROLE_ID));
        const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);

        if (!hasRole && !isAdmin) {
            return interaction.reply({
                content: `⛔ **ขออภัยครับ:** คำสั่งนี้อนุญาตให้ใช้ได้เฉพาะผู้มียศ <@&${REQUIRED_ROLE_ID}> เท่านั้น`,
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_sessions?key=${FIREBASE_API_KEY}&pageSize=300`;
            const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });

            if (!resp.ok) {
                throw new Error(`Firestore API responded with status ${resp.status}`);
            }

            const data = await resp.json();
            const docs = data.documents || [];

            // Bangkok Time (UTC+7)
            const now = new Date();
            const bkkNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
            const todayStr = bkkNow.toISOString().slice(0, 10); // YYYY-MM-DD

            const bkkYesterday = new Date(bkkNow);
            bkkYesterday.setDate(bkkYesterday.getDate() - 1);
            const yesterdayStr = bkkYesterday.toISOString().slice(0, 10);

            let todayCount = 0;
            let yesterdayCount = 0;
            let totalCount = 0;
            let latestDoc = null;

            docs.forEach(doc => {
                const f = doc.fields;
                if (!f || !f.verified || f.verified.booleanValue !== true) return;
                totalCount++;

                const vAt = f.verifiedAt ? f.verifiedAt.stringValue : null;
                if (vAt) {
                    const bkkDate = new Date(new Date(vAt).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
                    const dStr = bkkDate.toISOString().slice(0, 10);

                    if (dStr === todayStr) todayCount++;
                    if (dStr === yesterdayStr) yesterdayCount++;

                    if (!latestDoc || new Date(vAt) > new Date(latestDoc.date)) {
                        latestDoc = {
                            date: vAt,
                            bkkDate,
                            ip: f.ip ? f.ip.stringValue : '',
                            uniqueId: f.uniqueId ? f.uniqueId.stringValue : ''
                        };
                    }
                }
            });

            // Mask IP for safety (e.g. 27.130.xx.xx)
            let maskedIp = 'ไม่ระบุ';
            if (latestDoc && latestDoc.ip) {
                const parts = latestDoc.ip.split('.');
                if (parts.length === 4) {
                    maskedIp = `${parts[0]}.${parts[1]}.*.*`;
                } else {
                    maskedIp = latestDoc.ip.slice(0, 6) + '***';
                }
            }

            let latestTimeStr = 'ยังไม่มีข้อมูล';
            if (latestDoc && latestDoc.bkkDate) {
                const diffMs = now.getTime() - new Date(latestDoc.date).getTime();
                const diffMins = Math.floor(diffMs / 60000);

                if (diffMins < 1) latestTimeStr = 'เมื่อสักครู่นี้';
                else if (diffMins < 60) latestTimeStr = `${diffMins} นาทีที่แล้ว`;
                else {
                    const diffHours = Math.floor(diffMins / 60);
                    latestTimeStr = `${diffHours} ชั่วโมงที่แล้ว`;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0x22c55e) // Emerald Green
                .setTitle('💎 สถิติการผ่าน LootLabs (Live Analytics)')
                .setDescription('ข้อมูลสถิติผู้ใช้งานที่ทำภารกิจและปลดล็อคเข้าสู่เว็บไซต์ **BlacklistScriptx** แบบเรียลไทม์')
                .addFields(
                    {
                        name: '🟢 ยอดผ่านวันนี้ (Today)',
                        value: `**${todayCount.toLocaleString()}** คน`,
                        inline: true
                    },
                    {
                        name: '📅 ยอดผ่านเมื่อวาน',
                        value: `**${yesterdayCount.toLocaleString()}** คน`,
                        inline: true
                    },
                    {
                        name: '🏆 ยอดปลดล็อคสะสม',
                        value: `**${totalCount.toLocaleString()}** ครั้ง`,
                        inline: true
                    },
                    {
                        name: '🕒 ปลดล็อคล่าสุด',
                        value: `${latestTimeStr} \`[IP: ${maskedIp}]\``,
                        inline: false
                    }
                )
                .setFooter({ text: 'เฉพาะแอดมินและผู้มียศที่กำหนดเท่านั้นที่เห็นข้อความนี้' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('📊 Creator Panel (LootLabs)')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://lootlabs.gg/'),
                new ButtonBuilder()
                    .setLabel('🛡️ หน้า Admin Panel')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${botConfig.websiteUrl}/admin.html`)
            );

            return interaction.editReply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error('[Bot /lootlabs Error]:', err);
            return interaction.editReply({
                content: `⚠️ เกิดข้อผิดพลาดในการดึงสถิติจากระบบ: ${err.message}`
            });
        }
    }
};
