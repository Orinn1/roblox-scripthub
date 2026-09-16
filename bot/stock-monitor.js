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
 * อัปเดตข้อความกระดานผลสดที่แอดมินหรือผู้ใช้สั่งพิมพ์ไว้ (/stock mode:live)
 * แก้ไขข้อความเดิมในห้องแบบเรียลไทม์ โดยไม่ต้องพิมพ์ใหม่
 */
async function updateLivePanels(client, stock) {
    try {
        const config = db.getConfig();
        const panels = config.stock_live_panels;
        if (!Array.isArray(panels) || panels.length === 0) return;

        const activePanels = [];

        for (const panel of panels) {
            try {
                const channel = await client.channels.fetch(panel.channelId).catch(() => null);
                if (!channel) continue;

                const message = await channel.messages.fetch(panel.messageId).catch(() => null);
                if (!message) continue;

                const embed = createStockEmbed(stock, { isLive: true, dealer: panel.dealer || 'all' });
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

                await message.edit({ embeds: [embed], components: [row] }).catch(() => null);
                activePanels.push(panel);
            } catch (panelErr) {
                // หากข้อความถูกลบให้ตัดออกจากลิสต์
            }
        }

        // หากมีการลบข้อความในดิสคอร์ด ให้อัปเดตรายการที่เหลือ
        if (activePanels.length !== panels.length) {
            db.saveConfig({ stock_live_panels: activePanels });
        }
    } catch (err) {
        console.error('[Stock Monitor updateLivePanels Error]:', err.message);
    }
}

async function sendStockNotification(client, stock) {
    try {
        const targetChannelId = botConfig.stockAlertChannelId || botConfig.robloxAlertChannelId || '1549456641379012709';
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

    console.log('🚀 [Stock Monitor] มอนิเตอร์แจ้งเตือนและกระดานสด Blox Fruits เปิดทำงานแล้ว');
}

module.exports = {
    startStockMonitor,
    checkStockRotation,
    updateLivePanels,
    sendStockNotification
};
