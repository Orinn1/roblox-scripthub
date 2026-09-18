const crypto = require('crypto');

const VIP_ROLE_ID = process.env.DISCORD_REQUIRED_ROLE_ID || '1549727990542508083';
const VIP_ROLE_IDS = ['1549727990542508083', '1550502141699821619'];
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1549395921228271686';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '_0r2E975KMdK9PRXYIiYat7ONK7xkIg3';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1548669247998140438';
const BOT_TOKEN = process.env.DISCORD_TOKEN || '';

function getSecretKey() {
    if (process.env.VIP_SECRET_KEY) return process.env.VIP_SECRET_KEY;
    if (process.env.DISCORD_TOKEN) return crypto.createHash('sha256').update(process.env.DISCORD_TOKEN + '_blacklist_vip_salt').digest('hex');
    return 'blacklist_vip_default_secret_salt_2026_x89';
}

const ROLE_DEFINITIONS = {
    '1549057153585651923': { name: 'Admin', tag: '🛡️ Admin', color: '#ef4444', canBypass: true, priority: 1 },
    '1548695694586544271': { name: 'Dev', tag: '💻 Dev', color: '#06b6d4', canBypass: true, priority: 2 },
    '1549727990542508083': { name: 'Bypass', tag: '⚡ Bypass', color: '#eab308', canBypass: true, priority: 3 },
    '1550502141699821619': { name: 'Bypass', tag: '⚡ Bypass', color: '#eab308', canBypass: true, priority: 3 },
    '1549056973566116020': { name: 'Verified', tag: '✅ Verified', color: '#22c55e', canBypass: false, priority: 4 }
};

function resolveUserRoles(roles = []) {
    let bestRole = { id: '', name: 'Member', tag: '👤 Member', color: '#94a3b8', canBypass: false, priority: 99 };
    let canBypass = false;

    for (const rId of roles) {
        const def = ROLE_DEFINITIONS[rId];
        if (def) {
            if (def.canBypass) canBypass = true;
            if (def.priority < bestRole.priority) {
                bestRole = { id: rId, ...def };
            }
        }
    }

    return { primaryRole: bestRole, canBypass, roles };
}

function generateVipToken(data) {
    const payload = {
        userId: String(data.userId || 'unknown'),
        username: String(data.username || 'Discord User'),
        avatar: String(data.avatar || ''),
        roles: Array.isArray(data.roles) ? data.roles : [],
        primaryRole: data.primaryRole || { id: '', name: 'Member', tag: '👤 Member', color: '#94a3b8', canBypass: false },
        canBypass: Boolean(data.canBypass),
        exp: 0, // 0 = Lifetime (Never expires)
        createdAt: Date.now(),
        nonce: crypto.randomBytes(6).toString('hex')
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', getSecretKey())
        .update(payloadBase64)
        .digest('base64url');

    return `${payloadBase64}.${signature}`;
}

function verifyVipToken(token) {
    if (!token || typeof token !== 'string') {
        return { valid: false, error: 'Token missing' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
        return { valid: false, error: 'Invalid token format' };
    }

    const [payloadBase64, providedSig] = parts;

    try {
        const expectedSig = crypto
            .createHmac('sha256', getSecretKey())
            .update(payloadBase64)
            .digest('base64url');

        const expectedBuf = Buffer.from(expectedSig);
        const providedBuf = Buffer.from(providedSig);

        if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
            return { valid: false, error: 'Signature mismatch' };
        }

        const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);

        if (payload.exp && payload.exp > 0 && Date.now() > payload.exp) {
            return { valid: false, error: 'Token expired', payload };
        }

        return { valid: true, payload };
    } catch (e) {
        return { valid: false, error: 'Failed to decode token' };
    }
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'blacklistscripty.vercel.app';
    const baseUrl = `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/discord-auth`;

    const action = req.query?.action || '';
    const code = req.query?.code || '';

    // =========================================================================
    // 1. VIP Token Verification (/api/verify-vip or /api/vip?action=verify)
    // =========================================================================
    if (action === 'verify' || (!code && action !== 'login' && (req.query?.token || (req.method === 'POST' && req.body?.token)))) {
        try {
            let token = '';
            if (req.method === 'GET') {
                token = req.query?.token || '';
            } else if (req.method === 'POST') {
                const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
                token = body?.token || req.query?.token || '';
            }

            if (!token) {
                return res.status(400).json({ valid: false, error: 'Missing token parameter' });
            }

            const result = verifyVipToken(token);
            if (!result.valid) {
                return res.status(401).json({ valid: false, error: result.error || 'Token is invalid or expired' });
            }

            return res.status(200).json({
                valid: true,
                user: {
                    userId: result.payload.userId,
                    username: result.payload.username,
                    avatar: result.payload.avatar || ''
                },
                roles: result.payload.roles || [],
                primaryRole: result.payload.primaryRole || { id: '', name: 'Member', tag: '👤 Member', color: '#94a3b8', canBypass: false },
                canBypass: Boolean(result.payload.canBypass),
                expiresAt: result.payload.exp || 0,
                createdAt: result.payload.createdAt
            });
        } catch (err) {
            return res.status(500).json({ valid: false, error: err.message });
        }
    }

    // =========================================================================
    // 2. Discord OAuth2 Redirect (/api/discord-auth?action=login)
    // =========================================================================
    if (action === 'login' || (!code && !action)) {
        if (!CLIENT_ID) {
            return res.status(500).send('<h3>ข้อผิดพลาด: ไม่พบ DISCORD_CLIENT_ID</h3>');
        }

        const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify%20guilds.members.read`;
        return res.redirect(302, discordAuthUrl);
    }

    // =========================================================================
    // 3. Discord OAuth2 Callback (/api/discord-auth?code=...)
    // =========================================================================
    if (code) {
        if (!CLIENT_SECRET) {
            return res.redirect(302, `${baseUrl}/?vip_error=missing_secret`);
        }

        try {
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
                return res.redirect(302, `${baseUrl}/?vip_error=token_exchange_failed`);
            }

            const tokenData = await tokenRes.json();
            const accessToken = tokenData.access_token;

            const userRes = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!userRes.ok) {
                return res.redirect(302, `${baseUrl}/?vip_error=user_fetch_failed`);
            }

            const userData = await userRes.json();
            const userId = userData.id;
            const username = userData.global_name || userData.username || 'Discord User';
            const avatarUrl = userData.avatar
                ? `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png`
                : '';

            let memberFound = false;
            let memberRoles = [];

            // Check roles via user access token
            if (GUILD_ID) {
                const userMemberRes = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }).catch(() => null);

                if (userMemberRes && userMemberRes.ok) {
                    const memberData = await userMemberRes.json();
                    memberRoles = memberData.roles || [];
                    memberFound = true;
                }
            }

            // Fallback via Bot Token
            if (!memberFound && BOT_TOKEN && GUILD_ID) {
                const botMemberRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
                    headers: { Authorization: `Bot ${BOT_TOKEN}` }
                }).catch(() => null);

                if (botMemberRes && botMemberRes.ok) {
                    const memberData = await botMemberRes.json();
                    memberRoles = memberData.roles || [];
                    memberFound = true;
                }
            }

            if (!memberFound) {
                return res.redirect(302, `${baseUrl}/?vip_error=not_in_guild&user=${encodeURIComponent(username)}`);
            }

            const { primaryRole, canBypass } = resolveUserRoles(memberRoles);

            const vipToken = generateVipToken({
                userId,
                username,
                avatar: avatarUrl,
                roles: memberRoles,
                primaryRole,
                canBypass
            });

            return res.redirect(302, `${baseUrl}/?vip_token=${encodeURIComponent(vipToken)}&auth_success=1`);
        } catch (err) {
            console.error('[Discord Auth Error]:', err);
            return res.redirect(302, `${baseUrl}/?vip_error=${encodeURIComponent(err.message)}`);
        }
    }

    return res.status(400).send('Invalid request parameters');
};
