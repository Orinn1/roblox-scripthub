const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const botConfig = require('./config.js');
let db = null;
try { db = require('../db.js'); } catch (e) { }

const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${botConfig.youtubeChannelId || 'UCOAGxYeICyBbSjxJkul3HXA'}`;
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute

// In-memory set of already notified video IDs (prevents duplicate spam even across CDN flips)
const notifiedVideoIds = new Set();
let isInitialized = false;

// Load persisted notified IDs from database / config
try {
    const currentConfig = db && db.getConfig ? db.getConfig() : {};
    const saved = currentConfig.notified_youtube_video_ids;
    if (Array.isArray(saved)) {
        saved.forEach(id => notifiedVideoIds.add(id));
    }
} catch (e) { }

function persistNotifiedIds() {
    try {
        if (db && db.saveConfig) {
            db.saveConfig({
                notified_youtube_video_ids: Array.from(notifiedVideoIds).slice(-50) // keep last 50
            });
        }
    } catch (e) { }
}

/**
 * Fetch recent videos from YouTube RSS Feed
 */
async function fetchRecentVideos() {
    try {
        const resp = await fetch(YOUTUBE_RSS_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: AbortSignal.timeout(8000)
        });

        if (!resp.ok) return [];
        const xml = await resp.text();

        const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        const videos = [];

        for (const entry of entries) {
            const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
            const titleMatch = entry.match(/<title>(.*?)<\/title>/);
            const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
            const authorMatch = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>/);

            if (videoIdMatch && titleMatch) {
                const videoId = videoIdMatch[1].trim();
                const title = titleMatch[1].trim()
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");

                videos.push({
                    videoId,
                    title,
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    author: authorMatch ? authorMatch[1].trim() : 'BlacklistScriptx',
                    published: publishedMatch ? publishedMatch[1].trim() : new Date().toISOString()
                });
            }
        }
        return videos;
    } catch (e) {
        console.error('[YouTube Monitor Error]:', e.message);
        return [];
    }
}

/**
 * Fetch latest single video (for testing)
 */
async function fetchLatestVideo() {
    const videos = await fetchRecentVideos();
    return videos.length > 0 ? videos[0] : null;
}

/**
 * Send Discord Notification for a video
 */
async function sendVideoNotification(client, video, isTest = false) {
    if (!client || !video) return false;

    const channelId = botConfig.youtubeNotifyChannelId || '1549408423068573807';
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            console.warn(`[YouTube Monitor] ไม่พบห้องแจ้งเตือน ID: ${channelId} หรือบอทไม่มีสิทธิ์เข้าถึง`);
            return false;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000) // YouTube Red
            .setAuthor({
                name: `${video.author} (อัปโหลดคลิปใหม่บน YouTube)`,
                iconURL: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
            })
            .setTitle(`🎬 ${video.title}`)
            .setURL(video.url)
            .setDescription(`มีคลิปใหม่จากช่อง **${video.author}** เพิ่งลงสดๆ ร้อนๆ สมาชิกทุกคนสามารถกดรับชมและกดไลค์ได้เลยครับ! ⚡`)
            .setImage(video.thumbnail)
            .setFooter({ text: 'BlacklistScriptx YouTube Notification System' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('▶️ รับชมคลิปบน YouTube')
                .setStyle(ButtonStyle.Link)
                .setURL(video.url),
            new ButtonBuilder()
                .setLabel('🌐 เข้าสู่เว็บไซต์หลัก')
                .setStyle(ButtonStyle.Link)
                .setURL(botConfig.websiteUrl)
        );

        const mentionText = isTest
            ? '🧪 **[ทดสอบระบบแจ้งเตือน YouTube]** บอทเชื่อมต่อห้องนี้สำเร็จเรียบร้อย!'
            : '📢 **[ประกาศคลิปใหม่]** มีคลิปใหม่ลงแล้ว อย่าลืมกดไลค์และกดติดตาม! ⚡';

        await channel.send({
            content: mentionText,
            embeds: [embed],
            components: [row]
        });

        console.log(`[YouTube Monitor] ส่งแจ้งเตือนคลิป "${video.title}" ไปที่ห้อง ${channelId} สำเร็จ`);
        return true;
    } catch (err) {
        console.error('[YouTube Monitor Send Error]:', err.message);
        return false;
    }
}

/**
 * Initialize background monitor loop
 */
function startYouTubeMonitor(client) {
    if (!client) return;

    let isChecking = false;

    async function checkNow() {
        if (isChecking) return;
        isChecking = true;

        try {
            const videos = await fetchRecentVideos();
            if (!videos || videos.length === 0) {
                isChecking = false;
                return;
            }

            // On first startup: seed existing videos so we never spam past videos
            if (!isInitialized && notifiedVideoIds.size === 0) {
                videos.forEach(v => notifiedVideoIds.add(v.videoId));
                persistNotifiedIds();
                isInitialized = true;
                console.log(`[YouTube Monitor] บันทึกคลิปเริ่มต้นที่มีอยู่แล้ว ${notifiedVideoIds.size} คลิป (ป้องกันการส่งซ้ำ)`);
                isChecking = false;
                return;
            }

            isInitialized = true;

            // Check if any video has NOT been notified yet
            for (const video of videos) {
                if (!notifiedVideoIds.has(video.videoId)) {
                    // Mark as notified immediately in memory before sending to prevent race conditions
                    notifiedVideoIds.add(video.videoId);
                    persistNotifiedIds();

                    console.log(`[YouTube Monitor] 🚀 พบคลิปใหม่ที่ยังไม่เคยแจ้งเตือน: [${video.videoId}] "${video.title}"`);
                    await sendVideoNotification(client, video);
                    break; // notify at most 1 per cycle
                }
            }
        } catch (e) {
            console.error('[YouTube Monitor Loop Error]:', e);
        } finally {
            isChecking = false;
        }
    }

    // Run first check after 10 seconds, then every 1 minute
    setTimeout(checkNow, 10000);
    setInterval(checkNow, CHECK_INTERVAL_MS);
    console.log(`📺 [YouTube Monitor] เริ่มระบบเฝ้าติดตามช่อง YouTube (ห้องแจ้งเตือน: ${botConfig.youtubeNotifyChannelId || '1549408423068573807'})`);
}

module.exports = {
    startYouTubeMonitor,
    fetchRecentVideos,
    fetchLatestVideo,
    sendVideoNotification
};
