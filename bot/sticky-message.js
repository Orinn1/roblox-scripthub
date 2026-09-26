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
        // 1. Delete previous sticky message if it exists
        const lastMessageId = lastStickyMessageMap.get(channel.id);
        if (lastMessageId) {
            try {
                const oldMsg = await channel.messages.fetch(lastMessageId).catch(() => null);
                if (oldMsg && oldMsg.deletable) {
                    await oldMsg.delete().catch(() => {});
                }
            } catch (delErr) {
                // Ignore delete errors (e.g. message already deleted)
            }
            lastStickyMessageMap.delete(channel.id);
        }

        // 2. Build the Sticky Embed Message
        const stickyEmbed = new EmbedBuilder()
            .setColor(0xF59E0B) // Amber / Warning Gold
            .setTitle('📌 แจ้งเตือน: สำหรับสมาชิกที่รับยศไม่ได้')
            .setDescription(
                `👋 **สวัสดีครับสมาชิกทุกคน**\n\n` +
                `หากคุณทำตามขั้นตอนแล้ว **ยังไม่ได้รับยศอัตโนมัติ** หรือติดปัญหาใดๆ:\n\n` +
                `📝 **สิ่งที่ต้องพิมพ์ทิ้งไว้ในห้องนี้:**\n` +
                `• แคปภาพหน้าจอที่ติดปัญหา หรือแจ้งชื่อบัญชี Discord\n` +
                `• ระบุอาการที่พบ เช่น *"กดปุ่มแล้วไม่ไป"*, *"ติดหน้าไหน"*, *"ยืนยันตัวตนไม่ได้"*\n\n` +
                `⏳ **สถานะการดำเนินการ:**\n` +
                `แอดมินจะเข้ามาตรวจสอบและ **ทยอยเพิ่มยศให้ทุกคนตามลำดับ** ครับ\n` +
                `*(โปรดใจเย็นๆ ไม่จำเป็นต้องแท็กแอดมินซ้ำ หรือพิมพ์รัวๆ นะครับ แอดมินเข้ามาดูเรื่อยๆ ครับ)*`
            )
            .addFields(
                {
                    name: '🌐 เว็บหลัก Script Hub',
                    value: 'https://th.blacklisthub.workers.dev',
                    inline: true
                },
                {
                    name: '⚡ เข้าสู่ระบบ VIP ผ่านเว็บ',
                    value: 'ล็อกอิน Discord บนเว็บเพื่อรับสิทธิ์อัตโนมัติ',
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
                .setLabel('เข้าสู่ระบบ Discord บนเว็บ (ไร้โฆษณา)')
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
