const { Client, CustomStatus, RichPresence } = require('discord.js-selfbot-v13');

const TOKEN = (process.env.DISCORD_USER_TOKEN || '').trim();
const STREAM_URL = (process.env.STREAM_URL || 'https://www.twitch.tv/blacklistxyx').trim();
const STREAM_TITLE = (process.env.STREAM_TITLE || 'BlacklistScriptX ⚡ | YouTube & Roblox').trim();
const STREAM_DETAILS = (process.env.STREAM_DETAILS || 'YouTube: @Blacklistxyx').trim();
const STREAM_STATE = (process.env.STREAM_STATE || 'IG: @p1ix0_').trim();
const STATUS_TYPE = (process.env.STATUS_TYPE || 'online').trim();
const STREAM_IMAGE_URL = (process.env.STREAM_IMAGE_URL || 'https://media1.tenor.com/m/7x7K6hqJY6UAAAAC/umamusume-satono-diamond.gif').trim();
const CUSTOM_STATUS = (process.env.CUSTOM_STATUS || '@ 𝙱𝚕𝚊𝚌𝚔𝚕𝚒𝚜𝚝 𝙷𝚞𝚋').trim();
const CUSTOM_STATUS_EMOJI = (process.env.CUSTOM_STATUS_EMOJI || '').trim();
const YOUTUBE_URL = (process.env.YOUTUBE_URL || 'https://www.youtube.com/@Blacklistxyx').trim();
const INSTAGRAM_URL = (process.env.INSTAGRAM_URL || 'https://www.instagram.com/p1ix0_/').trim();

if (!TOKEN) {
    console.log('ℹ️ [Presence Stream] ไม่พบ DISCORD_USER_TOKEN ข้ามการรันระบบสตรีมมิ่งบัญชีส่วนตัว');
    return;
}

const selfClient = new Client({
    checkUpdate: false
});

selfClient.on('error', (err) => {
    console.warn('⚠️ [Selfbot Presence Error]:', err.message);
});

selfClient.on('ready', async () => {
    console.log('====================================================');
    console.log(`🟣 [Presence Bot] ออนไลน์ 24/7 สำเร็จในชื่อ: ${selfClient.user.tag}`);
    console.log(`🆔 User ID: ${selfClient.user.id}`);
    console.log(`💬 สถานะโปรไฟล์: ${CUSTOM_STATUS}`);
    console.log(`🎮 ชื่อสตรีม: ${STREAM_TITLE}`);
    console.log(`🔗 ลิงก์สตรีม: ${STREAM_URL}`);
    console.log(`📸 ดีเทล: ${STREAM_DETAILS} | ${STREAM_STATE}`);
    console.log(`🖼️ รูปสตรีม GIF: ${STREAM_IMAGE_URL}`);
    console.log('====================================================');

    let cachedAssetPath = null;
    if (STREAM_IMAGE_URL) {
        try {
            const ext = await RichPresence.getExternal(selfClient, '367827983903490050', STREAM_IMAGE_URL);
            if (ext && ext.length > 0) {
                cachedAssetPath = ext[0].external_asset_path;
            }
        } catch (err) {
            console.warn('⚠️ ไม่สามารถแปลงลิงก์รูปสตรีมมิ่งได้:', err.message);
        }
    }

    function applyPresence() {
        try {
            const customStatus = new CustomStatus(selfClient)
                .setState(CUSTOM_STATUS);

            if (CUSTOM_STATUS_EMOJI) {
                customStatus.setEmoji(CUSTOM_STATUS_EMOJI);
            }

            const rpc = new RichPresence(selfClient)
                .setApplicationId('367827983903490050')
                .setType('STREAMING')
                .setURL(STREAM_URL)
                .setName(STREAM_TITLE)
                .setDetails(STREAM_DETAILS)
                .setState(STREAM_STATE)
                .setStartTimestamp(Date.now())
                .addButton('YouTube', YOUTUBE_URL)
                .addButton('Instagram', INSTAGRAM_URL);

            if (cachedAssetPath) {
                rpc.setAssetsLargeImage(cachedAssetPath)
                    .setAssetsLargeText('Satono Diamond');
            }

            selfClient.user.setPresence({
                status: STATUS_TYPE,
                activities: [rpc, customStatus]
            });
            console.log(`[${new Date().toLocaleTimeString()}] 🟣 รักษาสถานะสตรีมมิ่งสีม่วง 24/7 สำเร็จ`);
        } catch (err) {
            console.error('⚠️ [Presence Error]:', err.message);
        }
    }

    applyPresence();
    // รีเฟรชสถานะทุก 10 นาทีเพื่อให้สตรีมค้างอยู่ตลอดเวลา
    setInterval(applyPresence, 10 * 60 * 1000);
});

selfClient.on('disconnect', () => {
    console.warn('⚠️ [Selfbot] หลุดการเชื่อมต่อ กำลังเชื่อมต่อใหม่ใน 5 วินาที...');
    setTimeout(() => {
        selfClient.login(TOKEN).catch(() => {});
    }, 5000);
});

selfClient.login(TOKEN).catch((err) => {
    console.warn('⚠️ [Selfbot Login Error]:', err.message);
});

module.exports = selfClient;
