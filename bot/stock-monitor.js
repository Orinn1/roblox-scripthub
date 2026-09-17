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

        // ครั้งแรกที่เปิดบอท: บันทึกเวลาเริ่มต้นรอบปัจจุบันไว้
        if (isFirstCheck) {
            lastAnnouncedNormalStartedAt = currentStartedAt;
            isFirstCheck = false;
            console.log(`🍇 [Stock Monitor] เริ่มต้นระบบกระดานผลสด Blox Fruits (รอบปัจจุบันเริ่มเมื่อ: ${new Date(currentStartedAt).toLocaleTimeString()})`);
        } else if (currentStartedAt && currentStartedAt !== lastAnnouncedNormalStartedAt) {
            // เมื่อร้านค้าในเกมหมุนเวียนรอบใหม่ (ทุก 4 ชม.)
            // อัปเดตข้อมูลลงบนข้อความเดิมทันที โดยไม่ส่งข้อความใหม่ให้รกห้อง
            console.log('🚨 [Stock Monitor] ตรวจพบการหมุนเวียนผลปีศาจรอบใหม่! อัปเดตข้อมูลบนกระดานเดิมทันที (ไม่ส่งข้อความใหม่)');
            lastAnnouncedNormalStartedAt = currentStartedAt;
        }

        // อัปเดตแก้ไขข้อความเดิมบนกระดานผลสด 24 ชม. (Edit in-place เท่านั้น)
        await updateLivePanels(client, stock);
    } catch (err) {
        console.error('[Stock Monitor Check Error]:', err.message);
    }
}

/**
 * อัปเดตข้อความกระดานผลสด 24 ชม. ลงเฉพาะห้องที่กำหนด (1549774966474674259)
 * - ทำงานแบบข้อความเดียว (Single Live Message) ตลอด 24 ชม.
 * - แก้ไข (edit) ข้อความเดิมทุก 60 วินาที และเมื่อผลรีเซ็ต ไม่ส่งข้อความใหม่เด็ดขาด
 * - หากมีข้อความแจ้งเตือนเก่าของบอทตกค้าง จะนำมารีไซเคิลเป็นกระดานสด หรือลบข้อความซ้ำออก
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

        let targetMessage = null;

        // 1. ตรวจสอบข้อความที่เคยบันทึกไว้ใน config ก่อน
        for (const panel of panels) {
            try {
                const message = await channel.messages.fetch(panel.messageId).catch(() => null);
                if (message && message.author.id === client.user.id) {
                    targetMessage = message;
                    break;
                }
            } catch (msgErr) {}
        }

        // 2. ถ้าไม่มีใน config หรือข้อความเดิมหลุด ให้ค้นหาข้อความเดิมของบอทในห้อง
        // เพื่อนำข้อความเดิมมาแก้ไข (edit) ทันที ไม่ส่งข้อความใหม่
        const botMessages = [];
        try {
            const recentMessages = await channel.messages.fetch({ limit: 30 }).catch(() => null);
            if (recentMessages) {
                recentMessages.forEach(m => {
                    if (m.author.id === client.user.id) {
                        botMessages.push(m);
                    }
                });
            }
        } catch (e) {}

        if (!targetMessage && botMessages.length > 0) {
            targetMessage = botMessages[0]; // ใช้ข้อความล่าสุดของบอท
            console.log(`♻️ [Stock Monitor] พบข้อความเดิมของบอทในห้อง (ID: ${targetMessage.id}) นำมาใช้เป็นกระดานสดโดยไม่ต้องส่งข้อความใหม่`);
        }

        // 3. ถ้ามีข้อความของบอทตกค้างมากกว่า 1 ข้อความ (เช่น ข้อความแจ้งเตือนเก่า) ให้ลบข้อความส่วนเกินออก
        if (botMessages.length > 1) {
            for (const oldMsg of botMessages) {
                if (targetMessage && oldMsg.id !== targetMessage.id) {
                    await oldMsg.delete().catch(() => {});
                }
            }
        }

        // 4. แก้ไข (edit) ข้อความเดิม
        if (targetMessage) {
            await targetMessage.edit({ content: '', embeds: [embed], components: [row] }).catch(err => {
                console.error('[Stock Monitor Edit Error]:', err.message);
            });
            db.saveConfig({
                stock_live_panels: [{
                    channelId: targetChannelId,
                    messageId: targetMessage.id,
                    guildId: channel.guildId || '',
                    dealer: 'all',
                    updatedAt: Date.now()
                }]
            });
        } else {
            // กรณีเป็นห้องใหม่เอี่ยมที่ไม่มีข้อความใดๆ ของบอทเลย จึงจะส่งข้อความเริ่มต้น 1 ข้อความ
            console.log(`📌 [Stock Monitor] ไม่พบข้อความเดิมในห้อง #${channel.name} กำลังสร้างข้อความกระดานสดเริ่มต้น...`);
            const newMessage = await channel.send({ embeds: [embed], components: [row] });
            db.saveConfig({
                stock_live_panels: [{
                    channelId: targetChannelId,
                    messageId: newMessage.id,
                    guildId: channel.guildId || '',
                    dealer: 'all',
                    updatedAt: Date.now()
                }]
            });
            console.log(`✅ [Stock Monitor] สร้างกระดานผลสดเริ่มต้นลงห้อง #${channel.name} เรียบร้อย! (ID: ${newMessage.id})`);
        }
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
