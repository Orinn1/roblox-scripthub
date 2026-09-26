const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const botConfig = require('./config.js');

// User Message Tracking for Rate Limiting & Spam Detection
const userMessageHistory = new Map(); // userId -> [timestamps]
const userLastMessage = new Map();    // userId -> { content: string, count: number, time: number }
const userViolationCount = new Map(); // userId -> number of violations

// Configuration for Hardcore Anti-Raid
const ANTI_RAID_CONFIG = {
    // 1. Fast Spam
    maxMessagesPerWindow: 4,     // ไม่เกิน 4 ข้อความ
    windowMs: 3500,              // ภายใน 3.5 วินาที
    
    // 2. Wall of Text / Copypasta
    maxMessageLength: 280,       // ความยาวสูงสุดไม่เกิน 280 ตัวอักษร
    maxCjkCharacters: 40,        // ห้ามส่งตัวอักษร จีน/ญี่ปุ่น เกิน 40 ตัว (กัน Raid Copypasta)
    
    // 3. Repeated Characters / Zalgo
    maxRepeatPattern: 12,        // ตัวอักษรซ้ำกันเกิน 12 ครั้งติด
    
    // 4. Mass Mention
    maxMentions: 3,              // ห้ามแท็กคนเกิน 3 คน
    
    // 5. Timeouts
    fastSpamTimeout: 15 * 60 * 1000,    // ปิดปาก 15 นาที
    wallOfTextTimeout: 60 * 60 * 1000,  // ปิดปาก 1 ชั่วโมง
    massMentionTimeout: 60 * 60 * 1000, // ปิดปาก 1 ชั่วโมง
    inviteSpamTimeout: 30 * 60 * 1000,  // ปิดปาก 30 นาที
    
    // 6. Ban Threshold
    banAfterViolations: 3               // ทำผิดซ้ำ 3 ครั้ง แบนทันที
};

/**
 * Check if a member is exempt from Anti-Raid (Admins, Bots, Server Owner)
 */
function isExempt(member, channel) {
    if (!member) return true;
    if (member.user.bot) return true;
    if (member.id === member.guild?.ownerId) return true;

    // Check Administrator or ManageGuild permissions
    if (member.permissions && (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        member.permissions.has(PermissionFlagsBits.ManageMessages)
    )) {
        return true;
    }

    return false;
}

/**
 * Send DM notification to user explaining why they were punished and warning against spamming Admin
 */
async function sendPunishmentDM(member, guild, reason, actionTaken, triggerContent = '') {
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

        fields.push({
            name: '📌 หากไม่ได้ตั้งใจทำ (ติดต่อชี้แจง)',
            value: 'หากคุณไม่ได้ตั้งใจ หรือคิดว่าเป็นความเข้าใจผิดของระบบ **สามารถทักหา Admin ได้ โดยให้แจ้งว่าตนเองพิมพ์อะไรไป** เพื่อให้แอดมินตรวจสอบและพิจารณาปลดให้ครับ (⚠️ กรุณาพิมพ์บอกอย่างสุภาพ ห้ามส่งข้อความสแปมรัวๆ โดยเด็ดขาด)',
            inline: false
        });

        const dmEmbed = new EmbedBuilder()
            .setTitle(`🛡️ ระบบแจ้งเตือนความปลอดภัยจาก ${guild?.name || 'เซิร์ฟเวอร์'}`)
            .setColor(0xFF0033)
            .setDescription(`คุณถูกระงับการใช้งานในเซิร์ฟเวอร์ชั่วคราวเนื่องจากระบบตรวจพบพฤติกรรมผิดกฎ (Anti-Raid)`)
            .addFields(fields)
            .setFooter({ text: 'ระบบป้องกันอัตโนมัติ BlacklistScriptx' })
            .setTimestamp();

        await member.send({ embeds: [dmEmbed] });
        return true;
    } catch (err) {
        return false; // User has DMs closed
    }
}

/**
 * Log anti-raid event to alert channel or console
 */
async function logAntiRaidAction(guild, targetMember, reason, actionTaken, dmSent = false, triggerContent = '') {
    console.warn(`🛡️ [Anti-Raid] ${actionTaken} ผู้ใช้ ${targetMember.user.tag} (${targetMember.id}) - เหตุผล: ${reason} (DM: ${dmSent ? 'สำเร็จ' : 'ผู้ใช้ปิด DM'})`);

    // Prioritize dedicated Anti-Raid Log Channel (1553430888686034964)
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
                    .setTitle('🛡️ Anti-Raid Guard: ตรวจพบและระงับการโจมตี')
                    .setColor(0xFF0033)
                    .addFields(embedFields)
                    .setTimestamp();
                await channel.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (e) {}
    }
}

/**
 * Punish member (Delete -> DM -> Timeout or Ban -> Purge recent messages)
 */
async function punishUser(message, member, reason, timeoutDuration) {
    const userId = member.id;
    const content = message.content || '';
    const currentViolations = (userViolationCount.get(userId) || 0) + 1;
    userViolationCount.set(userId, currentViolations);

    // 1. Delete the triggering message immediately
    try {
        await message.delete().catch(() => {});
    } catch (e) {}

    // 2. Clean up recent messages from this user in this channel (Purge up to 25 messages)
    try {
        const fetched = await message.channel.messages.fetch({ limit: 25 }).catch(() => null);
        if (fetched) {
            const userSpam = fetched.filter(m => m.author.id === userId);
            if (userSpam.size > 0) {
                await message.channel.bulkDelete(userSpam, true).catch(() => {});
            }
        }
    } catch (e) {}

    // Determine punishment
    let actionTaken = 'Timeout';
    let isBan = false;
    if (currentViolations >= ANTI_RAID_CONFIG.banAfterViolations && member.bannable) {
        actionTaken = 'Banned (ถาวร)';
        isBan = true;
    } else {
        actionTaken = `Timeout (${Math.round(timeoutDuration / 60000)} นาที)`;
    }

    // 3. Send DM to the violator before applying timeout/ban (to explain reason and warn against DM spamming Admin)
    const dmSent = await sendPunishmentDM(member, message.guild, reason, actionTaken, content);

    // 4. Ban if repeated raid, else Timeout
    if (isBan) {
        try {
            await member.ban({
                reason: `[Anti-Raid Guard] สแปม/ยิงดิสซ้ำซาก (${reason})`,
                deleteMessageSeconds: 86400 // ลบข้อความย้อนหลัง 24 ชม.
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

    // 5. Temporary in-channel alert
    try {
        const alert = await message.channel.send(`🛡️ **[Anti-Raid Guard]** ระงับ <@${userId}> เรียบร้อย: \`${reason}\` (${actionTaken})`).catch(() => null);
        if (alert) {
            setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
    } catch (e) {}

    // 6. Send Log to designated channel
    await logAntiRaidAction(message.guild, member, reason, actionTaken, dmSent, content);
}

/**
 * Main Message Inspector for Anti-Raid Protection
 */
async function handleAntiRaidMessage(message) {
    if (!message || !message.guild || !message.member) return false;
    if (isExempt(message.member, message.channel)) return false;

    const content = message.content || '';
    const userId = message.author.id;
    const now = Date.now();

    // ----------------------------------------------------
    // 1. ตรวจจับ Wall of Text / Copypasta ขนาดยักษ์ (เช่น อักษรจีน/ญี่ปุ่นที่เพิ่งโดน)
    // ----------------------------------------------------
    // นับตัวอักษร CJK (จีน/ญี่ปุ่น)
    const cjkMatches = content.match(/[\u4e00-\u9fa5\u3040-\u30ff]/g);
    const cjkCount = cjkMatches ? cjkMatches.length : 0;

    if (cjkCount >= ANTI_RAID_CONFIG.maxCjkCharacters) {
        await punishUser(message, message.member, `ยิงตัวอักษรจีน/ญี่ปุ่น Copypasta (${cjkCount} ตัว)`, ANTI_RAID_CONFIG.wallOfTextTimeout);
        return true;
    }

    if (content.length > ANTI_RAID_CONFIG.maxMessageLength) {
        await punishUser(message, message.member, `ข้อความยาวผิดปกติ (${content.length} ตัวอักษร)`, ANTI_RAID_CONFIG.wallOfTextTimeout);
        return true;
    }

    // ----------------------------------------------------
    // 2. ตรวจจับการสแปมตัวอักษรซ้ำๆ (Repeated Characters / Zalgo)
    // ----------------------------------------------------
    if (/(.)\1{12,}/.test(content)) {
        await punishUser(message, message.member, 'สแปมตัวอักษรซ้ำๆ ยาวเกินกำหนด', ANTI_RAID_CONFIG.fastSpamTimeout);
        return true;
    }

    // ----------------------------------------------------
    // 3. ตรวจจับ Mass Mention (แท็กคนเกิน หรือพยายามแท็ก @everyone)
    // ----------------------------------------------------
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount > ANTI_RAID_CONFIG.maxMentions || content.includes('@everyone') || content.includes('@here')) {
        await punishUser(message, message.member, `แท็กหมู่เกินกำหนด (${mentionCount} คน)`, ANTI_RAID_CONFIG.massMentionTimeout);
        return true;
    }

    // ----------------------------------------------------
    // 4. ตรวจจับลิงก์เชิญ Discord อื่น (Discord Invite Links)
    // ----------------------------------------------------
    if (/(discord\.gg|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i.test(content)) {
        await punishUser(message, message.member, 'ส่งลิงก์เชิญ Discord อื่นโดยไม่ได้รับอนุญาต', ANTI_RAID_CONFIG.inviteSpamTimeout);
        return true;
    }

    // ----------------------------------------------------
    // 5. ตรวจจับ Fast Spam (พิมพ์รัวๆ เกิน X ข้อความใน Y วินาที)
    // ----------------------------------------------------
    let history = userMessageHistory.get(userId) || [];
    history = history.filter(ts => now - ts < ANTI_RAID_CONFIG.windowMs);
    history.push(now);
    userMessageHistory.set(userId, history);

    if (history.length >= ANTI_RAID_CONFIG.maxMessagesPerWindow) {
        await punishUser(message, message.member, `พิมพ์รัวเกินไป (${history.length} ข้อความใน 3.5 วินาที)`, ANTI_RAID_CONFIG.fastSpamTimeout);
        return true;
    }

    // ----------------------------------------------------
    // 6. ตรวจจับ Duplicate Message Spam (ส่งข้อความเดิมซ้ำๆ 3 ครั้ง)
    // ----------------------------------------------------
    const last = userLastMessage.get(userId);
    if (last && last.content === content && (now - last.time < 10000)) {
        const count = last.count + 1;
        userLastMessage.set(userId, { content, count, time: now });
        if (count >= 3) {
            await punishUser(message, message.member, 'ส่งข้อความเดิมซ้ำๆ (Duplicate Spam)', ANTI_RAID_CONFIG.fastSpamTimeout);
            return true;
        }
    } else {
        userLastMessage.set(userId, { content, count: 1, time: now });
    }

    return false;
}

module.exports = {
    handleAntiRaidMessage,
    punishUser,
    ANTI_RAID_CONFIG
};
