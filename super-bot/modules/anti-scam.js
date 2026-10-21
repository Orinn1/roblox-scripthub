/**
 * 🛡️ Smart Anti-Raid & Anti-Scam System
 * - อนุญาตลิงก์ทั่วไป และลิงก์เชิญ Discord ปกติ
 * - ตรวจจับและบล็อกลิงก์ Phishing / ไวรัส / Nitro ปลอม
 * - ดักจับสแปมรูป MrBeast แจกเงิน/คาสิโน:
 *   (1) แนบรูปหลายภาพใน 1 ข้อความ (>= 3 รูป)
 *   (2) ส่งรูปภาพซ้ำๆ ข้ามหลายห้องแชทในเวลาไม่กี่วินาที (Cross-channel Image Spam) โดยใช้ Collection Cache
 *   (3) ตรวจสอบ Hash / ขนาดไฟล์ กับ Image Blacklist ใน SQLite
 */
const { Collection, EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const crypto = require('crypto');
const { isImageBlacklisted, getGuildConfig } = require('../database/db');

// Cache สำหรับเก็บประวัติการส่งรูปภาพของสมาชิกเพื่อตรวจจับ Cross-channel spam
// userId => [ { channelId, timestamp, hash, size } ]
const userImageHistory = new Collection();

// Cache สำหรับเก็บประวัติข้อความของสมาชิกเพื่อตรวจจับ Text Spam, Flood และ ข้อความซ้ำ
// userId => [ { content, timestamp, channelId } ]
const userMessageHistory = new Collection();

// ล้างแคชประวัติข้อความและรูปภาพทุกๆ 5 นาที อัตโนมัติ ป้องกัน memory leak
setInterval(() => {
    const now = Date.now();
    for (const [uid, history] of userMessageHistory.entries()) {
        const valid = history.filter(h => now - h.timestamp < 15000);
        if (valid.length === 0) userMessageHistory.delete(uid);
        else userMessageHistory.set(uid, valid);
    }
    for (const [uid, history] of userImageHistory.entries()) {
        const valid = history.filter(h => now - h.timestamp < 30000);
        if (valid.length === 0) userImageHistory.delete(uid);
        else userImageHistory.set(uid, valid);
    }
}, 5 * 60 * 1000);

// รายชื่อคำ/โดเมนฟิชชิ่ง Nitro ปลอม และสแกมที่พบบ่อย
const PHISHING_REGEX = /(discorcl|dlscord|discurd|discord-nitro|nitro-gift|free-nitro|steam-nitro|discord-drop|claim-nitro|gift-nitro|nitro-airdrop|airdrop-discord|discord-app\.ru|discorde\.)/i;

// รายชื่อคำค้นหาสแกม MrBeast / Casino
const MRBEAST_SCAM_KEYWORDS = ['mrbeast', 'giveaway', '1000$', '5000$', 'casino', 'promo code', 'bonus code', 'แจกเงิน', 'คาสิโน', 'เครดิตฟรี'];

/**
 * คำนวณ Hash SHA-256 จาก Buffer หรือ URL (ถ้าจำเป็น)
 */
function calculateBufferHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * ดึงภาพจาก URL มาหา Hash แบบเร็ว
 */
async function fetchImageHash(url) {
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'AntiScamBot/1.0' } });
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
            hash: calculateBufferHash(buffer),
            size: buffer.length
        };
    } catch {
        return null;
    }
}

/**
 * ฟังก์ชันหลักในการตรวจสอบข้อความ
 */
async function handleAntiScamMessage(message) {
    if (!message.guild || message.author.bot || !message.member) return;

    // ข้ามถ้าเป็น Admin หรือมีสิทธิ์ ManageMessages (เพื่อไม่ให้แอดมินโดนระบบตัวเอง)
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
        message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return;
    }

    const guildId = message.guild.id;
    const userId = message.author.id;
    const content = message.content.toLowerCase();
    const config = getGuildConfig(guildId);

    // ถ้าเซิร์ฟเวอร์นี้ตั้งค่าปิดระบบกันสแปมไว้ ให้ข้ามการตรวจจับทันที
    if (config && config.antiScamEnabled === 0) {
        return;
    }

    // ==========================================
    // 0. ตรวจจับการสแปมแท็ก (Mass Mentions / @everyone)
    // ==========================================
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (message.mentions.everyone || mentionCount >= 4) {
        await takeAction(message, `แท็กเพื่อนหรือยศรัวเกินเบอร์ (${mentionCount} คน) เพื่อนตกใจหมดดด`, true, 5 * 60 * 1000);
        return;
    }

    // ==========================================
    // 1. ตรวจจับสแปมข้อความรัว (Flood) และข้อความซ้ำ (Duplicate Spam) อัตโนมัติ
    // ==========================================
    const now = Date.now();
    if (!userMessageHistory.has(userId)) {
        userMessageHistory.set(userId, []);
    }
    const msgHistory = userMessageHistory.get(userId);
    // เก็บประวัติ 8 วินาทีล่าสุด
    const recentMsgs = msgHistory.filter(m => now - m.timestamp < 8000);
    recentMsgs.push({
        content: content.trim(),
        timestamp: now,
        channelId: message.channel.id
    });
    userMessageHistory.set(userId, recentMsgs);

    // 1.1 ตรวจจับสแปมข้อความรัว (ส่งเกิน 5 ข้อความใน 4 วินาที)
    const veryRecent = recentMsgs.filter(m => now - m.timestamp < 4000);
    if (veryRecent.length >= 5) {
        await takeAction(message, 'พิมพ์รัวเกินต้าน (Flood ไวจัดด)', true, 60 * 1000);
        return;
    }

    // 1.2 ตรวจจับส่งข้อความเดิมซ้ำๆ (ส่งเหมือนเดิม 3 ครั้งขึ้นไปใน 8 วินาที)
    if (content.trim().length > 2) {
        const duplicates = recentMsgs.filter(m => m.content === content.trim());
        if (duplicates.length >= 3) {
            await takeAction(message, 'ก็อปวางข้อความเดิมซ้ำๆ รัวๆ พักนิ้วก่อนน้า', true, 60 * 1000);
            return;
        }
    }

    // ==========================================
    // 2. ตรวจจับลิงก์ฟิชชิ่ง / Nitro ปลอม
    // ==========================================
    if (PHISHING_REGEX.test(content)) {
        await takeAction(message, 'แปะลิงก์ฟิชชิ่ง / หลอกแจก Nitro เถื่อน ระวังโดนแฮกนะเตง', true, 60 * 60 * 1000);
        return;
    }

    // ==========================================
    // 2. ตรวจจับรูปภาพแนบ (Attachments)
    // ==========================================
    const attachments = message.attachments;
    if (attachments && attachments.size > 0) {
        const imageAttachments = attachments.filter(att => 
            att.contentType?.startsWith('image/') || 
            /\.(png|jpg|jpeg|webp|gif)$/i.test(att.name || '')
        );

        if (imageAttachments.size > 0) {
            // (A) ส่งรูปภาพหลายรูปในข้อความเดียว (>= 3 รูป) และมีคีย์เวิร์ดสแกม หรือรูปภาพเยอะผิดปกติ
            const hasScamText = MRBEAST_SCAM_KEYWORDS.some(k => content.includes(k));
            if (imageAttachments.size >= 3) {
                await takeAction(message, `ยัดรูปมารวดเดียวเยอะเกิ๊น (${imageAttachments.size} รูป)`, hasScamText);
                return;
            }

            // (B) Cross-Channel Image Spam: ส่งรูปข้ามหลายห้องในเวลาไม่กี่วินาที
            const now = Date.now();
            if (!userImageHistory.has(userId)) {
                userImageHistory.set(userId, []);
            }
            const history = userImageHistory.get(userId);

            // เก็บประวัติเฉพาะใน 15 วินาทีล่าสุด
            const filteredHistory = history.filter(h => now - h.timestamp < 15000);
            filteredHistory.push({
                channelId: message.channel.id,
                timestamp: now,
                count: imageAttachments.size
            });
            userImageHistory.set(userId, filteredHistory);

            // นับจำนวนห้องที่ส่งไปภายใน 15 วินาที
            const distinctChannels = new Set(filteredHistory.map(h => h.channelId));
            if (distinctChannels.size >= 2 && filteredHistory.length >= 2) {
                await takeAction(message, `ส่งรูปข้ามห้องรัวๆ ${distinctChannels.size} ห้องพร้อมกัน ใจเย็นน้า`, true);
                return;
            }

            // (C) ตรวจสอบกับ Image Blacklist (ขนาดไฟล์ หรือ Hash)
            for (const att of imageAttachments.values()) {
                const fileSize = att.size;
                // ตรวจขนาดไฟล์เบื้องต้นก่อน
                const blacklistedBySize = isImageBlacklisted(guildId, null, fileSize);
                if (blacklistedBySize) {
                    await takeAction(message, `รูปภาพตรงกับแบล็กลิสต์สแกม / หลอกลวง (ขนาด: ${fileSize} bytes)`, true);
                    return;
                }

                // ดึง Hash มาตรวจเทียบ (ถ้ามีเวลารองรับ)
                const imgData = await fetchImageHash(att.url);
                if (imgData) {
                    const blacklistedByHash = isImageBlacklisted(guildId, imgData.hash, imgData.size);
                    if (blacklistedByHash) {
                        await takeAction(message, `รูปภาพตรงกับแบล็กลิสต์สแกม / หลอกลวง (Hash: ${imgData.hash.substring(0, 12)}...)`, true);
                        return;
                    }
                }
            }
        }
    }
}

/**
 * จัดการลงโทษ ลบข้อความ และส่งประวัติ Log
 */
async function takeAction(message, reason, shouldTimeout = true, timeoutDurationMs = 60 * 60 * 1000) {
    try {
        const member = message.member;
        const author = message.author;
        const channel = message.channel;
        const guild = message.guild;

        // 1. ลบข้อความทันที
        if (message.deletable) {
            await message.delete().catch(() => {});
        }

        // 2. สั่ง Timeout อัตโนมัติ (ตามระยะเวลาที่เหมาะสม)
        if (shouldTimeout && member && member.moderatable) {
            await member.timeout(timeoutDurationMs, `Anti-Spam/Scam: ${reason}`).catch(err => {
                console.warn(`[Anti-Spam] ไม่สามารถ Timeout ${member.user.tag}:`, err.message);
            });
        }

        // 3. ส่งข้อความเตือนในห้องที่เกิดเหตุแบบชั่วคราว
        const durationText = timeoutDurationMs >= 3600000 
            ? `${Math.round(timeoutDurationMs / 3600000)} ชั่วโมง` 
            : `${Math.max(1, Math.round(timeoutDurationMs / 60000))} นาที`;

        const warnEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🛑 ใจเย็นก่อนวัยรุ่น! บอทดักจับความไวแสงได้')
            .setDescription(`มือลั่นหรือเปล่าเตง? ขอเก็บกวาดข้อความของ <@${author.id}> แล้วให้พักนิ้วสักแป๊บ (${durationText}) น้าา\n**สาเหตุ:** ${reason}`)
            .setFooter({ text: 'บอทแม่พระดูแลความสงบเรียบร้อยให้ 24 ชม.' })
            .setTimestamp();

        const warnMsg = await channel.send({ embeds: [warnEmbed] }).catch(() => {});
        if (warnMsg) {
            setTimeout(() => warnMsg.delete().catch(() => {}), 8000);
        }

        // 4. ส่งแจ้งเตือนไปยังห้อง Log
        const config = getGuildConfig(guild.id);
        const logChannelId = config?.logChannelId || process.env.LOG_CHANNEL_ID;
        if (logChannelId) {
            const logChannel = guild.channels.cache.get(logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🚨 [Anti-Scam Log] ดักจับสแกม/สแปมสำเร็จ')
                    .addFields(
                        { name: '👤 สมาชิก', value: `${author.tag} (\`${author.id}\`)`, inline: true },
                        { name: '📍 ห้องเกิดเหตุ', value: `<#${channel.id}>`, inline: true },
                        { name: '⚠️ ข้อหา', value: reason, inline: false },
                        { name: '📝 ข้อความที่ส่ง', value: message.content ? `\`\`\`${message.content.substring(0, 500)}\`\`\`` : '*ไม่มีข้อความ (เป็นรูปภาพล้วน)*' }
                    )
                    .setThumbnail(author.displayAvatarURL())
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    } catch (err) {
        console.error('❌ [Anti-Scam Action Error]:', err);
    }
}

/**
 * สร้าง Embed และปุ่มเปิด-ปิดระบบกันสแปมสำหรับเซิร์ฟเวอร์
 */
function generateAntiSpamPanel(guild) {
    const config = getGuildConfig(guild.id);
    const isEnabled = config ? config.antiScamEnabled !== 0 : true;

    const embed = new EmbedBuilder()
        .setColor(isEnabled ? '#2ECC71' : '#ED4245')
        .setTitle('🛡️ แผงควบคุมระบบกันสแปม & สแกม (Anti-Spam Shield)')
        .setDescription(
            `จัดการเปิด-ปิดระบบความปลอดภัยสำหรับเซิร์ฟเวอร์ **${guild.name}**\n\n` +
            `📍 **สถานะปัจจุบัน:** ${isEnabled ? '🟢 **เปิดใช้งานอยู่ (Active)**' : '🔴 **ปิดใช้งาน (Disabled)**'}\n\n` +
            `✨ **ฟีเจอร์ตรวจจับอัตโนมัติเมื่อเปิดใช้งาน:**\n` +
            `• 🛑 บล็อกสแปมข้อความรัวผิดปกติ (Flood Chat)\n` +
            `• 🔄 บล็อกก็อปวางข้อความเดิมซ้ำๆ รัวๆ (Repeat Text Spam)\n` +
            `• 📢 บล็อกการแท็กสมาชิก/ยศรัวๆ หรือแท็ก @everyone ป่วนเซิร์ฟ\n` +
            `• 🎣 สกัดกั้นลิงก์ฟิชชิ่ง & สแกมแจก Nitro เถื่อนดูดไอดี\n` +
            `• 🖼️ ตรวจจับการยัดส่งรูปภาพรัวข้ามห้อง (Cross-channel Image Spam)\n` +
            `• 🚫 ตรวจเทียบรูปภาพตรงกับแบล็กลิสต์สแกม MrBeast / Casino`
        )
        .setFooter({ text: isEnabled ? 'ระบบกำลังเฝ้าระวังเซิร์ฟเวอร์ให้อย่างปลอดภัย ✨' : '⚠️ ระวัง! ตอนนี้ระบบความปลอดภัยปิดอยู่' })
        .setTimestamp();

    const toggleButton = new ButtonBuilder()
        .setCustomId('antispam_toggle')
        .setLabel(isEnabled ? 'ปิดระบบกันสแปม' : 'เปิดระบบกันสแปม')
        .setEmoji(isEnabled ? '🔴' : '🟢')
        .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(toggleButton);

    return { embeds: [embed], components: [row] };
}

module.exports = {
    handleAntiScamMessage,
    fetchImageHash,
    generateAntiSpamPanel
};
