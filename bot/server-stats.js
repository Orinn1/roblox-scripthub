const fs = require('fs');
const path = require('path');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const botConfig = require('./config.js');

const STATS_DATA_PATH = path.join(__dirname, '..', 'data', 'server-stats.json');
const DEFAULT_SPAM_BASELINE = 0; // Starts from 0 real blocks
const UPDATE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (Discord limit: max 2 edits per 10m)

let cachedStats = {
    spamBlocked: DEFAULT_SPAM_BASELINE,
    lastKnownYouTubeSubs: '2.19K',
    channelIds: {
        categoryId: '',
        membersChannelId: '',
        youtubeChannelId: '',
        spamChannelId: ''
    },
    lastUpdated: 0
};

// 1. Load persisted stats data
function loadStatsData() {
    try {
        if (fs.existsSync(STATS_DATA_PATH)) {
            const raw = fs.readFileSync(STATS_DATA_PATH, 'utf8');
            const data = JSON.parse(raw);
            cachedStats = {
                ...cachedStats,
                ...data,
                spamBlocked: typeof data.spamBlocked === 'number' ? data.spamBlocked : DEFAULT_SPAM_BASELINE,
                channelIds: {
                    ...cachedStats.channelIds,
                    ...(data.channelIds || {})
                }
            };
        }
    } catch (err) {
        console.warn('⚠️ [Server Stats] Failed to read server-stats.json:', err.message);
    }
}

// 2. Save stats data
function saveStatsData() {
    try {
        const dir = path.dirname(STATS_DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATS_DATA_PATH, JSON.stringify(cachedStats, null, 2), 'utf8');
    } catch (err) {
        console.warn('⚠️ [Server Stats] Failed to save server-stats.json:', err.message);
    }
}

// 3. Helper to format subscriber count string
function formatSubscriberCount(raw) {
    if (!raw) return '2.19K';
    let clean = String(raw).trim();
    clean = clean.replace(/ผู้ติดตาม|subscribers?|subs?|คน/gi, '').trim();
    clean = clean.replace(/พัน/g, 'K').replace(/หมื่น/g, '0K').replace(/แสน/g, '00K').replace(/ล้าน/g, 'M').trim();
    clean = clean.replace(/\s+/g, '');
    return clean || '2.19K';
}

// 4. Fetch YouTube subscriber count
async function fetchYouTubeSubscribers() {
    const handle = '@itzkroz';
    const urls = [
        `https://www.youtube.com/${handle}`,
        `https://www.youtube.com/channel/${botConfig.youtubeChannelId || 'UCOAGxYeICyBbSjxJkul3HXA'}`
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9,th;q=0.8'
                },
                signal: AbortSignal.timeout(8000)
            });

            if (!res.ok) continue;
            const html = await res.text();

            const regexes = [
                /["']subscriberCountText["']\s*:\s*\{[^}]*?["']simpleText["']\s*:\s*["']([^"']+)["']/i,
                /["']subscriberCountText["']\s*:\s*\{[^}]*?["']label["']\s*:\s*["']([^"']+)["']/i,
                /ผู้ติดตาม\s*([\d.,]+(?:\s*[ก-๙a-zA-Z]+)?)/i,
                /([\d.,]+(?:\s*[KMkmก-๙]+)?)\s*subscribers/i
            ];

            for (const r of regexes) {
                const match = html.match(r);
                if (match && match[1]) {
                    const formatted = formatSubscriberCount(match[1]);
                    if (formatted) {
                        cachedStats.lastKnownYouTubeSubs = formatted;
                        return formatted;
                    }
                }
            }
        } catch (e) {}
    }

    return cachedStats.lastKnownYouTubeSubs || '2.19K';
}

// 5. Increment Spam Blocked count
function incrementSpamBlocked() {
    cachedStats.spamBlocked = (cachedStats.spamBlocked || 0) + 1;
    saveStatsData();
    console.log(`🛡️ [Server Stats] Spam Blocked count incremented to: ${cachedStats.spamBlocked.toLocaleString('en-US')}`);
}

// 6. Find or create stats category and channels (WITH AUTOMATIC DEDUPLICATION)
async function getOrCreateStatsChannels(guild) {
    if (!guild) return null;

    const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
    if (!me || !me.permissions.has(PermissionFlagsBits.ManageChannels)) {
        console.warn('⚠️ [Server Stats] Bot lacks ManageChannels permission.');
        return null;
    }

    // Force fetch all guild channels to ensure cache is 100% complete
    await guild.channels.fetch().catch(() => {});

    // A. Find or create Category: "--- SERVER STATS ---"
    let category = null;
    const catId = botConfig.statsCategoryId || cachedStats.channelIds.categoryId;
    if (catId) {
        category = guild.channels.cache.get(catId);
    }

    // Search all categories matching "--- SERVER STATS ---"
    const matchingCategories = guild.channels.cache.filter(c => 
        c.type === ChannelType.GuildCategory && 
        c.name.trim().toUpperCase() === '--- SERVER STATS ---'
    );

    if (matchingCategories.size > 0) {
        const catArray = Array.from(matchingCategories.values());
        if (!category) {
            category = catArray[0];
        }
        // Auto-delete duplicate categories if any
        for (const extraCat of catArray) {
            if (extraCat.id !== category.id) {
                console.log(`🧹 [Server Stats] Deleting duplicate category: ${extraCat.name} (${extraCat.id})`);
                await extraCat.delete('Delete duplicate stats category').catch(() => {});
            }
        }
    }

    if (!category) {
        category = await guild.channels.create({
            name: '--- SERVER STATS ---',
            type: ChannelType.GuildCategory,
            position: 0,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.Connect]
                }
            ]
        }).catch(err => {
            console.error('❌ [Server Stats] Failed to create category:', err.message);
            return null;
        });
    }

    if (!category) return null;
    cachedStats.channelIds.categoryId = category.id;

    // Helper to find, create, and DEDUPLICATE voice stat channel
    async function ensureVoiceStatChannel(savedIdKey, configOverrideKey, prefix, initialName, position) {
        const savedId = botConfig[configOverrideKey] || cachedStats.channelIds[savedIdKey];
        let channel = null;

        if (savedId) {
            channel = guild.channels.cache.get(savedId);
        }

        // Find ALL voice channels under this category matching prefix
        const matchingChannels = guild.channels.cache.filter(c =>
            c.parentId === category.id &&
            c.type === ChannelType.GuildVoice &&
            c.name.toLowerCase().startsWith(prefix.toLowerCase())
        );

        if (matchingChannels.size > 0) {
            const arr = Array.from(matchingChannels.values());
            if (!channel) {
                channel = arr[0];
            }
            // Auto-clean: DELETE all extra duplicate channels!
            for (const ch of arr) {
                if (ch.id !== channel.id) {
                    console.log(`🧹 [Server Stats] Deleting duplicate stat channel: ${ch.name} (${ch.id})`);
                    await ch.delete('Auto-clean duplicate stats channel').catch(() => {});
                }
            }
        }

        if (!channel) {
            channel = await guild.channels.create({
                name: initialName,
                type: ChannelType.GuildVoice,
                parent: category.id,
                position: position,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.Connect]
                    },
                    {
                        id: me.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.Connect
                        ]
                    }
                ]
            }).catch(err => {
                console.error(`❌ [Server Stats] Failed to create channel ${initialName}:`, err.message);
                return null;
            });
        } else if (channel.parentId !== category.id) {
            await channel.setParent(category.id, { lockPermissions: false }).catch(() => {});
        }

        if (channel) {
            cachedStats.channelIds[savedIdKey] = channel.id;
        }
        return channel;
    }

    const membersCh = await ensureVoiceStatChannel('membersChannelId', 'statsMembersChannelId', 'Members:', `Members: ${(guild.memberCount || 0).toLocaleString('en-US')}`, 1);
    const youtubeCh = await ensureVoiceStatChannel('youtubeChannelId', 'statsYoutubeChannelId', 'YouTube:', `YouTube: ${cachedStats.lastKnownYouTubeSubs || '2.19K'}`, 2);
    const spamCh = await ensureVoiceStatChannel('spamChannelId', 'statsSpamChannelId', 'Spam Blocked:', `Spam Blocked: ${(cachedStats.spamBlocked || 0).toLocaleString('en-US')}`, 3);

    saveStatsData();
    return { category, membersCh, youtubeCh, spamCh };
}

// 7. Update stats channel names (Respects rate limits)
async function updateServerStats(client) {
    try {
        const guildId = botConfig.guildId || '1548669247998140438';
        const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            console.warn(`⚠️ [Server Stats] Guild ${guildId} not found.`);
            return;
        }

        const channels = await getOrCreateStatsChannels(guild);
        if (!channels) return;

        const { membersCh, youtubeCh, spamCh } = channels;

        // 1. Members
        const memberCount = guild.memberCount || 0;
        const targetMembersName = `Members: ${memberCount.toLocaleString('en-US')}`;
        if (membersCh && membersCh.name !== targetMembersName) {
            await membersCh.setName(targetMembersName).catch(err => {
                console.warn('[Server Stats] Members channel rename rate limited or failed:', err.message);
            });
        }

        // 2. YouTube
        const ytSubs = await fetchYouTubeSubscribers();
        const targetYtName = `YouTube: ${ytSubs}`;
        if (youtubeCh && youtubeCh.name !== targetYtName) {
            await youtubeCh.setName(targetYtName).catch(err => {
                console.warn('[Server Stats] YouTube channel rename rate limited or failed:', err.message);
            });
        }

        // 3. Spam Blocked
        const targetSpamName = `Spam Blocked: ${(cachedStats.spamBlocked || 0).toLocaleString('en-US')}`;
        if (spamCh && spamCh.name !== targetSpamName) {
            await spamCh.setName(targetSpamName).catch(err => {
                console.warn('[Server Stats] Spam channel rename rate limited or failed:', err.message);
            });
        }

        cachedStats.lastUpdated = Date.now();
        saveStatsData();
    } catch (err) {
        console.error('❌ [Server Stats Error]:', err.message);
    }
}

// 8. Main Initialization function
function startServerStats(client) {
    loadStatsData();
    console.log('📊 [Server Stats] Initializing English live server stats counters...');

    // Run first update after short delay to let client cache settle
    setTimeout(() => {
        updateServerStats(client);
    }, 5000);

    // Schedule regular updates every 10 minutes (Discord channel rename safe limit)
    setInterval(() => {
        updateServerStats(client);
    }, UPDATE_INTERVAL_MS);
}

module.exports = {
    startServerStats,
    updateServerStats,
    incrementSpamBlocked
};
