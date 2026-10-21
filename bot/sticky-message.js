const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const botConfig = require('./config.js');

// Map to keep track of the last sticky message per channel (channelId -> messageId)
const lastStickyMessageMap = new Map();

// Debounce timer map per channel (channelId -> Timeout)
const debounceTimerMap = new Map();

// Lock map to prevent race conditions during deletion and re-posting
const isProcessingMap = new Map();

/**
 * Handle sticky message for specific channels (e.g. #รับยศไม่ได้)
 * @param {import('discord.js').Message} message 
 */
async function handleStickyMessage(message) {
    if (!message || !message.channel || !message.guild) return;

    const targetChannelId = botConfig.roleWaitChannelId || '1553327513990860821';
    if (message.channel.id !== targetChannelId) return;

    // Ignore bot's own sticky messages to prevent infinite loops
    if (message.author.id === message.client.user?.id) {
        return;
    }

    // Debounce to handle rapid bursts of chat messages without getting rate-limited
    if (debounceTimerMap.has(message.channel.id)) {
        clearTimeout(debounceTimerMap.get(message.channel.id));
    }

    const timer = setTimeout(async () => {
        debounceTimerMap.delete(message.channel.id);
        await postStickyMessage(message.channel);
    }, 2200); // 2.2 seconds debounce

    debounceTimerMap.set(message.channel.id, timer);
}

/**
 * Post/re-post the sticky message at the very bottom of the channel
 * @param {import('discord.js').TextChannel} channel 
 */
async function postStickyMessage(channel) {
    if (!channel || !channel.isTextBased()) return;

    // Check if another instance is already processing for this channel
    if (isProcessingMap.get(channel.id)) return;
    isProcessingMap.set(channel.id, true);

    try {
        // 1. ตรวจสอบข้อความล่าสุดในห้อง เพื่อป้องกันการส่งซ้ำเมื่อบอทรีสตาร์ท
        let recentMessages = null;
        try {
            recentMessages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
        } catch (fetchErr) {}

        const botId = channel.client.user?.id;
        const existingStickies = recentMessages 
            ? recentMessages.filter(m => 
                m.author.id === botId && 
                m.embeds && 
                m.embeds[0]?.title?.includes('แจ้งเตือน: สำหรับสมาชิกที่รับยศไม่ได้')
            )
            : null;

        // ถ้าข้อความล่างสุดของห้องเป็นข้อความปักหมุดอยู่แล้ว ไม่ต้องส่งใหม่เด็ดขาด!
        if (recentMessages && recentMessages.size > 0 && existingStickies && existingStickies.size > 0) {
            const newestMessage = recentMessages.first();
            if (newestMessage && existingStickies.has(newestMessage.id)) {
                lastStickyMessageMap.set(channel.id, newestMessage.id);
                // ลบข้อความปักหมุดเก่าๆ ที่ซ้ำค้างอยู่ออกให้หมด เหลือแค่อันล่างสุดอันเดียว
                for (const [id, oldSticky] of existingStickies) {
                    if (id !== newestMessage.id && oldSticky.deletable) {
                        await oldSticky.delete().catch(() => {});
                    }
                }
                return;
            }
        }

        // ลบข้อความปักหมุดเดิมทั้งหมดก่อนโพสต์ใหม่ที่ล่างสุด
        if (existingStickies && existingStickies.size > 0) {
            for (const [, oldSticky] of existingStickies) {
                if (oldSticky.deletable) {
                    await oldSticky.delete().catch(() => {});
                }
            }
        } else {
            const lastMessageId = lastStickyMessageMap.get(channel.id);
            if (lastMessageId) {
                try {
                    const oldMsg = await channel.messages.fetch(lastMessageId).catch(() => null);
                    if (oldMsg && oldMsg.deletable) {
                        await oldMsg.delete().catch(() => {});
                    }
                } catch (delErr) {}
            }
        }
        lastStickyMessageMap.delete(channel.id);

        // 2. Build the Sticky Embed Message
        const stickyEmbed = new EmbedBuilder()
            .setColor(0xF59E0B) // Amber / Warning Gold
            .setTitle('📌 แจ้งเตือน: สำหรับสมาชิกที่รับยศไม่ได้')
            .setDescription(
                `👋 **สวัสดีครับสมาชิกทุกคน**\n\n` +
                `หากคุณทำตามขั้นตอนแล้ว **ยังไม่ได้รับยศอัตโนมัติ**:\n\n` +
                `💬 **สิ่งที่ต้องทำในห้องนี้:**\n` +
                `• **ไม่ต้องแคปรูปหรือพิมพ์อะไรยาวๆ ทั้งนั้นครับ**\n` +
                `• **ให้พิมพ์จุด \`.\` ทิ้งไว้ 1 ข้อความ แล้วรอได้เลยครับ**\n\n` +
                `⏳ **สถานะการดำเนินการ:**\n` +
                `แอดมินจะเข้ามาตรวจสอบและ **ทยอยเพิ่มยศให้ทุกคนตามลำดับจุด** ครับ\n` +
                `*(โปรดใจเย็นๆ พิมพ์จุดแค่ครั้งเดียว ไม่ต้องพิมพ์รัวๆ หรือแท็กแอดมินซ้ำนะครับ)*\n\n` +
                `───────────────────────────────\n` +
                `👑 **สิทธิ์ VIP Bypass (ไร้โฆษณา 100% + ข้ามเกทถาวร):**\n` +
                `• ราคาเพียง **30 บาท** (สิทธิ์ถาวรตลอดชีพ)\n` +
                `• **ต้องติดต่อซื้อยศกับแอดมินก่อน** (ทัก DM หาแอดมินได้เลย)\n` +
                `• เมื่อแอดมินเพิ่มยศให้แล้ว สามารถกดปุ่ม **"ล็อกอิน VIP บนเว็บ"** เพื่อเริ่มใช้งานได้ทันที!`
            )
            .addFields(
                {
                    name: '🌐 เว็บไซต์ Script Hub',
                    value: '[คลิกเข้าสู่เว็บไซต์](https://th.blacklisthub.workers.dev/)',
                    inline: true
                },
                {
                    name: '⚡ ยศ VIP Bypass (30฿)',
                    value: 'ซื้อกับแอดมิน → ล็อกอินบนเว็บ',
                    inline: true
                }
            )
            .setFooter({
                text: 'Blacklist Community • ข้อความนี้จะถูกปักหมุดไว้ล่างสุดเสมอ',
                iconURL: channel.guild.iconURL({ dynamic: true }) || undefined
            })
            .setTimestamp();

        // 3. Build Action Buttons
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('ล็อกอิน VIP บนเว็บ (หลังซื้อยศ 30฿)')
                .setEmoji('⚡')
                .setStyle(ButtonStyle.Link)
                .setURL('https://th.blacklisthub.workers.dev/api/discord-auth?action=login'),
            new ButtonBuilder()
                .setLabel('ไปยังเว็บ Script Hub')
                .setEmoji('🌐')
                .setStyle(ButtonStyle.Link)
                .setURL('https://th.blacklisthub.workers.dev/')
        );

        // 4. Send the new sticky message
        const newMsg = await channel.send({
            embeds: [stickyEmbed],
            components: [actionRow]
        });

        if (newMsg && newMsg.id) {
            lastStickyMessageMap.set(channel.id, newMsg.id);
        }
    } catch (err) {
        console.error('[Sticky Message Error]:', err.message || err);
    } finally {
        isProcessingMap.set(channel.id, false);
    }
}

module.exports = {
    handleStickyMessage,
    postStickyMessage
};
