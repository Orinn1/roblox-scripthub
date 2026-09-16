/**
 * Blox Fruits Stock Monitor & Auto Notifier
 * ตรวจจับการหมุนเวียนของผลปีศาจในเกม Blox Fruits (ทุก 4 ชม.) และส่งแจ้งเตือนเข้าห้อง Discord
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBloxFruitsStock, getRarityIcon } = require('./bloxfruits-stock.js');
const botConfig = require('./config.js');

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
            return;
        }

        // ตรวจจับว่ามีการหมุนเวียนรอบใหม่หรือไม่ (startedAt เปลี่ยน)
        if (currentStartedAt && currentStartedAt !== lastAnnouncedNormalStartedAt) {
            console.log('🚨 [Stock Monitor] ตรวจพบการหมุนเวียนผลปีศาจรอบใหม่! กำลังส่งแจ้งเตือนเข้า Discord...');
            lastAnnouncedNormalStartedAt = currentStartedAt;

            await sendStockNotification(client, stock);
        }
    } catch (err) {
        console.error('[Stock Monitor Check Error]:', err.message);
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

    // ตรวจสอบความเปลี่ยนแปลงทุก 60 วินาที
    setInterval(() => {
        checkStockRotation(client);
    }, 60 * 1000);

    console.log('🚀 [Stock Monitor] มอนิเตอร์แจ้งเตือนผลปีศาจ Blox Fruits เปิดทำงานแล้ว');
}

module.exports = {
    startStockMonitor,
    checkStockRotation,
    sendStockNotification
};
