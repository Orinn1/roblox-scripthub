/**
 * Blox Fruits Stock Monitor & Auto Notifier
 * 1. ตรวจจับการหมุนเวียนของผลปีศาจในเกม Blox Fruits (ทุก 4 ชม.) และส่งแจ้งเตือนเข้าห้อง Discord
 * 2. อัปเดตกระดานผลสด 24 ชม. (Live Auto-Updating Panel) ทุก 60 วินาที โดยผู้ใช้ไม่ต้องพิมพ์ซ้ำ
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBloxFruitsStock, getRarityIcon, createStockEmbed } = require('./bloxfruits-stock.js');
const botConfig = require('./config.js');
const db = require('../db.js');

let lastAnnouncedNormalStartedAt = 0;
let isFirstCheck = true;

async function checkStockRotation(client) {
    try {
        const stock = await getBloxFruitsStock(false);
        if (!stock || !stock.normal) return;

        const currentStartedAt = stock.normal.startedAt;

        // ครั้งแรกที่เปิดบอท: บันทึกเวลาเริ่มต้นรอบปัจจุบันไว้ ไม่ส่งสแปม
        if (isFirstCheck) {
            lastAnnouncedNormalStartedAt = currentStartedAt;
            isFirstCheck = false;
            console.log(`🍇 [Stock Monitor] เริ่มต้นระบบเฝ้าระวังผล Blox Fruits (รอบปัจจุบันเริ่มเมื่อ: ${new Date(currentStartedAt).toLocaleTimeString()})`);
        } else if (currentStartedAt && currentStartedAt !== lastAnnouncedNormalStartedAt) {
            // ตรวจจับว่ามีการหมุนเวียนรอบใหม่หรือไม่ (startedAt เปลี่ยน)
            console.log('🚨 [Stock Monitor] ตรวจพบการหมุนเวียนผลปีศาจรอบใหม่! กำลังส่งแจ้งเตือนเข้า Discord...');
            lastAnnouncedNormalStartedAt = currentStartedAt;

            await sendStockNotification(client, stock);
        }

        // อัปเดตข้อความกระดานผลสด 24 ชม. ที่เคยตั้งไว้ (Auto-Updating Panels)
        await updateLivePanels(client, stock);
    } catch (err) {
        console.error('[Stock Monitor Check Error]:', err.message);
    }
}

/**
 * อัปเดตข้อความกระดานผลสด 24 ชม. ลงเฉพาะห้องที่กำหนด (ค่าเริ่มต้น: 1549774966474674259)
 * - บอทจะตรวจสอบว่ามีข้อความกระดานสดในห้องนี้แล้วหรือยัง
 * - หากมีอยู่แล้ว: แก้ไข (edit) ข้อความเดิมให้เป็นข้อมูลล่าสุดทุก 60 วินาที
 * - หากยังไม่มีหรือข้อความถูกลบ: โพสต์ข้อความกระดานสดใหม่ลงในห้องนี้ทันทีอัตโนมัติ
 * - กรองและลบพาเนลของห้องอื่นออก เพื่อให้ทำงานเฉพาะห้องนี้เท่านั้น
 */
async function updateLivePanels(client, stock) {
    try {
        const targetChannelId = botConfig.stockLiveChannelId || '1549774966474674259';
        const channel = await client.channels.fetch(targetChannelId).catch(() => null);
        if (!channel) {
            console.warn(`⚠️ [Stock Monitor] ไม่พบห้องกระดานผลสด ID: ${targetChannelId}`);
            return;
        }

        const config = db.getConfig();
        let panels = Array.isArray(config.stock_live_panels) ? config.stock_live_panels : [];

        // กรองเอาเฉพาะพาเนลของห้องที่กำหนดเท่านั้น (ลงเฉพาะห้องนี้)
        panels = panels.filter(p => p.channelId === targetChannelId);

        const embed = createStockEmbed(stock, { isLive: true, dealer: 'all' });
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 เว็บไซต์สคริปต์ฮับ')
                .setStyle(ButtonStyle.Link)
                .setURL(botConfig.websiteUrl || 'https://blacklistscripty.vercel.app'),
            new ButtonBuilder()
                .setCustomId('stock_refresh')
                .setLabel('🔄 รีเฟรชข้อมูล')
                .setStyle(ButtonStyle.Secondary)
        );

        let activePanel = null;

        // ตรวจสอบข้อความเดิมที่บันทึกไว้ว่ายังอยู่ในดิสคอร์ดหรือไม่
        for (const panel of panels) {
            try {
                const message = await channel.messages.fetch(panel.messageId).catch(() => null);
                if (message) {
                    await message.edit({ embeds: [embed], components: [row] }).catch(() => null);
                    activePanel = panel;
                    break;
                }
            } catch (msgErr) {
                // ข้อความถูกลบหรือไม่พบ
            }
        }

        // หากยังไม่มีกระดานสดในห้องนี้ หรือข้อความเดิมถูกลบ ให้โพสต์กระดานใหม่ลงห้องนี้โดยอัตโนมัติ
        if (!activePanel) {
            console.log(`📌 [Stock Monitor] กำลังสร้างกระดานผลสด Blox Fruits อัตโนมัติลงห้อง #${channel.name} (${targetChannelId})...`);
            const newMessage = await channel.send({ embeds: [embed], components: [row] });
            activePanel = {
                channelId: targetChannelId,
                messageId: newMessage.id,
                guildId: channel.guildId || '',
                dealer: 'all',
                createdAt: Date.now()
            };
            console.log(`✅ [Stock Monitor] สร้างกระดานผลสดลงห้อง #${channel.name} เรียบร้อย! (Message ID: ${newMessage.id})`);
        }

        // บันทึกสถานะกระดานเฉพาะห้องนี้ห้องเดียว
        db.saveConfig({ stock_live_panels: [activePanel] });
    } catch (err) {
        console.error('[Stock Monitor updateLivePanels Error]:', err.message);
    }
}

async function sendStockNotification(client, stock) {
    try {
        const targetChannelId = botConfig.stockAlertChannelId || botConfig.stockLiveChannelId || '1549774966474674259';
        const channel = await client.channels.fetch(targetChannelId).catch(() => null);

        if (!channel) {
            console.warn(`⚠️ [Stock Monitor] ไม่พบห้องแจ้งเตือน ID: ${targetChannelId}`);
            return;
        }

        const normalResetUnix = Math.floor(stock.normal.resetsAt / 1000);
        const highTierFruits = stock.normal.fruits.filter(f => f.rarity === 'Legendary' || f.rarity === 'Mythical');
        const hasRare = highTierFruits.length > 0;

        const normalFruitList = stock.normal.fruits.map(f => {
            const icon = getRarityIcon(f.rarity);
            const beli = typeof f.beliPrice === 'number' ? `$${f.beliPrice.toLocaleString()}` : '-';
            const robux = typeof f.robuxPrice === 'number' ? `R$ ${f.robuxPrice}` : '-';
            const tag = (f.rarity === 'Mythical' || f.rarity === 'Legendary') ? ' 🔥 **[HOT]**' : '';
            return `${icon} **${f.name}**${tag} \`[${f.rarity}]\` — 💵 ${beli} | 🪙 ${robux}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(hasRare ? 0xff0055 : 0x00ff88)
            .setTitle(hasRare ? '🔥 [แจ้งเตือนผลเข้าใหม่!] มีผลแรร์ระดับสูงเข้าในรอบนี้!' : '🍇 [แจ้งเตือนผลเข้าใหม่!] Blox Fruit Dealer รีเซ็ตสต็อกแล้ว')
            .setDescription(
                `พ่อค้า Blox Fruit Dealer ได้ทำการหมุนเวียนรายการผลไม้ประจำรอบใหม่แล้ว!\n` +
                (hasRare ? `⭐ **ผลเด่นรอบนี้:** ${highTierFruits.map(f => `**${f.name}**`).join(', ')}\n` : '') +
                `⏳ **รอบถัดไปจะรีเซ็ตใน:** <t:${normalResetUnix}:R> (<t:${normalResetUnix}:T>)`
            )
            .addFields({
                name: '📦 ผลที่มีวางจำหน่ายในรอบนี้:',
                value: normalFruitList || 'ไม่มีข้อมูลผลไม้',
                inline: false
            })
            .setThumbnail('https://i.postimg.cc/cHdrRJVP/Rocket.png')
            .setFooter({ text: 'BlacklistScriptx • ระบบแจ้งเตือนผลปีศาจ Blox Fruits' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 เว็บไซต์สคริปต์ฮับ')
                .setStyle(ButtonStyle.Link)
                .setURL(botConfig.websiteUrl || 'https://blacklistscripty.vercel.app')
        );

        let content = '';
        if (hasRare) {
            content = '📢 **มีผลปีศาจระดับสูงเข้าในร้านค้า Blox Fruits แล้ว!**';
        }

        await channel.send({ content: content || undefined, embeds: [embed], components: [row] });
        console.log(`✅ [Stock Monitor] ส่งแจ้งเตือนผลรอบใหม่เข้าห้อง #${channel.name} สำเร็จ!`);
    } catch (err) {
        console.error('[Stock Monitor Send Notification Error]:', err.message);
    }
}

function startStockMonitor(client) {
    if (!client) return;

    // รันครั้งแรกทันที
    checkStockRotation(client);

    // ตรวจสอบความเปลี่ยนแปลงและอัปเดตกระดานสดทุก 60 วินาที
    setInterval(() => {
        checkStockRotation(client);
    }, 60 * 1000);

    console.log(`🚀 [Stock Monitor] มอนิเตอร์แจ้งเตือนและกระดานสด Blox Fruits เปิดทำงานแล้ว (ห้อง Live Stock: ${botConfig.stockLiveChannelId || '1549774966474674259'})`);
}

module.exports = {
    startStockMonitor,
    checkStockRotation,
    updateLivePanels,
    sendStockNotification
};
