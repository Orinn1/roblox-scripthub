const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const botConfig = require('./config.js');

/**
 * ระบุประเภทของลิงก์ว่าเป็นบริการไหน
 */
function identifyLinkType(url) {
    const lower = url.toLowerCase();
    if (lower.includes('platoboost.com') || lower.includes('platoclay.com') || lower.includes('deltaexploits.net')) {
        return { name: 'Delta / Platoboost', icon: '⚡', color: 0x00f3ff };
    }
    if (lower.includes('linkvertise.com') || lower.includes('linkvertise.net') || lower.includes('link-to.net') || lower.includes('up-to-down.net')) {
        return { name: 'Linkvertise', icon: '🔗', color: 0xffa500 };
    }
    if (lower.includes('lootlabs.gg') || lower.includes('loot-link.com') || lower.includes('loot-links.com') || lower.includes('lootlink.org')) {
        return { name: 'LootLabs', icon: '💎', color: 0x9b59b6 };
    }
    if (lower.includes('work.ink') || lower.includes('workink.net')) {
        return { name: 'Work.ink', icon: '💼', color: 0x3498db };
    }
    if (lower.includes('sub2unlock') || lower.includes('sub4unlock')) {
        return { name: 'Sub2Unlock', icon: '🔓', color: 0x2ecc71 };
    }
    return { name: 'Shortlink / Ad-Gate', icon: '🌐', color: 0x5865f2 };
}

/**
 * ล้างพารามิเตอร์ส่วนเกินที่ไม่จำเป็นเพื่อให้ Resolver แมตช์แคชได้แม่นยำ 100%
 */
function cleanTargetUrl(url) {
    let clean = url.trim();
    // สำหรับ LootLabs ให้ตัด &data=... ทิ้งเพื่อดึง URL ปลายทางจากฐานข้อมูล
    if (clean.includes('lootlabs') || clean.includes('loot-link') || clean.includes('loot-links')) {
        clean = clean.replace(/(&data=[^&]+)/gi, '');
    }
    return clean;
}

/**
 * ดึงผลลัพธ์ผ่าน Bypass Providers ต่างๆ แบบมีระบบสลับตัวสำรอง (Fallback)
 */
async function resolveBypass(targetUrl) {
    const cleanUrl = cleanTargetUrl(targetUrl);

    const providers = [
        // 1. keybypass.net (Active & Fast - รองรับ LootLabs, Linkvertise, ฯลฯ)
        async () => {
            const res = await fetch('https://keybypass.net/api/bypass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: cleanUrl }),
                signal: AbortSignal.timeout(9000)
            });
            if (!res.ok) return null;
            const data = await res.json().catch(() => null);
            if (data && data.success && data.direct && data.direct !== cleanUrl && data.direct !== targetUrl) {
                return data.direct;
            }
            return null;
        },

        // 2. bypass.vip (ถ้ามี API Key ใน .env หรือใช้แคชระบบ)
        async () => {
            const apiKey = process.env.BYPASS_API_KEY || '';
            const endpoint = apiKey
                ? `https://api.bypass.vip/?url=${encodeURIComponent(cleanUrl)}&key=${apiKey}`
                : `https://api.bypass.vip/?url=${encodeURIComponent(cleanUrl)}`;
            const res = await fetch(endpoint, {
                signal: AbortSignal.timeout(9000),
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (!res.ok) return null;
            const data = await res.json().catch(() => null);
            if (data && (data.result || data.destination)) {
                return data.result || data.destination;
            }
            return null;
        },

        // 3. Sub2Unlock direct parser
        async () => {
            if (targetUrl.includes('sub2unlock') || targetUrl.includes('sub4unlock')) {
                const res = await fetch(targetUrl, { signal: AbortSignal.timeout(6000) });
                const html = await res.text();
                const match = html.match(/href=["'](https?:\/\/[^"']+)["'][^>]*id=["']btn_link["']/i) ||
                              html.match(/destination\s*=\s*["'](https?:\/\/[^"']+)["']/i) ||
                              html.match(/url\s*:\s*["'](https?:\/\/[^"']+)["']/i);
                if (match) return match[1];
            }
            return null;
        }
    ];

    for (const provider of providers) {
        try {
            const result = await provider();
            if (result && typeof result === 'string' && result.trim().length > 0 && !result.includes('Our free API has been shut down')) {
                return result.trim();
            }
        } catch (e) {
            // ข้ามไปลอง Provider ถัดไป
        }
    }

    return null;
}

/**
 * จัดการข้อความที่ส่งเข้ามาในห้อง Bypass
 */
async function handleBypassMessage(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = message.content.match(urlRegex);

    if (!matches || matches.length === 0) return;

    // ดึง URL ทั้งหมด (ตัดตัวซ้ำ และจำกัดไม่เกิน 3 ลิงก์ต่อ 1 ข้อความ)
    const targetUrls = [...new Set(matches.map(u => u.replace(/[>)]+$/, '')))].slice(0, 3);

    for (const targetUrl of targetUrls) {
        const linkInfo = identifyLinkType(targetUrl);

        // 1. ส่งการ์ดสถานะกำลังประมวลผล
        const loadingEmbed = new EmbedBuilder()
            .setColor(linkInfo.color)
            .setTitle(`${linkInfo.icon} กำลังข้ามลิงก์ ${linkInfo.name}...`)
            .setDescription(`🔗 **ลิงก์เป้าหมาย:** \`${targetUrl.length > 70 ? targetUrl.slice(0, 70) + '...' : targetUrl}\`\n\n⏳ กรุณารอสักครู่ ระบบกำลังดึงผลลัพธ์ผ่าน Bypass API...`)
            .setFooter({ text: 'Personal Bypass Assistant • ทำงานเฉพาะห้องนี้' })
            .setTimestamp();

        let replyMsg;
        try {
            replyMsg = await message.reply({ embeds: [loadingEmbed] });
        } catch (err) {
            console.error('Failed to send loading message:', err.message);
            continue;
        }

        const startTime = Date.now();

        try {
            const result = await resolveBypass(targetUrl);
            const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

            if (result) {
                const isUrl = result.startsWith('http://') || result.startsWith('https://');

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00ff88)
                    .setTitle(`✅ ปลดล็อค / ข้ามลิงก์สำเร็จ! (${linkInfo.name})`)
                    .addFields(
                        {
                            name: '🔗 ลิงก์ต้นทาง',
                            value: `[คลิกเพื่อดูลิงก์เดิม](${targetUrl})`,
                            inline: true
                        },
                        {
                            name: '⏱️ เวลาที่ใช้',
                            value: `\`${timeTaken} วินาที\``,
                            inline: true
                        },
                        {
                            name: isUrl ? '🎯 ลิงก์ปลายทาง (Destination)' : '🔑 รหัส Key ที่ได้',
                            value: isUrl ? `\`\`\`text\n${result}\n\`\`\`` : `\`\`\`yaml\n${result}\n\`\`\``
                        }
                    )
                    .setFooter({ text: `ข้ามสำเร็จ • BlacklistScriptx Assistant` })
                    .setTimestamp();

                const row = new ActionRowBuilder();
                if (isUrl) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel('🌐 เปิดลิงก์ปลายทาง')
                            .setStyle(ButtonStyle.Link)
                            .setURL(result)
                    );
                }

                await replyMsg.edit({
                    embeds: [successEmbed],
                    components: row.components.length > 0 ? [row] : []
                });
            } else {
                // กรณีข้ามไม่สำเร็จ (API ล่ม หรือต้องการการกดแก้ Captcha จริง)
                const failEmbed = new EmbedBuilder()
                    .setColor(0xff4757)
                    .setTitle(`❌ ไม่สามารถข้ามลิงก์ ${linkInfo.name} ได้ในขณะนี้`)
                    .setDescription(
                        `🔗 **ลิงก์:** \`${targetUrl.length > 70 ? targetUrl.slice(0, 70) + '...' : targetUrl}\`\n\n` +
                        `**สาเหตุที่เป็นไปได้:**\n` +
                        `• ระบบตรวจพบ **Cloudflare Turnstile Captcha** หรือ Checkpoint ที่ยังไม่มีใครเคยแก้\n` +
                        `• หรือ Free Bypass Server กำลังติด Rate Limit\n\n` +
                        `💡 *คำแนะนำ: คุณสามารถลองกดลิงก์ต้นทางด้วยตนเอง หรือส่งใหม่อีกครั้งในอีกสักครู่ครับ*`
                    )
                    .setFooter({ text: 'Personal Bypass Assistant • เฉพาะคุณใช้งาน' })
                    .setTimestamp();

                await replyMsg.edit({ embeds: [failEmbed] });
            }
        } catch (error) {
            console.error('[Bypass Error]:', error);
            await replyMsg.edit({
                content: `⚠️ เกิดข้อผิดพลาดขณะประมวลผล: \`${error.message}\``,
                embeds: []
            }).catch(() => {});
        }
    }
}

module.exports = {
    handleBypassMessage,
    identifyLinkType,
    resolveBypass
};
