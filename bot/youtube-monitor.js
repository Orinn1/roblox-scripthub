const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const botConfig = require('./config.js');
let db = null;
try { db = require('../db.js'); } catch (e) {}

const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${botConfig.youtubeChannelId || 'UCOAGxYeICyBbSjxJkul3HXA'}`;
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // Check every 2 minutes

/**
 * Fetch latest video data from YouTube RSS Feed
 */
async function fetchLatestVideo() {
    try {
        const resp = await fetch(YOUTUBE_RSS_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: AbortSignal.timeout(8000)
        });

        if (!resp.ok) return null;
        const xml = await resp.text();

        const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
        if (!entryMatch) return null;

        const entry = entryMatch[1];
        const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const authorMatch = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>/);

        if (!videoIdMatch || !titleMatch) return null;

        const videoId = videoIdMatch[1].trim();
        const title = titleMatch[1].trim()
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        return {
            videoId,
            title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            author: authorMatch ? authorMatch[1].trim() : 'BlacklistScriptx',
            published: publishedMatch ? publishedMatch[1].trim() : new Date().toISOString()
        };
    } catch (e) {
        console.error('[YouTube Monitor Error]:', e.message);
        return null;
    }
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
            : '📢 **[ประกาศคลิปใหม่]** @everyone มีคลิปใหม่ลงแล้ว อย่าลืมกดไลค์และกดติดตาม!';

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
            const video = await fetchLatestVideo();
            if (!video) {
                isChecking = false;
                return;
            }

            const currentConfig = db && db.getConfig ? db.getConfig() : {};
            const lastVideoId = currentConfig.last_youtube_video_id || '';

            if (!lastVideoId) {
                // First time running: save the latest video ID so we don't spam past videos
                console.log(`[YouTube Monitor] บันทึกคลิปล่าสุดเริ่มต้น: [${video.videoId}] "${video.title}"`);
                if (db && db.saveConfig) {
                    db.saveConfig({ last_youtube_video_id: video.videoId });
                }
            } else if (lastVideoId !== video.videoId) {
                // New video detected!
                console.log(`[YouTube Monitor] 🚀 พบคลิปใหม่! [${video.videoId}] "${video.title}"`);
                const sent = await sendVideoNotification(client, video);
                if (sent && db && db.saveConfig) {
                    db.saveConfig({ last_youtube_video_id: video.videoId });
                }
            }
        } catch (e) {
            console.error('[YouTube Monitor Loop Error]:', e);
        } finally {
            isChecking = false;
        }
    }

    // Run first check after 10 seconds, then every 2 minutes
    setTimeout(checkNow, 10000);
    setInterval(checkNow, CHECK_INTERVAL_MS);
    console.log(`📺 [YouTube Monitor] เริ่มระบบเฝ้าติดตามช่อง YouTube (ห้องแจ้งเตือน: ${botConfig.youtubeNotifyChannelId || '1549408423068573807'})`);
}

module.exports = {
    startYouTubeMonitor,
    fetchLatestVideo,
    sendVideoNotification
};
