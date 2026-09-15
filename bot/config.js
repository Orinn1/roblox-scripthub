const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    notifyChannelId: process.env.DISCORD_NOTIFY_CHANNEL_ID || '',
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    websiteUrl: process.env.WEBSITE_URL || 'http://localhost:3000',
    botColor: 0x5865F2, // Discord Blurple / Neon Cyan: 0x00f3ff
    themeColor: 0x00d2ff
};
