/**
 * Cloudflare Worker for BlacklistScript Hub
 * - Native Discord OAuth2 Authentication (/api/discord-auth)
 * - Native VIP & Role Verification (/api/verify-vip, /api/vip)
 * - Native Geo Location (/api/geo)
 * - Direct Firebase Firestore Config (/api/config)
 * - Static Assets serving from ./public
 */

const ROLE_DEFINITIONS = {
    '1549057153585651923': { name: 'Admin', tag: '🛡️ Admin', color: '#ef4444', canBypass: true, priority: 1 },
    '1548695694586544271': { name: 'Dev', tag: '💻 Dev', color: '#06b6d4', canBypass: true, priority: 2 },
    '1549727990542508083': { name: 'Bypass', tag: '⚡ Bypass', color: '#eab308', canBypass: true, priority: 3 },
    '1550502141699821619': { name: 'Bypass', tag: '⚡ Bypass', color: '#eab308', canBypass: true, priority: 3 },
    '1549056973566116020': { name: 'Verified', tag: '✅ Verified', color: '#22c55e', canBypass: false, priority: 4 }
};

const DEFAULT_VIP_SECRET = 'a53db45fa4ed7ec5e4126e9ff14e625cfe010938a411fc44b73015f9fa20c56c';
const FALLBACK_VIP_SECRET = 'blacklist_vip_default_secret_salt_2026_x89';
const DEFAULT_CLIENT_ID = '1549395921228271686';
const DEFAULT_CLIENT_SECRET = '_0r2E975KMdK9PRXYIiYat7ONK7xkIg3';
const DEFAULT_GUILD_ID = '1548669247998140438';
const DEFAULT_BOT_TOKEN = atob('TVRVME9UTTVOVGt5TVRJeU9ESTNNVFk0TmcuR01TTi05Lkw1a1U1X2p3bkdpM3Q2aHYtRlpBY3hQUi1kN3h5YmhyN1B6RDQ4');

const FIREBASE_PROJECT_ID = 'blacklistscripts';
const FIREBASE_API_KEY = 'AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI';

// Helper: base64url encoding/decoding without Node Buffer dependency
function bufferToBase64Url(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(base64url) {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return decodeURIComponent(escape(atob(base64)));
}

function utf8ToBase64Url(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSha256(secret, data) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return bufferToBase64Url(sigBuf);
}

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

async function generateVipToken(secret, data) {
    let avatarStr = String(data.avatar || '');
    if (avatarStr.includes('/avatars/')) {
        avatarStr = avatarStr.split('/avatars/')[1];
    }

    const payload = {
        userId: String(data.userId || 'unknown'),
        username: String(data.username || 'Discord User').slice(0, 32),
        avatar: avatarStr.slice(0, 60),
        roles: (Array.isArray(data.roles) ? data.roles : []).filter(id => ROLE_DEFINITIONS[id]),
        primaryRole: {
            id: data.primaryRole?.id || '',
            tag: data.primaryRole?.tag || data.primaryRole?.name || '👤 Member',
            canBypass: Boolean(data.canBypass)
        },
        canBypass: Boolean(data.canBypass),
        exp: 0, // Lifetime
        createdAt: Date.now()
    };

    const payloadBase64 = utf8ToBase64Url(JSON.stringify(payload));
    const signature = await hmacSha256(secret, payloadBase64);
    return `${payloadBase64}.${signature}`;
}

async function verifyVipToken(secret, token, fallbackSecret) {
    if (!token || typeof token !== 'string') {
        return { valid: false, error: 'Token missing' };
    }

    const parts = token.trim().split('.');
    if (parts.length !== 2) {
        return { valid: false, error: 'Invalid token format' };
    }

    const [payloadBase64, providedSig] = parts;

    // Check primary secret
    let expectedSig = await hmacSha256(secret, payloadBase64);
    let matched = (expectedSig === providedSig);

    // Fallback to secondary salt if old token
    if (!matched && fallbackSecret) {
        const fallbackSig = await hmacSha256(fallbackSecret, payloadBase64);
        if (fallbackSig === providedSig) {
            matched = true;
        }
    }

    if (!matched) {
        return { valid: false, error: 'Signature mismatch' };
    }

    try {
        const payloadJson = base64UrlToUtf8(payloadBase64);
        const payload = JSON.parse(payloadJson);

        if (payload.exp && Number(payload.exp) > 0 && Date.now() > Number(payload.exp)) {
            return { valid: false, error: 'Token expired', payload };
        }

        return { valid: true, payload };
    } catch (e) {
        return { valid: false, error: 'Failed to decode token' };
    }
}

// CORS Helper
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Preflight OPTIONS requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders()
            });
        }

        const clientId = env?.DISCORD_CLIENT_ID || DEFAULT_CLIENT_ID;
        const clientSecret = env?.DISCORD_CLIENT_SECRET || DEFAULT_CLIENT_SECRET;
        const guildId = env?.DISCORD_GUILD_ID || DEFAULT_GUILD_ID;
        const botToken = env?.DISCORD_TOKEN || DEFAULT_BOT_TOKEN;
        const vipSecret = env?.VIP_SECRET_KEY || DEFAULT_VIP_SECRET;

        // =========================================================================
        // 1. DISCORD OAUTH2 AUTHENTICATION (/api/discord-auth)
        // =========================================================================
        if (url.pathname === '/api/discord-auth') {
            const action = url.searchParams.get('action') || '';
            const code = url.searchParams.get('code') || '';
            const redirectUri = `${url.origin}/api/discord-auth`;

            // Step 1: Initiate OAuth Login Redirect
            if (action === 'login' || (!code && !action)) {
                const returnTo = url.searchParams.get('return_to') || url.searchParams.get('state') || `${url.origin}/`;
                let discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify%20guilds.members.read`;
                if (returnTo) {
                    discordAuthUrl += `&state=${encodeURIComponent(returnTo)}`;
                }
                return Response.redirect(discordAuthUrl, 302);
            }

            // Step 2: Handle Discord OAuth Callback with authorization code
            if (code) {
                const state = url.searchParams.get('state') || '';
                let targetBaseUrl = url.origin;
                if (state) {
                    try {
                        const parsedState = new URL(state);
                        if (parsedState.hostname.includes('workers.dev') || parsedState.hostname.includes('blacklisthub') || parsedState.hostname.includes('localhost')) {
                            targetBaseUrl = `${parsedState.protocol}//${parsedState.host}`;
                        }
                    } catch (e) {}
                }

                if (!clientSecret) {
                    return Response.redirect(`${targetBaseUrl}/?vip_error=missing_secret`, 302);
                }

                try {
                    // Exchange code for access token
                    const tokenParams = new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
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
                        return Response.redirect(`${targetBaseUrl}/?vip_error=token_exchange_failed`, 302);
                    }

                    const tokenData = await tokenRes.json();
                    const accessToken = tokenData.access_token;

                    // Get user profile
                    const userRes = await fetch('https://discord.com/api/users/@me', {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });

                    if (!userRes.ok) {
                        return Response.redirect(`${targetBaseUrl}/?vip_error=user_fetch_failed`, 302);
                    }

                    const userData = await userRes.json();
                    const userId = userData.id;
                    const username = userData.global_name || userData.username || 'Discord User';
                    const avatarUrl = userData.avatar
                        ? `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png`
                        : '';

                    let memberFound = false;
                    let memberRoles = [];
                    let isDiscordAdmin = false;

                    // Method A: Check user membership via user's access token
                    if (guildId) {
                        try {
                            const userMemberRes = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
                                headers: { Authorization: `Bearer ${accessToken}` }
                            });
                            if (userMemberRes.ok) {
                                const memberData = await userMemberRes.json();
                                memberRoles = memberData.roles || [];
                                memberFound = true;
                                try {
                                    const perms = BigInt(memberData.permissions || '0');
                                    // 8n = Administrator, 0x20n = Manage Server
                                    if ((perms & 8n) === 8n || (perms & 0x20n) === 0x20n) {
                                        isDiscordAdmin = true;
                                    }
                                } catch (e) {}
                            }
                        } catch (e) {}
                    }

                    // Method B: Fallback via Bot Token
                    if (botToken && guildId) {
                        try {
                            const botMemberRes = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
                                headers: { Authorization: `Bot ${botToken}` }
                            });
                            if (botMemberRes.ok) {
                                const memberData = await botMemberRes.json();
                                if (!memberFound) {
                                    memberRoles = memberData.roles || [];
                                    memberFound = true;
                                }
                            }

                            // Check if Server Owner
                            const guildRes = await fetch(`https://discord.com/api/guilds/${guildId}`, {
                                headers: { Authorization: `Bot ${botToken}` }
                            });
                            if (guildRes.ok) {
                                const guildData = await guildRes.json();
                                if (guildData.owner_id === userId) {
                                    isDiscordAdmin = true;
                                }
                            }
                        } catch (e) {}
                    }

                    if (!memberFound) {
                        return Response.redirect(`${targetBaseUrl}/?vip_error=not_in_guild&user=${encodeURIComponent(username)}`, 302);
                    }

                    let { primaryRole, canBypass } = resolveUserRoles(memberRoles);
                    if (isDiscordAdmin) {
                        canBypass = true;
                        primaryRole = { id: '1549057153585651923', name: 'Admin', tag: '🛡️ Admin', color: '#ef4444', canBypass: true, priority: 1 };
                    }

                    const vipToken = await generateVipToken(vipSecret, {
                        userId,
                        username,
                        avatar: avatarUrl,
                        roles: memberRoles,
                        primaryRole,
                        canBypass
                    });

                    return Response.redirect(`${targetBaseUrl}/?vip_token=${encodeURIComponent(vipToken)}&auth_success=1`, 302);
                } catch (err) {
                    console.error('[Discord Auth Error]:', err);
                    return Response.redirect(`${targetBaseUrl}/?vip_error=${encodeURIComponent(err.message)}`, 302);
                }
            }

            return new Response('Invalid request parameters', { status: 400 });
        }

        // =========================================================================
        // 2. VIP TOKEN VERIFICATION (/api/verify-vip & /api/vip)
        // =========================================================================
        if (url.pathname === '/api/verify-vip' || url.pathname === '/api/vip') {
            const action = url.searchParams.get('action') || '';
            let token = url.searchParams.get('token') || '';

            if (!token && request.method === 'POST') {
                try {
                    const body = await request.json();
                    token = body?.token || '';
                } catch (e) {}
            }

            if (!token) {
                return new Response(JSON.stringify({ valid: false, error: 'Missing token parameter' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            const result = await verifyVipToken(vipSecret, token, FALLBACK_VIP_SECRET);
            if (!result.valid) {
                return new Response(JSON.stringify({ valid: false, error: result.error || 'Token is invalid or expired' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            const payload = result.payload;
            return new Response(JSON.stringify({
                valid: true,
                user: {
                    userId: payload.userId,
                    username: payload.username,
                    avatar: payload.avatar || ''
                },
                roles: payload.roles || [],
                primaryRole: payload.primaryRole || { id: '', name: 'Member', tag: '👤 Member', color: '#94a3b8', canBypass: false },
                canBypass: Boolean(payload.canBypass),
                expiresAt: payload.exp || 0,
                createdAt: payload.createdAt
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders() }
            });
        }

        // =========================================================================
        // 3. GEO LOCATION DETECTION (/api/geo)
        // =========================================================================
        if (url.pathname === '/api/geo') {
            const country = (request.cf?.country || request.headers.get('cf-ipcountry') || 'TH').toUpperCase();
            const ip = request.headers.get('cf-connecting-ip') || '';

            return new Response(JSON.stringify({ country, ip }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                    ...corsHeaders()
                }
            });
        }

        // =========================================================================
        // 4. SITE CONFIGURATION FROM FIRESTORE (/api/config)
        // =========================================================================
        if (url.pathname === '/api/config') {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/hub/config?key=${FIREBASE_API_KEY}`;

            if (request.method === 'GET') {
                try {
                    const fbRes = await fetch(firestoreUrl);
                    if (fbRes.ok) {
                        const data = await fbRes.json();
                        if (data.fields && data.fields.configJson && data.fields.configJson.stringValue) {
                            const parsed = JSON.parse(data.fields.configJson.stringValue);
                            return new Response(JSON.stringify(parsed), {
                                status: 200,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Cache-Control': 'public, max-age=60, s-maxage=180',
                                    ...corsHeaders()
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.warn('[Worker Config] Firestore fetch error:', e.message);
                }

                // Fallback default config
                return new Response(JSON.stringify({
                    lootlabsGate: {
                        enabled: true,
                        provider: "shrinkearn",
                        token: "blacklist_vip",
                        shrinkearnUrl: "",
                        lootlabsUrl: "https://loot-link.com/s?oSxvK7gj&data=Ie0PVBmn90rQrhCi8dVydrnOLIdR8byoGkbNlLEmHw1qavc1xhDTH/PaTy9MUFqh",
                        expiryHours: 24,
                        bypassMessage: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน ShrinkEarn เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            if (request.method === 'POST') {
                try {
                    const body = await request.json();
                    const fbRes = await fetch(firestoreUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json; charset=utf-8' },
                        body: JSON.stringify({
                            fields: {
                                configJson: { stringValue: JSON.stringify(body) },
                                updatedAt: { stringValue: new Date().toISOString() }
                            }
                        })
                    });

                    return new Response(JSON.stringify({ success: fbRes.ok }), {
                        status: fbRes.status,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                } catch (e) {
                    return new Response(JSON.stringify({ error: e.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }
            }
        }

        // =========================================================================
        // 5. SHRINKEARN SHORTENER (/api/shrinkearn)
        // =========================================================================
        if (url.pathname === '/api/shrinkearn') {
            const targetUrl = url.searchParams.get('url') || '';
            const apiToken = url.searchParams.get('apiToken') || '3ce8c70d0c1e31404164f66164ea8f9117b29b69';

            if (!targetUrl) {
                return new Response(JSON.stringify({ error: "Missing required 'url' parameter" }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            try {
                const shrinkearnApiUrl = `https://shrinkearn.com/api?api=${encodeURIComponent(apiToken)}&url=${encodeURIComponent(targetUrl)}`;
                const response = await fetch(shrinkearnApiUrl);
                if (response.ok) {
                    const data = await response.json();
                    return new Response(JSON.stringify(data), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }
            } catch (e) {}

            // Fallback
            const quickLink = `https://shrinkearn.com/st?api=${encodeURIComponent(apiToken)}&url=${encodeURIComponent(targetUrl)}`;
            return new Response(JSON.stringify({ success: true, shortenedUrl: quickLink, fallback: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders() }
            });
        }

        // =========================================================================
        // 6. CLEAN URL REWRITES & STATIC ASSET SERVING
        // =========================================================================
        if (url.pathname === '/favicon.ico') {
            return env.ASSETS.fetch(new Request(`${url.origin}/Logo.ico`, request));
        }

        // Serve static assets from ./public
        return env.ASSETS.fetch(request);
    }
};
