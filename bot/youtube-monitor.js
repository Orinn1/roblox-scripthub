const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const botConfig = require('./config.js');

let db = null;
try { db = require('../db.js'); } catch (e) { }

const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${botConfig.youtubeChannelId || 'UCOAGxYeICyBbSjxJkul3HXA'}`;
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute
const CACHE_FILE_PATH = path.join(__dirname, '..', 'data', 'youtube-cache.json');

// In-memory set of already notified video IDs
const notifiedVideoIds = new Set();
let lastNotifiedPublishedTime = 0;
let isInitialized = false;
let isChecking = false;

/**
 * 1. Load initial cache from multiple persistent sources
 * (Dedicated cache file, SQLite config table, and config.json)
 */
function loadInitialCache() {
    // A. Dedicated youtube-cache.json
    try {
        if (fs.existsSync(CACHE_FILE_PATH)) {
            const raw = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
            if (Array.isArray(raw.notifiedIds)) {
                raw.notifiedIds.forEach(id => {
                    if (id) notifiedVideoIds.add(String(id).trim());
                });
            }
            if (raw.lastNotifiedPublishedTime) {
                lastNotifiedPublishedTime = Math.max(lastNotifiedPublishedTime, Number(raw.lastNotifiedPublishedTime) || 0);
            }
        }
    } catch (e) { }

    // B. SQLite DB config
    try {
        const currentConfig = db && db.getConfig ? db.getConfig() : {};
        if (Array.isArray(currentConfig.notified_youtube_video_ids)) {
            currentConfig.notified_youtube_video_ids.forEach(id => {
                if (id) notifiedVideoIds.add(String(id).trim());
            });
        }
        if (currentConfig.youtube_last_published_time) {
            lastNotifiedPublishedTime = Math.max(lastNotifiedPublishedTime, Number(currentConfig.youtube_last_published_time) || 0);
        }
    } catch (e) { }

    // C. data/config.json fallback
    try {
        const cfgJsonPath = path.join(__dirname, '..', 'data', 'config.json');
        if (fs.existsSync(cfgJsonPath)) {
            const cfg = JSON.parse(fs.readFileSync(cfgJsonPath, 'utf8'));
            if (Array.isArray(cfg.notified_youtube_video_ids)) {
                cfg.notified_youtube_video_ids.forEach(id => {
                    if (id) notifiedVideoIds.add(String(id).trim());
                });
            }
        }
    } catch (e) { }
}

loadInitialCache();

/**
 * 2. Persist notified IDs & latest published timestamp to all storage targets
 */
function persistNotifiedIds() {
    const idsArray = Array.from(notifiedVideoIds).slice(-100); // keep last 100

    // Save to dedicated youtube-cache.json
    try {
        const cacheDir = path.dirname(CACHE_FILE_PATH);
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify({
            lastNotifiedPublishedTime,
            notifiedIds: idsArray,
            updatedAt: new Date().toISOString()
        }, null, 2), 'utf8');
    } catch (e) { }

    // Save to SQLite DB & backup config.json
    try {
        if (db && db.saveConfig) {
            db.saveConfig({
                notified_youtube_video_ids: idsArray,
                youtube_last_published_time: lastNotifiedPublishedTime
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

    async function checkNow() {
        if (isChecking) return;
        isChecking = true;

        try {
            const videos = await fetchRecentVideos();
            if (!videos || videos.length === 0) {
                return;
            }

            // --- STEP 1: FIRST STARTUP SEEDING (CRITICAL FIX) ---
            // On the very first check cycle of this process run:
            // ALWAYS seed ALL current videos in the RSS feed into notifiedVideoIds.
            // This guarantees that ANY restart, reboot, or redeployment will NEVER
            // blast Discord with existing/past videos!
            if (!isInitialized) {
                let newlySeeded = 0;
                let maxPubTime = lastNotifiedPublishedTime;

                for (const v of videos) {
                    if (!notifiedVideoIds.has(v.videoId)) {
                        notifiedVideoIds.add(v.videoId);
                        newlySeeded++;
                    }
                    const pTime = new Date(v.published).getTime();
                    if (!isNaN(pTime) && pTime > maxPubTime) {
                        maxPubTime = pTime;
                    }
                }

                lastNotifiedPublishedTime = maxPubTime;
                persistNotifiedIds();
                isInitialized = true;
                console.log(`[YouTube Monitor] ซิงค์คลิปเริ่มต้น ${videos.length} คลิปเรียบร้อยแล้ว (${newlySeeded} คลิปถูกบันทึกลงระบบเพื่อป้องกันการส่งซ้ำ)`);
                return;
            }

            // --- STEP 2: SUBSEQUENT RUNS (DETECT GENUINELY NEW VIDEOS) ---
            const now = Date.now();

            for (const video of videos) {
                // 1. If already known, skip immediately
                if (notifiedVideoIds.has(video.videoId)) {
                    continue;
                }

                const publishedTime = new Date(video.published).getTime();
                const ageHours = (now - publishedTime) / (1000 * 60 * 60);

                // 2. Safety Check: If older than 24 hours or older than our latest known published timestamp,
                // it is an existing clip, not a newly uploaded video. Mark as known without notifying.
                if (isNaN(publishedTime) || ageHours > 24 || (lastNotifiedPublishedTime > 0 && publishedTime <= lastNotifiedPublishedTime)) {
                    notifiedVideoIds.add(video.videoId);
                    persistNotifiedIds();
                    continue;
                }

                // 3. Genuinely NEW video uploaded while the bot was running!
                notifiedVideoIds.add(video.videoId);
                lastNotifiedPublishedTime = Math.max(lastNotifiedPublishedTime, publishedTime);
                persistNotifiedIds();

                console.log(`[YouTube Monitor] 🚀 พบคลิปใหม่ที่เพิ่งลงสดๆ: [${video.videoId}] "${video.title}"`);
                await sendVideoNotification(client, video);
                break; // Notify at most 1 clip per check cycle
            }
        } catch (e) {
            console.error('[YouTube Monitor Loop Error]:', e);
        } finally {
            isChecking = false;
        }
    }

    // Run first baseline check after 5 seconds, then every 1 minute
    setTimeout(checkNow, 5000);
    setInterval(checkNow, CHECK_INTERVAL_MS);
    console.log(`📺 [YouTube Monitor] เริ่มระบบเฝ้าติดตามช่อง YouTube (ห้องแจ้งเตือน: ${botConfig.youtubeNotifyChannelId || '1549408423068573807'})`);
}

module.exports = {
    startYouTubeMonitor,
    fetchRecentVideos,
    fetchLatestVideo,
    sendVideoNotification
};
