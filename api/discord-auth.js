const { VIP_ROLE_ID, generateVipToken } = require('../bot/vip-helper.js');
const botConfig = require('../bot/config.js');

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || botConfig.clientId || '1549395921228271686';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || botConfig.guildId || '1548669247998140438';
const BOT_TOKEN = process.env.DISCORD_TOKEN || botConfig.token || '';

module.exports = async function handler(req, res) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'blacklistscripty.vercel.app';
    const baseUrl = `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/discord-auth`;

    const action = req.query?.action || '';
    const code = req.query?.code || '';

    // 1. Step 1: Redirect user to Discord OAuth2 Authorization Page
    if (action === 'login' || (!code && !action)) {
        if (!CLIENT_ID) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h3>ข้อผิดพลาด: ไม่พบ DISCORD_CLIENT_ID</h3>');
            return;
        }

        const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify`;
        res.writeHead(302, { Location: discordAuthUrl });
        res.end();
        return;
    }

    // 2. Step 2: Handle OAuth2 Callback with ?code=...
    if (code) {
        if (!CLIENT_SECRET) {
            // If Client Secret is not set in environment, redirect to site with helpful message
            res.writeHead(302, { Location: `${baseUrl}/?vip_error=missing_secret` });
            res.end();
            return;
        }

        try {
            // Exchange authorization code for access token
            const tokenParams = new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            });

            const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams.toString()
            });

            if (!tokenRes.ok) {
                const errText = await tokenRes.text();
                console.error('[Discord Auth] Token exchange failed:', errText);
                res.writeHead(302, { Location: `${baseUrl}/?vip_error=token_exchange_failed` });
                res.end();
                return;
            }

            const tokenData = await tokenRes.json();
            const accessToken = tokenData.access_token;

            // Fetch user info from Discord
            const userRes = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!userRes.ok) {
                res.writeHead(302, { Location: `${baseUrl}/?vip_error=user_fetch_failed` });
                res.end();
                return;
            }

            const userData = await userRes.json();
            const userId = userData.id;
            const username = userData.global_name || userData.username || 'Discord User';

            // Check guild member roles using Bot Token
            const requiredRole = process.env.DISCORD_REQUIRED_ROLE_ID || VIP_ROLE_ID;
            let isVip = false;

            if (BOT_TOKEN && GUILD_ID) {
                const memberRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
                    headers: { Authorization: `Bot ${BOT_TOKEN}` }
                });

                if (memberRes.ok) {
                    const memberData = await memberRes.json();
                    const roles = memberData.roles || [];
                    isVip = roles.includes(requiredRole);
                } else {
                    console.warn(`[Discord Auth] Member ${userId} not found in guild ${GUILD_ID}`);
                }
            }

            if (!isVip) {
                res.writeHead(302, { Location: `${baseUrl}/?vip_error=not_vip&user=${encodeURIComponent(username)}` });
                res.end();
                return;
            }

            // User has the VIP role! Generate signed token
            const vipToken = generateVipToken({
                userId,
                username,
                roleId: requiredRole,
                durationDays: 30
            });

            res.writeHead(302, { Location: `${baseUrl}/?vip_token=${encodeURIComponent(vipToken)}&auth_success=1` });
            res.end();
        } catch (err) {
            console.error('[Discord Auth Error]:', err);
            res.writeHead(302, { Location: `${baseUrl}/?vip_error=${encodeURIComponent(err.message)}` });
            res.end();
        }
        return;
    }

    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid request parameters');
};
