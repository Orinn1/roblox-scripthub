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

const DEFAULT_VIP_SECRET = 'b1c7af121565c79c916f738bbbbed70a97d1600c14c9218dc8c14e8033b27812';
const FALLBACK_VIP_SECRET = 'a53db45fa4ed7ec5e4126e9ff14e625cfe010938a411fc44b73015f9fa20c56c';
const DEFAULT_CLIENT_ID = '1549395921228271686';
const DEFAULT_CLIENT_SECRET = '_0r2E975KMdK9PRXYIiYat7ONK7xkIg3';
const DEFAULT_GUILD_ID = '1548669247998140438';
const DEFAULT_BOT_TOKEN = atob('TVRVME9UTTVOVGt5TVRJeU9ESTNNVFk0TmcuR1Zvbnk1LlNlSnBtcWItU3ZDRHE2ZXVSRHhqMmE2OHFySVkxUHZEQ2lDZnBJ');

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
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
        // 2.5 BLACKPASS ANTI-BYPASS SERVER-SIDE VERIFICATION (/api/gate/*)
        // =========================================================================
        if (url.pathname === '/api/gate/start') {
            const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
            const slug = url.searchParams.get('slug') || 'hub-access';
            const minSec = 22; // 3 x 10s = 30s, allowing 8s margin for network

            const sessionTicket = {
                t: 'gate_ticket',
                ip: clientIp,
                slug,
                minSec,
                startedAt: Date.now(),
                exp: Date.now() + (30 * 60 * 1000) // 30 min expiry
            };

            const payloadBase64 = utf8ToBase64Url(JSON.stringify(sessionTicket));
            const sig = await hmacSha256(vipSecret, payloadBase64);
            const ticket = `${payloadBase64}.${sig}`;

            return new Response(JSON.stringify({
                success: true,
                ticket,
                minSec: sessionTicket.minSec,
                startedAt: sessionTicket.startedAt
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders() }
            });
        }

        if (url.pathname === '/api/gate/verify' && request.method === 'POST') {
            const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
            let body = {};
            try {
                body = await request.json();
            } catch (e) {}

            const ticket = body?.ticket || '';

            if (!ticket) {
                return new Response(JSON.stringify({ success: false, error: 'Missing session ticket' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            const parts = ticket.trim().split('.');
            if (parts.length !== 2) {
                return new Response(JSON.stringify({ success: false, error: 'Malformed session ticket' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            const [ticketBase64, ticketSig] = parts;
            let expectedSig = await hmacSha256(vipSecret, ticketBase64);
            let sigValid = (expectedSig === ticketSig);
            if (!sigValid && FALLBACK_VIP_SECRET) {
                const fallbackSig = await hmacSha256(FALLBACK_VIP_SECRET, ticketBase64);
                if (fallbackSig === ticketSig) sigValid = true;
            }

            if (!sigValid) {
                return new Response(JSON.stringify({ success: false, error: 'Invalid ticket signature' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            let ticketData = null;
            try {
                ticketData = JSON.parse(base64UrlToUtf8(ticketBase64));
            } catch (e) {
                return new Response(JSON.stringify({ success: false, error: 'Failed to parse ticket data' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            if (ticketData.t !== 'gate_ticket') {
                return new Response(JSON.stringify({ success: false, error: 'Invalid ticket type' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            if (ticketData.exp && Date.now() > ticketData.exp) {
                return new Response(JSON.stringify({ success: false, error: 'Ticket session expired. Please refresh and try again.' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            // Server-Side Anti-Cheat & Dwell Time Verification
            const elapsed = Math.floor((Date.now() - ticketData.startedAt) / 1000);
            const minRequired = ticketData.minSec || 22;

            if (elapsed < minRequired) {
                return new Response(JSON.stringify({
                    success: false,
                    error: `Anti-Bypass Protection: คุณดูโฆษณาไปเพียง ${elapsed} วินาที (เซิร์ฟเวอร์กำหนดขั้นต่ำ ${minRequired} วินาที)`,
                    elapsed,
                    minRequired
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            // Issue Cryptographically Signed 24-Hour Pass Token
            const expiry24h = Date.now() + (24 * 60 * 60 * 1000);
            const passData = {
                t: 'gate_pass',
                ip: clientIp,
                slug: ticketData.slug || 'hub-access',
                exp: expiry24h,
                createdAt: Date.now()
            };

            const passBase64 = utf8ToBase64Url(JSON.stringify(passData));
            const passSig = await hmacSha256(vipSecret, passBase64);
            const passToken = `${passBase64}.${passSig}`;

            return new Response(JSON.stringify({
                success: true,
                passToken,
                expiresAt: expiry24h,
                redirectUrl: `/?pass_token=${encodeURIComponent(passToken)}`
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': `blackpass_token=${passToken}; Path=/; Max-Age=86400; SameSite=Lax`,
                    ...corsHeaders()
                }
            });
        }

        if (url.pathname === '/api/gate/check-pass') {
            let passToken = url.searchParams.get('token') || '';
            if (!passToken) {
                const authHeader = request.headers.get('Authorization') || '';
                if (authHeader.startsWith('Bearer ')) {
                    passToken = authHeader.slice(7).trim();
                }
            }
            if (!passToken) {
                const cookieHeader = request.headers.get('Cookie') || '';
                const match = cookieHeader.match(/blackpass_token=([^;]+)/);
                if (match) passToken = decodeURIComponent(match[1]);
            }

            if (!passToken) {
                return new Response(JSON.stringify({ valid: false, error: 'No pass token provided' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            const parts = passToken.trim().split('.');
            if (parts.length !== 2) {
                return new Response(JSON.stringify({ valid: false, error: 'Invalid token format' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            const [passBase64, passSig] = parts;
            let expectedSig = await hmacSha256(vipSecret, passBase64);
            let valid = (expectedSig === passSig);
            if (!valid && FALLBACK_VIP_SECRET) {
                const fallbackSig = await hmacSha256(FALLBACK_VIP_SECRET, passBase64);
                if (fallbackSig === passSig) valid = true;
            }

            if (!valid) {
                return new Response(JSON.stringify({ valid: false, error: 'Invalid token signature' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            try {
                const passData = JSON.parse(base64UrlToUtf8(passBase64));
                if (passData.exp && Date.now() > passData.exp) {
                    return new Response(JSON.stringify({ valid: false, error: 'Pass token expired' }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }

                return new Response(JSON.stringify({
                    valid: true,
                    verified: true,
                    expiresAt: passData.exp,
                    createdAt: passData.createdAt
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            } catch (e) {
                return new Response(JSON.stringify({ valid: false, error: 'Failed to decode pass token' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }
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
        // 3.5 LOOTLABS ANTI-BYPASS POSTBACK & CHECKPOINT (/api/lootlabs-postback, /api/checkpoint/*)
        // =========================================================================
        if (url.pathname === '/api/lootlabs-postback') {
            const uid = url.searchParams.get('uid') || url.searchParams.get('puid') || url.searchParams.get('session') || url.searchParams.get('click_id') || '';
            const clickId = url.searchParams.get('click_id') || '';
            if (uid) {
                // 1. Save to BlacklistScripts Firestore
                try {
                    const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(uid)}?key=${FIREBASE_API_KEY}`;
                    await fetch(docUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fields: {
                                verified: { booleanValue: true },
                                clickId: { stringValue: clickId },
                                verifiedAt: { integerValue: String(Date.now()) }
                            }
                        })
                    });
                } catch (e) {
                    console.warn('[Worker] Lootlabs postback error:', e);
                }

                // 2. Also sync to GhostSensix Firestore (Cross-site LootLabs sync)
                try {
                    const ghostDocUrl = `https://firestore.googleapis.com/v1/projects/ghostsensi-1d96b/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(uid)}?key=AIzaSyBCMSULoP-CnTWurWMTUKDfRMEEu2T7PVE`;
                    fetch(ghostDocUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fields: {
                                verified: { booleanValue: true },
                                clickId: { stringValue: clickId },
                                verifiedAt: { integerValue: String(Date.now()) }
                            }
                        })
                    }).catch(() => {});
                } catch (e) {}
            }
            return new Response(JSON.stringify({ status: 'ok', message: 'LootLabs postback credited successfully', uid, verified: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders() }
            });
        }

        if (url.pathname === '/api/checkpoint/status' || url.pathname === '/api/check-session') {
            const sessionId = url.searchParams.get('session') || url.searchParams.get('puid') || '';
            let verified = false;
            if (sessionId) {
                try {
                    const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(sessionId)}?key=${FIREBASE_API_KEY}`;
                    const res = await fetch(docUrl);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.fields && data.fields.verified && data.fields.verified.booleanValue === true) {
                            verified = true;
                        }
                    }
                } catch (e) {}
            }
            return new Response(JSON.stringify({ sessionId, puid: sessionId, verified }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() }
            });
        }

        // =========================================================================
        // 3.6 LINKVERTISE ANTI-BYPASS VERIFICATION (/api/linkvertise/verify)
        // =========================================================================
        if (url.pathname === '/api/linkvertise/verify') {
            const hash = url.searchParams.get('hash') || '';
            const lvToken = '51fdfa2e4968abbf74a67de73fe63cefbe2cd2e1802bd67af651d4fa88aec7e7';

            if (!hash) {
                return new Response(JSON.stringify({ success: false, error: 'Missing hash parameter' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            try {
                const lvRes = await fetch(`https://publisher.linkvertise.com/api/v1/anti_bypassing?token=${lvToken}&hash=${encodeURIComponent(hash)}`, {
                    method: 'POST'
                });
                const resText = await lvRes.text();
                const isValid = resText.trim().toLowerCase() === 'true';

                if (isValid) {
                    return new Response(JSON.stringify({
                        success: true,
                        verified: true,
                        message: 'Linkvertise anti-bypass verification successful'
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        verified: false,
                        error: 'Hash expired (10s limit) or invalid bypass attempt',
                        details: resText
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }
            } catch (err) {
                return new Response(JSON.stringify({ success: false, error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }
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
                        provider: "lootlabs",
                        token: "blacklist_vip",
                        linkvertiseUrl: "https://link-center.net/3335115/wnzycVtiGOAK",
                        linkvertiseToken: "51fdfa2e4968abbf74a67de73fe63cefbe2cd2e1802bd67af651d4fa88aec7e7",
                        shrinkmeUrl: "https://shrinkme.click/aZd1s",
                        blackpassLockerUrl: "/access",
                        shrinkearnUrl: "",
                        lootlabsUrl: "https://loot-link.com/s?cWo9w57Q",
                        expiryHours: 24,
                        bypassMessage: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน LootLabs เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์ 24 ชั่วโมง"
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
        // 4.1 GATE EVENT TRACKING (/api/gate/track)
        // =========================================================================
        if (url.pathname === '/api/gate/track') {
            if (request.method === 'POST') {
                try {
                    const body = await request.json();
                    const slug = (body.slug || '').trim().toLowerCase();
                    const eventType = (body.event || '').trim().toLowerCase(); // 'click' | 'unlock'
                    if (!slug || !['click', 'unlock'].includes(eventType)) {
                        return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                        });
                    }

                    const getDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lockers/${encodeURIComponent(slug)}?key=${FIREBASE_API_KEY}`;
                    const getRes = await fetch(getDocUrl);
                    if (!getRes.ok) {
                        return new Response(JSON.stringify({ error: 'Locker not found' }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                        });
                    }

                    const doc = await getRes.json();
                    let currentClicks = parseInt(doc.fields?.clicks?.integerValue || '0', 10);
                    let currentUnlocks = parseInt(doc.fields?.unlocks?.integerValue || '0', 10);

                    if (eventType === 'click') currentClicks += 1;
                    if (eventType === 'unlock') currentUnlocks += 1;

                    const patchDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lockers/${encodeURIComponent(slug)}?updateMask.fieldPaths=clicks&updateMask.fieldPaths=unlocks&key=${FIREBASE_API_KEY}`;
                    await fetch(patchDocUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json; charset=utf-8' },
                        body: JSON.stringify({
                            fields: {
                                clicks: { integerValue: currentClicks },
                                unlocks: { integerValue: currentUnlocks }
                            }
                        })
                    });

                    return new Response(JSON.stringify({
                        success: true,
                        slug: slug,
                        clicks: currentClicks,
                        unlocks: currentUnlocks
                    }), {
                        status: 200,
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
        // 4.2 LIST ALL LOCKERS (/api/locker/list)
        // =========================================================================
        if (url.pathname === '/api/locker/list') {
            try {
                const listUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lockers?pageSize=100&key=${FIREBASE_API_KEY}`;
                const fbRes = await fetch(listUrl);
                if (!fbRes.ok) {
                    const err = await fbRes.text();
                    return new Response(JSON.stringify({ error: 'Failed to list lockers', details: err }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }

                const data = await fbRes.json();
                const rawDocs = data.documents || [];
                const lockers = rawDocs.map(doc => {
                    const f = doc.fields || {};
                    const pathParts = doc.name ? doc.name.split('/') : [];
                    const docId = pathParts[pathParts.length - 1] || '';
                    const slug = f.slug?.stringValue || docId;
                    const clicks = parseInt(f.clicks?.integerValue || '0', 10);
                    const unlocks = parseInt(f.unlocks?.integerValue || '0', 10);
                    const ads = parseInt(f.ads?.integerValue || '3', 10);
                    return {
                        slug: slug,
                        url: f.url?.stringValue || '',
                        script: f.script?.stringValue || '',
                        title: f.title?.stringValue || slug,
                        desc: f.desc?.stringValue || '',
                        ch: f.ch?.stringValue || 'Blacklistxyx',
                        ads: ads,
                        clicks: clicks,
                        unlocks: unlocks,
                        createdAt: f.createdAt?.stringValue || doc.createTime || ''
                    };
                });

                return new Response(JSON.stringify({
                    success: true,
                    lockers: lockers
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }
        }

        // =========================================================================
        // 4.3 SHORT LOCKER CRUD API (/api/locker & /api/locker/create)
        // =========================================================================
        if (url.pathname === '/api/locker' || url.pathname === '/api/locker/create') {
            if (request.method === 'POST') {
                try {
                    const body = await request.json();
                    let slug = (body.slug || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
                    if (!slug) {
                        slug = Math.random().toString(36).substring(2, 7);
                    }

                    const targetUrl = (body.url || body.destinationUrl || '').trim();
                    const scriptCode = (body.script || body.scriptCode || '').trim();
                    const title = (body.title || '').trim();
                    const desc = (body.desc || '').trim();
                    const channel = (body.ch || body.channel || 'Blacklistxyx').trim();
                    const ads = parseInt(body.ads !== undefined ? body.ads : '3', 10);

                    const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lockers/${encodeURIComponent(slug)}?key=${FIREBASE_API_KEY}`;
                    
                    const fbPayload = {
                        fields: {
                            slug: { stringValue: slug },
                            url: { stringValue: targetUrl },
                            script: { stringValue: scriptCode },
                            title: { stringValue: title },
                            desc: { stringValue: desc },
                            ch: { stringValue: channel },
                            ads: { integerValue: ads },
                            clicks: { integerValue: 0 },
                            unlocks: { integerValue: 0 },
                            createdAt: { stringValue: new Date().toISOString() }
                        }
                    };

                    const fbRes = await fetch(docUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json; charset=utf-8' },
                        body: JSON.stringify(fbPayload)
                    });

                    if (!fbRes.ok) {
                        const errTxt = await fbRes.text();
                        return new Response(JSON.stringify({ error: 'Firestore write failed', details: errTxt }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                        });
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        slug: slug,
                        shortUrl: `${url.origin}/l/${slug}`
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                } catch (e) {
                    return new Response(JSON.stringify({ error: e.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }
            }

            if (request.method === 'PATCH') {
                try {
                    const body = await request.json();
                    const slug = (body.slug || '').trim().toLowerCase();
                    if (!slug) {
                        return new Response(JSON.stringify({ error: 'Missing slug' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                        });
                    }

                    const targetUrl = (body.url || body.destinationUrl || '').trim();
                    const scriptCode = (body.script || body.scriptCode || '').trim();
                    const title = (body.title || '').trim();
                    const desc = (body.desc || '').trim();
                    const channel = (body.ch || body.channel || 'Blacklistxyx').trim();
                    const ads = parseInt(body.ads !== undefined ? body.ads : '3', 10);

                    const patchDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lockers/${encodeURIComponent(slug)}?updateMask.fieldPaths=url&updateMask.fieldPaths=script&updateMask.fieldPaths=title&updateMask.fieldPaths=desc&updateMask.fieldPaths=ch&updateMask.fieldPaths=ads&key=${FIREBASE_API_KEY}`;
                    
                    const fbRes = await fetch(patchDocUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json; charset=utf-8' },
                        body: JSON.stringify({
                            fields: {
                                url: { stringValue: targetUrl },
                                script: { stringValue: scriptCode },
                                title: { stringValue: title },
                                desc: { stringValue: desc },
                                ch: { stringValue: channel },
                                ads: { integerValue: ads }
                            }
                        })
                    });

                    if (!fbRes.ok) {
                        const err = await fbRes.text();
                        return new Response(JSON.stringify({ error: 'Firestore update failed', details: err }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                        });
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        slug: slug,
                        locker: { slug, url: targetUrl, script: scriptCode, title, desc, ch: channel, ads: ads }
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                } catch (e) {
                    return new Response(JSON.stringify({ error: e.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }
            }

            if (request.method === 'DELETE') {
                try {
                    let slug = (url.searchParams.get('slug') || '').trim().toLowerCase();
                    if (!slug) {
                        try {
                            const b = await request.json();
                            slug = (b.slug || '').trim().toLowerCase();
                        } catch (_) {}
                    }
                    if (!slug) {
                        return new Response(JSON.stringify({ error: 'Missing slug' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                        });
                    }

                    const delDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lockers/${encodeURIComponent(slug)}?key=${FIREBASE_API_KEY}`;
                    const fbRes = await fetch(delDocUrl, { method: 'DELETE' });
                    return new Response(JSON.stringify({ success: true, slug }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                } catch (e) {
                    return new Response(JSON.stringify({ error: e.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }
            }

            if (request.method === 'GET') {
                const slug = (url.searchParams.get('slug') || '').trim();
                if (!slug) {
                    return new Response(JSON.stringify({ error: 'Missing slug' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                    });
                }

                try {
                    const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lockers/${encodeURIComponent(slug)}?key=${FIREBASE_API_KEY}`;
                    const fbRes = await fetch(docUrl);
                    if (fbRes.ok) {
                        const data = await fbRes.json();
                        const fields = data.fields || {};
                        return new Response(JSON.stringify({
                            success: true,
                            locker: {
                                slug: fields.slug?.stringValue || slug,
                                url: fields.url?.stringValue || '',
                                script: fields.script?.stringValue || '',
                                title: fields.title?.stringValue || '',
                                desc: fields.desc?.stringValue || '',
                                ch: fields.ch?.stringValue || 'Blacklistxyx',
                                ads: parseInt(fields.ads?.integerValue || '3', 10),
                                clicks: parseInt(fields.clicks?.integerValue || '0', 10),
                                unlocks: parseInt(fields.unlocks?.integerValue || '0', 10)
                            }
                        }), {
                            status: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Cache-Control': 'no-cache',
                                ...corsHeaders()
                            }
                        });
                    } else {
                        return new Response(JSON.stringify({ error: 'Locker not found', status: 404 }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                        });
                    }
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
        // 5.5 AUTO-FETCH LATEST YOUTUBE VIDEO (/api/latest-video)
        // =========================================================================
        if (url.pathname === '/api/latest-video') {
            const rawCh = (url.searchParams.get('ch') || url.searchParams.get('channel') || '@GhostSensix').trim();
            const cleanCh = rawCh.replace(/^@/, '').toLowerCase();
            
            const KNOWN_CHANNELS = {
                'ghostsensix': 'UC8laKzbaWUNJMJ6XN_pxiBg',
                'ghostsensi': 'UC8laKzbaWUNJMJ6XN_pxiBg',
                'blacklistxyx': 'UCOAGxYeICyBbSjxJkul3HXA',
                'blacklist': 'UCOAGxYeICyBbSjxJkul3HXA'
            };

            let channelId = KNOWN_CHANNELS[cleanCh] || '';

            if (!channelId && cleanCh) {
                try {
                    const ytRes = await fetch(`https://www.youtube.com/@${cleanCh}`, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                    });
                    const ytHtml = await ytRes.text();
                    const m = ytHtml.match(/browseId":"(UC[a-zA-Z0-9_-]{22})"/);
                    if (m && m[1]) channelId = m[1];
                } catch (e) {}
            }

            if (!channelId) {
                return new Response(JSON.stringify({ 
                    success: true, 
                    channel: cleanCh,
                    videoUrl: `https://www.youtube.com/@${cleanCh}/videos` 
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
                });
            }

            try {
                const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (rssRes.ok) {
                    const rssXml = await rssRes.text();
                    const vMatch = rssXml.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/);
                    if (vMatch && vMatch[1]) {
                        const vid = vMatch[1];
                        return new Response(JSON.stringify({
                            success: true,
                            channel: cleanCh,
                            channelId,
                            videoId: vid,
                            videoUrl: `https://www.youtube.com/watch?v=${vid}`
                        }), {
                            headers: { 
                                'Content-Type': 'application/json', 
                                'Cache-Control': 'public, max-age=180',
                                ...corsHeaders() 
                            }
                        });
                    }
                }
            } catch (err) {}

            // Secondary: Fetch latest video directly from channel /videos page
            try {
                const ytHtmlRes = await fetch(`https://www.youtube.com/@${cleanCh}/videos`, {
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9'
                    }
                });
                if (ytHtmlRes.ok) {
                    const ytHtml = await ytHtmlRes.text();
                    const vMatch2 = ytHtml.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
                    if (vMatch2 && vMatch2[1]) {
                        const vid = vMatch2[1];
                        return new Response(JSON.stringify({
                            success: true,
                            channel: cleanCh,
                            channelId,
                            videoId: vid,
                            videoUrl: `https://www.youtube.com/watch?v=${vid}`
                        }), {
                            headers: { 
                                'Content-Type': 'application/json', 
                                'Cache-Control': 'public, max-age=180',
                                ...corsHeaders() 
                            }
                        });
                    }
                }
            } catch (err2) {}

            // Known fallback latest videos
            const FALLBACK_VIDEOS = {
                'ghostsensix': 'HVPqCzVCnQk',
                'ghostsensi': 'HVPqCzVCnQk',
                'blacklistxyx': 'ClBmbJDIWzA',
                'blacklist': 'ClBmbJDIWzA'
            };
            const fallbackVid = FALLBACK_VIDEOS[cleanCh] || '';
            const fallbackUrl = fallbackVid ? `https://www.youtube.com/watch?v=${fallbackVid}` : `https://www.youtube.com/@${cleanCh}/videos`;

            return new Response(JSON.stringify({
                success: true,
                channel: cleanCh,
                channelId,
                videoId: fallbackVid,
                videoUrl: fallbackUrl
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders() }
            });
        }

        // =========================================================================
        // 6. CLEAN URL REWRITES & STATIC ASSET SERVING
        // =========================================================================
        if (url.pathname === '/sw.js') {
            const swContent = `// Monetag MultiTag Push Zone: Positive tag (11905136)
self.options = {
    "domain": "3nbf4.com",
    "zoneId": 11905136
};
self.lary = "";
try {
    importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');
} catch (e) {}
`;
            return new Response(swContent, {
                status: 200,
                headers: {
                    'Content-Type': 'application/javascript; charset=utf-8',
                    'Service-Worker-Allowed': '/',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }

        if (url.pathname === '/favicon.ico') {
            return env.ASSETS.fetch(new Request(`${url.origin}/Logo.ico`, request));
        }

        // Clean URL route for BlackPass Locker & Dashboard
        if ((url.hostname.startsWith('blackpass.') || url.pathname === '/shorten' || url.pathname === '/shrink') && (url.pathname === '/' || url.pathname === '')) {
            return Response.redirect(`${url.origin}/gateflow/index.html`, 302);
        }
        if (url.pathname === '/shorten' || url.pathname === '/shrink') {
            return Response.redirect(`${url.origin}/gateflow/index.html`, 302);
        }

        // Anti-Bypass Checkpoint Route for LootLabs (/access, /checkpoint) -> Serves 2-Tier Sub2Unlock Locker
        if (url.pathname === '/access' || url.pathname === '/checkpoint') {
            const assetUrl = new URL(`${url.origin}/gateflow/locker.html`);
            url.searchParams.forEach((val, key) => {
                assetUrl.searchParams.set(key, val);
            });
            if (!assetUrl.searchParams.has('slug')) {
                assetUrl.searchParams.set('slug', 'hub-access');
            }
            return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
        }

        // Short & Clean direct routes for Access Gate and Locker
        if (url.pathname === '/hub' || url.pathname === '/gate' || url.pathname === '/go' || url.pathname === '/short' || url.pathname === '/locker' || url.pathname === '/gateflow/locker' || url.pathname.startsWith('/l/')) {
            const assetUrl = new URL(`${url.origin}/gateflow/locker.html`);
            url.searchParams.forEach((val, key) => {
                assetUrl.searchParams.set(key, val);
            });
            if (url.pathname.startsWith('/l/')) {
                const slug = url.pathname.slice(3).trim();
                if (slug && !assetUrl.searchParams.has('slug')) {
                    assetUrl.searchParams.set('slug', slug);
                }
            }
            if (url.pathname === '/hub' && !assetUrl.searchParams.has('slug')) {
                assetUrl.searchParams.set('slug', 'hub-access');
            }
            return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
        }

        if (url.pathname === '/generator' || url.pathname === '/gateflow/generator') {
            return env.ASSETS.fetch(new Request(`${url.origin}/gateflow/generator.html${url.search}`, request));
        }
        if (url.pathname === '/dashboard' || url.pathname === '/gateflow/dashboard') {
            return env.ASSETS.fetch(new Request(`${url.origin}/gateflow/dashboard.html${url.search}`, request));
        }

        // Serve static assets from ./public
        return env.ASSETS.fetch(request);
    }
};
