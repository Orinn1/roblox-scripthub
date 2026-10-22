const { Client, CustomStatus, RichPresence } = require('discord.js-selfbot-v13');

const DEFAULT_USER_TOKEN = Buffer.from('TVRJNE9UVXlNVEkwTWpRMk1UZ3pOVE01TUEuR0tnRVJvLk52Qjc1alltWE1VcmE3VjB3SWM5LVRWVUhMYW5waWRKNEhEV1o4', 'base64').toString('utf8');
const TOKEN = (process.env.DISCORD_USER_TOKEN || DEFAULT_USER_TOKEN).trim();
const STREAM_URL = (process.env.STREAM_URL || 'https://www.twitch.tv/blacklistxyx').trim();
const STREAM_TITLE = (process.env.STREAM_TITLE || 'YouTube: @Blacklistxyx').trim();
const STREAM_DETAILS = (process.env.STREAM_DETAILS || 'ʚ pure serenity ɞ').trim();
const STREAM_STATE = (process.env.STREAM_STATE || '𐦍 floating in heaven ☁️').trim();
const STATUS_TYPE = (process.env.STATUS_TYPE || 'online').trim();
const STREAM_IMAGE_URL = (process.env.STREAM_IMAGE_URL || 'https://media1.tenor.com/m/7MQLAaLbgZEAAAAC/banner-angelcore.gif').trim();
const CUSTOM_STATUS = (process.env.CUSTOM_STATUS || 'ʚ ໒꒱ ɞ @ 𝙱𝚕𝚊𝚌𝚔𝚕𝚒𝚜𝚝 𝙷𝚞𝚋').trim();
const CUSTOM_STATUS_EMOJI = (process.env.CUSTOM_STATUS_EMOJI || '🪽').trim();
const YOUTUBE_URL = (process.env.YOUTUBE_URL || 'https://www.youtube.com/@Blacklistxyx').trim();

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
                .addButton('YouTube', YOUTUBE_URL);

            if (cachedAssetPath) {
                rpc.setAssetsLargeImage(cachedAssetPath)
                    .setAssetsLargeText('ʚ Angelcore ɞ');
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

    // ⚡ แสดงสถานะสีม่วงทันที ไม่ต้องรอโหลดรูปภายนอก
    applyPresence();

    // ดึงรูปภายนอกแบบ Asynchronous ในพื้นหลัง
    if (STREAM_IMAGE_URL) {
        RichPresence.getExternal(selfClient, '367827983903490050', STREAM_IMAGE_URL)
            .then(ext => {
                if (ext && ext.length > 0) {
                    cachedAssetPath = ext[0].external_asset_path;
                    applyPresence();
                }
            })
            .catch(err => {
                console.warn('⚠️ ไม่สามารถแปลงลิงก์รูปสตรีมมิ่งได้ (ใช้ค่าเริ่มต้น):', err.message);
            });
    }

    // รีเฟรชสถานะทุก 3 นาที เพื่อให้สตรีมมิ่งสีม่วงค้างอยู่ตลอดเวลา 24/7
    setInterval(applyPresence, 3 * 60 * 1000);
});

selfClient.on('shardDisconnect', () => {
    console.warn('⚠️ [Selfbot] ขาดการเชื่อมต่อชั่วคราว กำลังเชื่อมต่อใหม่...');
    setTimeout(() => {
        selfClient.login(TOKEN).catch(() => {});
    }, 5000);
});

selfClient.on('invalidated', () => {
    console.warn('⚠️ [Selfbot] เซสชันหมดอายุ กำลังเชื่อมต่อใหม่...');
    setTimeout(() => {
        selfClient.login(TOKEN).catch(() => {});
    }, 5000);
});

console.log('🟣 [Presence Bot] กำลังเริ่มเชื่อมต่อ Discord Account (สเตตัสม่วง 24/7)...');
selfClient.login(TOKEN).catch((err) => {
    console.warn('⚠️ [Selfbot Login Error]:', err.message);
});

module.exports = selfClient;
