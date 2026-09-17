const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    notifyChannelId: process.env.DISCORD_NOTIFY_CHANNEL_ID || '',
    youtubeNotifyChannelId: process.env.DISCORD_YT_NOTIFY_CHANNEL_ID || '1549408423068573807',
    youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID || 'UCOAGxYeICyBbSjxJkul3HXA',
    robloxAlertChannelId: process.env.ROBLOX_ALERT_CHANNEL_ID || '1549456641379012709',
    stockAlertChannelId: process.env.DISCORD_STOCK_ALERT_CHANNEL_ID || process.env.DISCORD_STOCK_CHANNEL_ID || '1549774966474674259',
    stockLiveChannelId: process.env.DISCORD_STOCK_LIVE_CHANNEL_ID || process.env.DISCORD_STOCK_CHANNEL_ID || '1549774966474674259',
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    websiteUrl: process.env.WEBSITE_URL || 'https://blacklistscripty.vercel.app',
    botColor: 0x5865F2, // Discord Blurple / Neon Cyan: 0x00f3ff
    themeColor: 0x00d2ff,
    requiredRoleId: process.env.DISCORD_REQUIRED_ROLE_ID || '1549727990542508083',
    bypassChannelId: process.env.DISCORD_BYPASS_CHANNEL_ID || '1549758071734140958'
};
