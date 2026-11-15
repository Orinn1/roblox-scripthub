const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const botConfig = require('./config.js');

// User Message Tracking for Rate Limiting & Spam Detection
const userMessageHistory = new Map(); // userId -> [timestamps]
const userLastMessage = new Map();    // userId -> { content: string, count: number, time: number }
const userViolationCount = new Map(); // userId -> number of violations
const activePunishingUsers = new Set(); // userId currently being punished to prevent race conditions

/**
 * Emergency Guild-Wide Purge: Deletes all recent messages from a user across ALL text channels in the server
 */
async function purgeUserAcrossGuild(guild, userId) {
    if (!guild || !userId) return;
    try {
        const textChannels = guild.channels.cache.filter(c => 
            c.isTextBased() && 
            !c.isVoiceBased() &&
            c.permissionsFor(guild.members.me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageMessages])
        );

        await Promise.allSettled(textChannels.map(async (ch) => {
            try {
                const fetched = await ch.messages.fetch({ limit: 35 }).catch(() => null);
                if (fetched && fetched.size > 0) {
                    const userMsgs = fetched.filter(m => m.author.id === userId);
                    if (userMsgs.size > 0) {
                        await ch.bulkDelete(userMsgs, true).catch(async () => {
                            for (const [, msg] of userMsgs) {
                                await msg.delete().catch(() => {});
                            }
                        });
                    }
                }
            } catch (e) {}
        }));
    } catch (err) {
        console.error('[PurgeAcrossGuild Error]:', err);
    }
}

// Configuration for Streamlined Anti-Raid & Honeypot
const ANTI_RAID_CONFIG = {
    // 0. Exempt / Whitelist Channels (ห้องที่ยกเว้น ไม่ต้องตรวจ Anti-Raid ปกติ)
    exemptChannels: [
        '1566177348330463242',
        ...(botConfig.antiRaidExemptChannels || [])
    ],

    // 1. Honeypot Channel (ห้องกับดักบอทสแปม)
    honeypotChannelId: botConfig.honeypotChannelId || '1571400673273188424',
    honeypotTimeout: 5 * 60 * 1000,     // ปิดปาก 5 นาทีทันทีเมื่อพิมพ์ในห้องกับดัก

    // 2. Fast Spam (พิมพ์รัว)
    maxMessagesPerWindow: 4,            // ไม่เกิน 4 ข้อความ
    windowMs: 3500,                     // ภายใน 3.5 วินาที
    fastSpamTimeout: 15 * 60 * 1000,    // ปิดปาก 15 นาที

    // 3. Mass Mention (แท็กคนหมู่มาก)
    maxMentions: 3,                     // ห้ามแท็กคนเกิน 3 คน
    massMentionTimeout: 60 * 60 * 1000, // ปิดปาก 1 ชั่วโมง

    // 4. Ban Threshold
    banAfterViolations: 3               // ทำผิดซ้ำ 3 ครั้ง แบนทันที
};

/**
 * Check if a member or channel is exempt from Anti-Raid (Admins, Bots, Server Owner, Exempt Channels)
 */
function isExempt(member, channel) {
    if (!member) return true;
    if (member.user?.bot) return true;
    if (member.id === member.guild?.ownerId) return true;

    // Check Administrator or ManageGuild permissions
    if (member.permissions && (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        member.permissions.has(PermissionFlagsBits.ManageMessages)
    )) {
        return true;
    }

    // Exempt channels (ยกเว้นห้องที่ระบุ ไม่ต้องตรวจ Anti-Raid)
    const channelId = channel?.id || (typeof channel === 'string' ? channel : null);
    if (channelId && channelId !== ANTI_RAID_CONFIG.honeypotChannelId && ANTI_RAID_CONFIG.exemptChannels.includes(channelId)) {
        return true;
    }

    return false;
}

/**
 * Send DM notification to user explaining why they were punished and how to fix compromised account
 */
async function sendPunishmentDM(member, guild, reason, actionTaken, triggerContent = '', isHoneypot = false) {
    if (!member || !member.user) return false;
    try {
        const fields = [
            { name: '🚨 เหตุผลที่ถูกระงับ', value: `\`${reason}\``, inline: false },
            { name: '⚡ บทลงโทษที่ได้รับ', value: `\`${actionTaken}\``, inline: true }
        ];

        if (triggerContent) {
            const cleanSnippet = triggerContent.length > 100 ? triggerContent.slice(0, 97) + '...' : triggerContent;
            fields.push({ name: '💬 ข้อความของคุณที่ถูกตรวจพบ', value: `\`\`\`text\n${cleanSnippet}\n\`\`\``, inline: false });
        }

        if (isHoneypot) {
            fields.push({
                name: '⚠️ คำเตือนด่วน: บัญชี Discord ของคุณอาจถูกแฮก',
                value: 'ระบบตรวจพบการส่งข้อความเข้ามาใน **ห้องกับดักบอทสแปม (Honeypot)**\nหากคุณไม่ได้เป็นคนส่งข้อความนี้ด้วยตนเอง แสดงว่า **บัญชี Discord ของคุณถูกแฮก หรือติดไวรัสดูดโทเคน (Token Grabber)** จากการดาวน์โหลดโปรแกรมหรือสคริปต์แปลกๆ ครับ\n\n💡 **วิธีแก้ไขให้หายขาด:**\n1. ไปที่ **การตั้งค่า Discord ➔ บัญชีของฉัน (User Settings > My Account)**\n2. กด **"เปลี่ยนรหัสผ่าน" (Change Password)** ใหม่ทันที\n3. แนะนำเปิดการยืนยันตัวตน 2 ชั้น (**2FA**)\n\n*(เพียงเปลี่ยนรหัสผ่านใหม่ ระบบจะเตะแฮกเกอร์ออกจากบัญชีทันทีครับ และระบบได้ระงับการพิมพ์ชั่วคราว 5 นาทีเพื่อความปลอดภัย)*',
                inline: false
            });
        } else {
            fields.push({
                name: '📌 หากไม่ได้ตั้งใจทำ (ติดต่อชี้แจง)',
                value: 'หากคุณไม่ได้ตั้งใจ หรือคิดว่าเป็นความเข้าใจผิดของระบบ สามารถทักหา Admin ได้เพื่อให้แอดมินพิจารณาปลดให้ครับ (กรุณาพิมพ์บอกอย่างสุภาพ)',
                inline: false
            });
        }

        const dmEmbed = new EmbedBuilder()
            .setTitle(`🛡️ ระบบแจ้งเตือนความปลอดภัยจาก ${guild?.name || 'KROZ Community'}`)
            .setColor(isHoneypot ? 0xFFA500 : 0xFF0033)
            .setDescription(`คุณถูกระงับการพิมพ์ในเซิร์ฟเวอร์ชั่วคราวเนื่องจากระบบตรวจพบพฤติกรรมผิดกฎ (Anti-Raid Guard)`)
            .addFields(fields)
            .setFooter({ text: 'KROZ Community Automated Security' })
            .setTimestamp();

        await member.send({ embeds: [dmEmbed] });
        return true;
    } catch (err) {
        return false; // User has DMs closed
    }
}

/**
 * Log anti-raid action to designated alert channel or console
 */
async function logAntiRaidAction(guild, targetMember, reason, actionTaken, dmSent = false, triggerContent = '') {
    console.warn(`🛡️ [Anti-Raid] ${actionTaken} ผู้ใช้ ${targetMember.user.tag} (${targetMember.id}) - เหตุผล: ${reason} (DM: ${dmSent ? 'สำเร็จ' : 'ผู้ใช้ปิด DM'})`);

    const logChannelId = botConfig.antiRaidChannelId || botConfig.notifyChannelId || '1553430888686034964';
    if (logChannelId && guild) {
        try {
            const channel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                const embedFields = [
                    { name: '👤 ผู้ใช้', value: `${targetMember.user.tag} (\`${targetMember.id}\`)`, inline: true },
                    { name: '⚡ การลงโทษ', value: `\`${actionTaken}\``, inline: true },
                    { name: '📩 การแจ้งเตือน DM', value: dmSent ? '✅ ส่งข้อความเตือนเรียบร้อย' : '⚠️ ไม่สำเร็จ (ผู้ใช้ปิดรับ DM)', inline: true },
                    { name: '🚨 เหตุผล', value: reason, inline: false }
                ];

                if (triggerContent) {
                    const logSnippet = triggerContent.length > 250 ? triggerContent.slice(0, 247) + '...' : triggerContent;
                    embedFields.push({ name: '💬 ข้อความที่พิมพ์', value: `\`\`\`text\n${logSnippet}\n\`\`\``, inline: false });
                }

                const embed = new EmbedBuilder()
                    .setTitle('🛡️ Anti-Raid Guard: บันทึกการระงับผู้ใช้')
                    .setColor(0xFFA500)
                    .addFields(embedFields)
                    .setTimestamp();
                await channel.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (e) {}
    }
}

/**
 * Punish member (Delete Message -> DM -> Apply Timeout/Ban -> Purge)
 */
async function punishUser(message, member, reason, timeoutDuration, isHoneypot = false) {
    const userId = member.id;
    const content = message.content || '';
    const currentViolations = (userViolationCount.get(userId) || 0) + 1;
    userViolationCount.set(userId, currentViolations);

    // Prevent duplicate race-condition calls when selfbot spams multiple channels
    activePunishingUsers.add(userId);
    setTimeout(() => activePunishingUsers.delete(userId), 20000);

    // 1. Delete triggering message immediately
    try {
        await message.delete().catch(() => {});
    } catch (e) {}

    // Determine punishment
    let actionTaken = 'Timeout';
    let isBan = false;

    if (isHoneypot) {
        actionTaken = 'Mute (Timeout 5 นาที)';
    } else if (currentViolations >= ANTI_RAID_CONFIG.banAfterViolations && member.bannable) {
        actionTaken = 'Banned (ถาวร)';
        isBan = true;
    } else {
        actionTaken = `Timeout (${Math.round(timeoutDuration / 60000)} นาที)`;
    }

    // 2. Send DM notification to violator
    const dmSent = await sendPunishmentDM(member, message.guild, reason, actionTaken, content, isHoneypot);

    // 3. Apply Timeout or Ban
    if (isBan) {
        try {
            await member.ban({
                reason: `[Anti-Raid Guard] ${reason}`,
                deleteMessageSeconds: 86400 // ลบข้อย้อนหลัง 24 ชม. ทุกห้องในเซิร์ฟเวอร์
            });
        } catch (err) {
            console.warn('[Anti-Raid Ban Error]:', err.message);
        }
    } else if (member.moderatable) {
        try {
            await member.timeout(timeoutDuration, `[Anti-Raid Guard] ${reason}`);
        } catch (err) {
            console.warn('[Anti-Raid Timeout Error]:', err.message);
        }
    }

    // 4. Clean up messages across ALL channels if caught in Honeypot
    if (isHoneypot) {
        await purgeUserAcrossGuild(message.guild, userId);
    }

    // 5. Temporary in-channel alert
    try {
        const alert = await message.channel.send(`🛡️ **[Honeypot Guard]** ระงับ <@${userId}>: \`${reason}\` (${actionTaken})`).catch(() => null);
        if (alert) {
            setTimeout(() => alert.delete().catch(() => {}), 6000);
        }
    } catch (e) {}

    // 6. Send Log to designated alert channel
    await logAntiRaidAction(message.guild, member, reason, actionTaken, dmSent, content);
}

/**
 * Main Message Inspector for Anti-Raid & Honeypot Protection
 */
async function handleAntiRaidMessage(message) {
    if (!message || !message.guild || !message.member) return false;
    if (isExempt(message.member, message.channel)) return false;

    // Concurrency Lock: If user is already undergoing punishment, immediately delete
    if (activePunishingUsers.has(message.author.id)) {
        try { await message.delete().catch(() => {}); } catch (e) {}
        return true;
    }

    const channelId = message.channel.id;
    const content = message.content || '';
    const userId = message.author.id;
    const now = Date.now();

    // ----------------------------------------------------
    // 0. 🍯 HONEYPOT TRAP CHANNEL CHECK (#1571400673273188424)
    // ----------------------------------------------------
    if (channelId === ANTI_RAID_CONFIG.honeypotChannelId) {
        await punishUser(message, message.member, 'พิมพ์ข้อความในห้องกับดักบอทสแปม (Honeypot Channel)', ANTI_RAID_CONFIG.honeypotTimeout, true);
        return true;
    }

    // ----------------------------------------------------
    // 1. 📢 ตรวจจับ Mass Mention (แท็กคนเกิน 3 คน หรือแท็ก @everyone / @here)
    // ----------------------------------------------------
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount > ANTI_RAID_CONFIG.maxMentions || content.includes('@everyone') || content.includes('@here')) {
        await punishUser(message, message.member, `แท็กหมู่เกินกำหนด (${mentionCount} คน)`, ANTI_RAID_CONFIG.massMentionTimeout, false);
        return true;
    }

    // ----------------------------------------------------
    // 2. ⚡ ตรวจจับ Fast Spam (พิมพ์รัวเกิน 4 ข้อความใน 3.5 วินาที)
    // ----------------------------------------------------
    let history = userMessageHistory.get(userId) || [];
    history = history.filter(ts => now - ts < ANTI_RAID_CONFIG.windowMs);
    history.push(now);
    userMessageHistory.set(userId, history);

    if (history.length >= ANTI_RAID_CONFIG.maxMessagesPerWindow) {
        await punishUser(message, message.member, `พิมพ์รัวเกินไป (${history.length} ข้อความใน 3.5 วินาที)`, ANTI_RAID_CONFIG.fastSpamTimeout, false);
        return true;
    }

    // ----------------------------------------------------
    // 3. 🔁 ตรวจจับ Duplicate Message Spam (ส่งข้อความเดิมซ้ำๆ 3 ครั้ง)
    // ----------------------------------------------------
    const last = userLastMessage.get(userId);
    if (last && last.content === content && (now - last.time < 10000)) {
        const count = last.count + 1;
        userLastMessage.set(userId, { content, count, time: now });
        if (count >= 3) {
            await punishUser(message, message.member, 'ส่งข้อความเดิมซ้ำๆ (Duplicate Spam)', ANTI_RAID_CONFIG.fastSpamTimeout, false);
            return true;
        }
    } else {
        userLastMessage.set(userId, { content, count: 1, time: now });
    }

    return false;
}

/**
 * Automatically sets up the Honeypot warning embed in the honeypot channel
 */
async function setupHoneypotChannel(client) {
    const channelId = ANTI_RAID_CONFIG.honeypotChannelId;
    if (!channelId || !client) return;

    try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return;

        // Check if bot already posted the honeypot notice
        const messages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
        const hasBotNotice = messages && messages.some(m => m.author.id === client.user.id && m.embeds && m.embeds.length > 0);

        if (!hasBotNotice) {
            const embed = new EmbedBuilder()
                .setTitle('🍯 DO NOT SEND MESSAGES IN THIS CHANNEL')
                .setColor(0xFFA500)
                .setDescription(
                    '**This channel is an automated trap used to catch spam bots and compromised accounts.**\n\n' +
                    '⚠️ **Any messages sent here will result in an immediate 5-minute timeout and message purge.**\n\n' +
                    '──────────────────────────────────\n\n' +
                    '🇹🇭 **ห้องนี้เป็นกับดักอัตโนมัติสำหรับดักจับบอทสแปมและบัญชีที่ถูกแฮก**\n\n' +
                    '⚠️ **ห้ามพิมพ์ข้อความใดๆ ในห้องนี้เด็ดขาด หากพิมพ์จะถูกระงับการพิมพ์ (Timeout) 5 นาทีทันที!**'
                )
                .setFooter({ text: 'KROZ Honeypot Protection • Automated Security' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(`🍯 [Honeypot]: โพสต์การ์ดแจ้งเตือนในห้อง Honeypot (${channelId}) เรียบร้อย`);
        }
    } catch (err) {
        console.warn('⚠️ [Honeypot Setup Error]:', err.message);
    }
}

module.exports = {
    handleAntiRaidMessage,
    setupHoneypotChannel,
    punishUser,
    ANTI_RAID_CONFIG
};
