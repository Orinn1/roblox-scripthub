const { VIP_ROLE_ID, generateVipToken } = require('../lib/vip-helper.js');

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1549395921228271686';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '_0r2E975KMdK9PRXYIiYat7ONK7xkIg3';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1548669247998140438';
const BOT_TOKEN = process.env.DISCORD_TOKEN || '';

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

        const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify%20guilds.members.read`;
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
            const avatarUrl = userData.avatar
                ? `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png`
                : '';

            // Check guild member roles (Role 1549727990542508083)
            const requiredRole = process.env.DISCORD_REQUIRED_ROLE_ID || VIP_ROLE_ID;
            let isVip = false;

            // Method 1: Check member roles via user's access token (guilds.members.read scope)
            if (GUILD_ID) {
                const userMemberRes = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }).catch(() => null);

                if (userMemberRes && userMemberRes.ok) {
                    const memberData = await userMemberRes.json();
                    const roles = memberData.roles || [];
                    isVip = roles.includes(requiredRole);
                }
            }

            // Method 2: Fallback check via Bot token
            if (!isVip && BOT_TOKEN && GUILD_ID) {
                const botMemberRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
                    headers: { Authorization: `Bot ${BOT_TOKEN}` }
                }).catch(() => null);

                if (botMemberRes && botMemberRes.ok) {
                    const memberData = await botMemberRes.json();
                    const roles = memberData.roles || [];
                    isVip = roles.includes(requiredRole);
                }
            }

            if (!isVip) {
                res.writeHead(302, { Location: `${baseUrl}/?vip_error=no_role&user=${encodeURIComponent(username)}` });
                res.end();
                return;
            }

            // User has the VIP role! Generate signed token
            const vipToken = generateVipToken({
                userId,
                username,
                roleId: requiredRole,
                avatar: avatarUrl,
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
