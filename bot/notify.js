const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, WebhookClient } = require('discord.js');
const botConfig = require('./config.js');

/**
 * Send an announcement embed to Discord when a new script is added
 * Supports both Webhook URL and Bot Channel ID
 * @param {Object} script - The script object
 * @param {Object} [client] - Optional discord.js client instance
 */
async function notifyNewScript(script, client = null) {
    if (!script || !script.title) return;

    try {
        const keyText = script.isKeyless ? '🟢 ไร้คีย์ (Keyless)' : '🟠 มีระบบคีย์';
        const platforms = [];
        if (script.isPC) platforms.push('💻 PC');
        if (script.isMobile) platforms.push('📱 Mobile');
        const platformText = platforms.length ? platforms.join(' | ') : 'ทุกระบบ';

        const embed = new EmbedBuilder()
            .setColor(0x00ff88) // Neon Green for new release
            .setTitle(`🚀 สคริปต์ใหม่ลงเว็บ: ${script.title}`)
            .setDescription(script.description || 'มีสคริปต์ใหม่ถูกเพิ่มลงในระบบ BlacklistScriptx!')
            .addFields(
                { name: '🎮 เกม', value: script.game || 'ทั่วไป', inline: true },
                { name: '🔑 คีย์', value: keyText, inline: true },
                { name: '📱 แพลตฟอร์ม', value: platformText, inline: true },
                { name: '🏷️ แท็ก', value: script.badge || 'มาใหม่', inline: true },
                { name: '⚙️ สถานะ', value: script.status === 'working' ? '✅ ใช้งานได้ปกติ' : '⚠️ ต้องทดสอบ', inline: true }
            )
            .setFooter({ text: '⚡ BlacklistScriptx Notification System' })
            .setTimestamp();

        if (script.thumbnail && script.thumbnail.startsWith('http')) {
            embed.setImage(script.thumbnail);
        }

        const scriptUrl = `${botConfig.websiteUrl}#script-${script.id}`;
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 ดูสคริปต์และปลดล็อคบนเว็บ')
                .setStyle(ButtonStyle.Link)
                .setURL(scriptUrl)
        );

        // 1. Try sending via Webhook if configured
        if (botConfig.webhookUrl && botConfig.webhookUrl.startsWith('http')) {
            try {
                const webhook = new WebhookClient({ url: botConfig.webhookUrl });
                await webhook.send({
                    content: '📢 **[ประกาศสคริปต์ใหม่]** สมาชิกสามารถเข้าไปรับโค้ดได้แล้วตอนนี้!',
                    embeds: [embed],
                    components: [row]
                });
                console.log(`[Discord Notify] Announced "${script.title}" via Webhook successfully.`);
                return true;
            } catch (err) {
                console.warn('[Discord Notify] Webhook send error:', err.message);
            }
        }

        // 2. Try sending via Bot Client Channel if available
        if (client && botConfig.notifyChannelId) {
            try {
                const channel = await client.channels.fetch(botConfig.notifyChannelId);
                if (channel && channel.isTextBased()) {
                    await channel.send({
                        content: '📢 **[ประกาศสคริปต์ใหม่]** สมาชิกสามารถเข้าไปรับโค้ดได้แล้วตอนนี้!',
                        embeds: [embed],
                        components: [row]
                    });
                    console.log(`[Discord Notify] Announced "${script.title}" via Bot Channel successfully.`);
                    return true;
                }
            } catch (err) {
                console.warn('[Discord Notify] Bot channel send error:', err.message);
            }
        }
    } catch (err) {
        console.error('[Discord Notify Error]:', err.message);
    }
    return false;
}

module.exports = {
    notifyNewScript
};
