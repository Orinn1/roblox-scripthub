const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const botConfig = require('./config.js');
let db = null;
try { db = require('../db.js'); } catch (e) {}

const ROBLOX_VERSION_URL = 'https://clientsettingscdn.roblox.com/v2/client-version/WindowsPlayer';
const CHECK_INTERVAL_MS = 3 * 60 * 1000; // Check every 3 minutes

let lastKnownVersionUpload = '';
let isInitialized = false;

// Load persisted last known version from database / config
try {
    const currentConfig = db && db.getConfig ? db.getConfig() : {};
    lastKnownVersionUpload = currentConfig.last_roblox_client_version || '';
} catch (e) {}

function persistRobloxVersion(versionUpload) {
    lastKnownVersionUpload = versionUpload;
    try {
        if (db && db.saveConfig) {
            db.saveConfig({ last_roblox_client_version: versionUpload });
        }
    } catch (e) {}
}

/**
 * Fetch latest Roblox Client Version from official Roblox CDN
 */
async function fetchRobloxVersion() {
    try {
        const resp = await fetch(ROBLOX_VERSION_URL, {
            headers: { 'User-Agent': 'Roblox/WinInet' },
            signal: AbortSignal.timeout(8000)
        });

        if (!resp.ok) return null;
        const data = await resp.json();

        return {
            version: data.version || 'Unknown',
            clientVersionUpload: data.clientVersionUpload || '',
            bootstrapperVersion: data.bootstrapperVersion || ''
        };
    } catch (e) {
        console.error('[Roblox Monitor Error]:', e.message);
        return null;
    }
}

/**
 * Send Roblox Update Alert to Discord Channel
 */
async function sendRobloxUpdateAlert(client, info, isTest = false) {
    if (!client) return false;

    const channelId = botConfig.robloxAlertChannelId || '1549456641379012709';
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            console.warn(`[Roblox Monitor] ไม่พบห้องแจ้งเตือน ID: ${channelId} หรือบอทไม่มีสิทธิ์เข้าถึง`);
            return false;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF4444) // Bright Red Alert
            .setAuthor({
                name: '🚨 Roblox Client Update Notification',
                iconURL: 'https://images.rbxcdn.com/2b4260f8519d7b9eccff51ec6903f901.ico'
            })
            .setTitle('⚠️ [แจ้งเตือนด่วน] Roblox มีการอัปเดตแพตช์ใหม่!')
            .setDescription(
                `ขณะนี้เซิร์ฟเวอร์ Roblox ได้ปล่อยอัปเดตตัวเกมเวอร์ชันใหม่แล้ว ตัวรันสคริปต์ส่วนใหญ่จะ **หลุดหรือใช้งานไม่ได้ชั่วคราว (Patched)**\n\n` +
                `🛡️ **ข้อแนะนำเพื่อความปลอดภัย:**\n` +
                `• **อย่าเพิ่งฝืนเปิดตัวรันหรือรันสคริปต์เด็ดขาด** (อาจเสี่ยงต่อการโดนตรวจจับ / แบนไอดี)\n` +
                `• รอให้ผู้พัฒนาตัวรัน (เช่น Delta, Solara, Wave ฯลฯ) ปล่อยอัปเดตเวอร์ชันใหม่ก่อน\n` +
                `• สามารถพิมพ์คำสั่ง \`/exploits\` เพื่อตรวจสอบสถานะตัวรันแบบเรียลไทม์ได้ตลอดเวลา`
            )
            .addFields(
                {
                    name: '⚙️ เวอร์ชันใหม่ (Version)',
                    value: `\`${info.version}\``,
                    inline: true
                },
                {
                    name: '🔑 Build Hash',
                    value: `\`${(info.clientVersionUpload || 'N/A').slice(0, 20)}\``,
                    inline: true
                },
                {
                    name: '💻 แพลตฟอร์ม',
                    value: '`Windows (PC)`',
                    inline: true
                }
            )
            .setFooter({ text: 'BlacklistScriptx • ระบบแจ้งเตือนอัปเดตความปลอดภัยอัตโนมัติ' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🛡️ เช็คสถานะตัวรันบนเว็บ')
                .setStyle(ButtonStyle.Link)
                .setURL(`${botConfig.websiteUrl}#exploits`),
            new ButtonBuilder()
                .setLabel('🌐 เข้าสู่เว็บไซต์หลัก')
                .setStyle(ButtonStyle.Link)
                .setURL(botConfig.websiteUrl)
        );

        const mentionText = isTest
            ? '🧪 **[ทดสอบระบบแจ้งเตือน Roblox Update]** บอทเชื่อมต่อห้องนี้สำเร็จเรียบร้อย!'
            : '📢 **[แจ้งเตือนด่วน]** มีการอัปเดตแพตช์ Roblox ใหม่! โปรดระวังการใช้งานตัวรันสคริปต์ ⚠️';

        await channel.send({
            content: mentionText,
            embeds: [embed],
            components: [row]
        });

        console.log(`[Roblox Monitor] ส่งแจ้งเตือน Roblox Update (${info.version}) ไปที่ห้อง ${channelId} สำเร็จ`);
        return true;
    } catch (err) {
        console.error('[Roblox Monitor Send Error]:', err.message);
        return false;
    }
}

/**
 * Send Banwave Warning Alert to Discord Channel
 */
async function sendBanwaveAlert(client, customReason = '', isTest = false) {
    if (!client) return false;

    const channelId = botConfig.robloxAlertChannelId || '1549456641379012709';
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) return false;

        const embed = new EmbedBuilder()
            .setColor(0xFFA500) // Warning Orange
            .setAuthor({
                name: '🛡️ Roblox Anti-Cheat Alert',
                iconURL: 'https://images.rbxcdn.com/2b4260f8519d7b9eccff51ec6903f901.ico'
            })
            .setTitle('🚨 [เตือนภัยคลื่นแบน] ตรวจพบสัญญาณ Banwave!')
            .setDescription(
                `ขณะนี้มีรายงานความเสี่ยงสูงเกี่ยวกับ **การตรวจจับตัวรันสคริปต์ (Detection / Banwave)**\n\n` +
                `⚠️ **คำเตือนสำคัญสำหรับสมาชิก:**\n` +
                `• **ห้ามใช้ไอดีหลัก (Main Account)** เล่นโปรโดยเด็ดขาด ให้ใช้เฉพาะไอดีไก่ (Alt)\n` +
                `• หลีกเลี่ยงการเปิดฟังก์ชันเสี่ยง เช่น Silent Aim, Teleport รุนแรง, หรือ NoClip\n` +
                `• ติดตามประกาศสถานะจากผู้พัฒนาตัวรันอย่างใกล้ชิด`
            )
            .setFooter({ text: 'BlacklistScriptx • Anti-Cheat Warning System' })
            .setTimestamp();

        if (customReason) {
            embed.addFields({
                name: '📋 ข้อมูลเพิ่มเติม',
                value: `> *${customReason}*`,
                inline: false
            });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🛡️ เช็คสถานะตัวรันล่าสุด')
                .setStyle(ButtonStyle.Link)
                .setURL(`${botConfig.websiteUrl}#exploits`)
        );

        const mentionText = isTest
            ? '🧪 **[ทดสอบระบบเตือน Banwave]** บอทเชื่อมต่อห้องนี้สำเร็จเรียบร้อย!'
            : '🚨 **[เตือนภัย Banwave]** โปรดระวังการแบนไอดี อย่าใช้ไอดีหลักเล่นโปรเด็ดขาด! ⚠️';

        await channel.send({
            content: mentionText,
            embeds: [embed],
            components: [row]
        });

        console.log(`[Banwave Alert] ส่งแจ้งเตือน Banwave ไปที่ห้อง ${channelId} สำเร็จ`);
        return true;
    } catch (err) {
        console.error('[Banwave Alert Send Error]:', err.message);
        return false;
    }
}

/**
 * Initialize background Roblox monitor loop
 */
function startRobloxMonitor(client) {
    if (!client) return;

    let isChecking = false;

    async function checkRobloxUpdate() {
        if (isChecking) return;
        isChecking = true;

        try {
            const info = await fetchRobloxVersion();
            if (!info || !info.clientVersionUpload) {
                isChecking = false;
                return;
            }

            // First run: remember the current version
            if (!isInitialized || !lastKnownVersionUpload) {
                persistRobloxVersion(info.clientVersionUpload);
                isInitialized = true;
                console.log(`[Roblox Monitor] บันทึกเวอร์ชันเริ่มต้น: ${info.version} (${info.clientVersionUpload})`);
                isChecking = false;
                return;
            }

            isInitialized = true;

            // Detect if clientVersionUpload changed!
            if (lastKnownVersionUpload !== info.clientVersionUpload) {
                console.log(`[Roblox Monitor] 🚨 ตรวจพบ ROBLOX UPDATE! เก่า: ${lastKnownVersionUpload} -> ใหม่: ${info.clientVersionUpload}`);
                persistRobloxVersion(info.clientVersionUpload);
                await sendRobloxUpdateAlert(client, info);
            }
        } catch (e) {
            console.error('[Roblox Monitor Loop Error]:', e);
        } finally {
            isChecking = false;
        }
    }

    // Run first check after 15 seconds, then every 3 minutes
    setTimeout(checkRobloxUpdate, 15000);
    setInterval(checkRobloxUpdate, CHECK_INTERVAL_MS);
    console.log(`🎮 [Roblox Monitor] เริ่มระบบเฝ้าติดตาม Roblox Update & Banwave (ห้องแจ้งเตือน: ${botConfig.robloxAlertChannelId || '1549456641379012709'})`);
}

module.exports = {
    startRobloxMonitor,
    fetchRobloxVersion,
    sendRobloxUpdateAlert,
    sendBanwaveAlert
};
