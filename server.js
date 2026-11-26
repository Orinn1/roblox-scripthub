try { require('dotenv').config(); } catch (e) {}

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// SQLite Database Module
const db = require('./db.js');

const crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const FIREBASE_PROJECT_ID = 'blacklistscripts';
const FIREBASE_API_KEY = 'AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI';
const unlockSessions = new Map();
let firestoreScriptsCache = { data: null, ts: 0 };

function verifyVipTokenLocal(token) {
    if (!token || typeof token !== 'string') return { valid: false };
    const parts = token.trim().split('.');
    if (parts.length !== 2) return { valid: false };
    const [payloadBase64, providedSig] = parts;
    const secrets = [
        process.env.VIP_SECRET_KEY,
        'a53db45fa4ed7ec5e4126e9ff14e625cfe010938a411fc44b73015f9fa20c56c',
        'b1c7af121565c79c916f738bbbbed70a97d1600c14c9218dc8c14e8033b27812',
        'blacklist_vip_default_secret_salt_2026_x89'
    ].filter(Boolean);
    try {
        for (const sec of secrets) {
            const expectedSig = crypto.createHmac('sha256', sec).update(payloadBase64).digest('base64url');
            if (expectedSig === providedSig) {
                const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
                if (payload.exp && Number(payload.exp) > 0 && Date.now() > Number(payload.exp)) return { valid: false };
                return { valid: true, payload };
            }
        }
    } catch (e) {}
    return { valid: false };
}

async function getUnlockConfigLocal() {
    let cfg = {};
    try {
        const fbRes = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/hub/config?key=${FIREBASE_API_KEY}`);
        if (fbRes.ok) {
            const d = await fbRes.json();
            if (d?.fields?.configJson?.stringValue) cfg = JSON.parse(d.fields.configJson.stringValue);
        }
    } catch (e) {}
    if (!cfg || !Object.keys(cfg).length) {
        try {
            cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'data', 'config.json'), 'utf8'));
        } catch (e) {}
    }
    const flow = cfg.unlockFlow || {};
    const stepUrls = Array.isArray(flow.stepUrls) && flow.stepUrls.length
        ? flow.stepUrls
        : [
            cfg.adsterraSmartlinkUrl || 'https://asiafilm.org/4/15645e0d7a0b92a6fcc92b70cbee607d',
            cfg.monetagDirectLinkUrl || 'https://uplcm.com/4/12169736',
            'https://asiafilm.org/4/d8707d797617eddbed2038e5921285e3',
            'https://uplcm.com/4/11905140'
        ];
    const ytTasks = cfg.unlockTasks || {};
    const entryCfg = cfg.entryTasks || {};
    return {
        stepsTotal: Number(flow.stepsTotal) || 4,
        waitSeconds: Number(flow.waitSeconds) || 5,
        stepUrls,
        monetagMultiTagZone: String(flow.monetagMultiTagZone || ''),
        discordRequiredOnce: flow.discordRequiredOnce !== false,
        discordInviteUrl: String(flow.discordInviteUrl || cfg.discordInviteUrl || 'https://discord.gg/6MTUP78KF6'),
        discordRememberDays: Number(flow.discordRememberDays) || 30,
        entryTasks: {
            enabled: entryCfg.enabled !== false,
            youtubeChannelUrl: String(ytTasks.youtubeChannelUrl || (cfg.socialLinks && cfg.socialLinks.youtube) || 'https://www.youtube.com/@Blacklistxyx'),
            youtubeChannelName: String(ytTasks.youtubeChannelName || 'ช่อง Blacklistxyx'),
            latestVideoUrl: String(ytTasks.latestVideoUrl || ''),
            waitSeconds: Number(entryCfg.waitSeconds) || 5,
            rememberHours: Number(entryCfg.rememberHours) || 24
        }
    };
}

async function loadAllScriptsLocal() {
    const now = Date.now();
    if (firestoreScriptsCache.data && (now - firestoreScriptsCache.ts) < 60000) {
        return firestoreScriptsCache.data;
    }
    try {
        const fbRes = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/hub/database?key=${FIREBASE_API_KEY}`);
        if (fbRes.ok) {
            const d = await fbRes.json();
            if (d?.fields?.scriptsJson?.stringValue) {
                const parsed = JSON.parse(d.fields.scriptsJson.stringValue);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    firestoreScriptsCache = { data: parsed, ts: now };
                    return parsed;
                }
            }
        }
    } catch (e) {}
    const local = db.getAllScripts();
    if (Array.isArray(local) && local.length > 0) return local;
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'data', 'scripts.json'), 'utf8'));
    } catch (e) {
        return [];
    }
}

function stripLoadstring(item) {
    const copy = { ...item };
    delete copy.loadstring;
    copy.locked = true;
    return copy;
}

// Caches for WEAO API to respect rate-limits
let exploitsCache = { data: null, timestamp: 0 };
const suncCache = new Map();

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.setEncoding('utf8');
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

async function executeServerless(handlerPath, req, res, parsedUrl) {
    try {
        let body = {};
        if (req.method === 'POST') {
            try {
                body = await readJsonBody(req);
            } catch (e) {
                body = {};
            }
        }
        req.query = parsedUrl.query || {};
        req.body = body;

        res.status = function (code) {
            res.statusCode = code;
            return res;
        };
        res.json = function (obj) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(obj));
            return res;
        };
        res.send = function (content) {
            if (typeof content === 'string' && content.trim().startsWith('<!DOCTYPE html')) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
            }
            res.end(content);
            return res;
        };

        const handler = require(handlerPath);
        await handler(req, res);
    } catch (err) {
        console.error(`[Server API Error] ${handlerPath}:`, err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS Headers for API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // =========================================================================
    // API: Health / Ping Check (สำหรับ UptimeRobot & Render Keep-Alive 24/7)
    // =========================================================================
    if (pathname === '/api/health' || pathname === '/api/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            status: 'online',
            uptime: `${Math.floor(process.uptime())}s`,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // =========================================================================
    // API: Discord Script Update Announce
    // =========================================================================
    if (pathname === '/api/announce-discord') {
        await executeServerless('./api/announce-discord.js', req, res, parsedUrl);
        return;
    }

    // =========================================================================
    // API: Config (Site Name & Settings) - Synced with Firebase Firestore & SQLite
    // =========================================================================
    if (pathname === '/api/config') {
        await executeServerless('./api/config.js', req, res, parsedUrl);
        if (req.method === 'POST' && req.body) {
            try {
                db.saveConfig(req.body);
            } catch (e) {}
        }
        return;
    }

    // =========================================================================
    // API: Geo Country Detection
    // =========================================================================
    if (pathname === '/api/geo') {
        await executeServerless('./api/geo.js', req, res, parsedUrl);
        return;
    }

    // =========================================================================
    // API: ShrinkEarn Auto Shortener
    // =========================================================================
    if (pathname === '/api/shrinkearn-shorten' || pathname === '/api/shrinkearn') {
        await executeServerless('./api/shrinkearn.js', req, res, parsedUrl);
        return;
    }

    // =========================================================================
    // API: VIP System & Discord OAuth2
    // =========================================================================
    if (pathname === '/api/vip' || pathname === '/api/verify-vip' || pathname === '/api/discord-auth') {
        await executeServerless('./api/vip.js', req, res, parsedUrl);
        return;
    }

    // =========================================================================
    // API: Database Tools (/api/db/stats, /api/db/clear, /api/db/reset)
    // =========================================================================
    if (pathname === '/api/db/stats' && req.method === 'GET') {
        const stats = db.getDatabaseStats();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(stats));
        return;
    }

    if (pathname === '/api/db/clear' && req.method === 'POST') {
        db.clearAllScripts();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'All scripts cleared from database', total: 0 }));
        return;
    }

    if (pathname === '/api/db/reset' && req.method === 'POST') {
        const resetList = db.resetDefaultScripts();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Database reset to default sample scripts', total: resetList.length }));
        return;
    }

    // =========================================================================
    // API: Public Locked Scripts & Server-Side 2-Step Unlock Flow
    // =========================================================================
    if (pathname === '/api/public/scripts' && req.method === 'GET') {
        try {
            const [scripts, unlockCfg] = await Promise.all([loadAllScriptsLocal(), getUnlockConfigLocal()]);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify({
                scripts: scripts.map(stripLoadstring),
                unlock: {
                    stepsTotal: unlockCfg.stepsTotal,
                    waitSeconds: unlockCfg.waitSeconds,
                    monetagMultiTagZone: unlockCfg.monetagMultiTagZone,
                    discordRequiredOnce: unlockCfg.discordRequiredOnce,
                    discordRememberDays: unlockCfg.discordRememberDays,
                    discordInviteUrl: unlockCfg.discordInviteUrl
                },
                entryTasks: unlockCfg.entryTasks
            }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    if (pathname === '/api/unlock/start' && req.method === 'POST') {
        try {
            const { scriptId, discordJoined } = await readJsonBody(req);
            const scripts = await loadAllScriptsLocal();
            const found = scripts.find(s => String(s.id) === String(scriptId));
            if (!found) {
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Script not found' }));
                return;
            }
            const cfg = await getUnlockConfigLocal();
            const cookieStr = String(req.headers.cookie || '');
            const alreadyJoined = Boolean(discordJoined) || /(?:^|;\s*)bs_discord_joined=1(?:;|$)/.test(cookieStr);
            const discordRequired = Boolean(cfg.discordRequiredOnce && cfg.discordInviteUrl && !alreadyJoined);
            const discordDone = !discordRequired;
            const sid = 'ul_' + Date.now().toString(36) + '_' + crypto.randomBytes(6).toString('hex');
            const sess = {
                id: sid,
                scriptId: String(found.id),
                step: 0,
                total: cfg.stepsTotal,
                waitSeconds: cfg.waitSeconds,
                discordRequired,
                discordDone,
                stepStartedAt: 0,
                complete: false,
                createdAt: Date.now()
            };
            unlockSessions.set(sid, sess);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify({
                ok: true,
                session: {
                    id: sess.id,
                    scriptId: sess.scriptId,
                    step: sess.step,
                    total: sess.total,
                    waitSeconds: sess.waitSeconds,
                    discordRequired: sess.discordRequired,
                    discordDone: sess.discordDone,
                    complete: sess.complete
                }
            }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
        }
        return;
    }

    if (pathname === '/api/unlock/go' && req.method === 'GET') {
        const sid = String(parsedUrl.query?.session || '').trim();
        const sess = unlockSessions.get(sid);
        if (!sess || (Date.now() - sess.createdAt) > 30 * 60 * 1000) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Unlock session expired or not found');
            return;
        }
        const cfg = await getUnlockConfigLocal();
        sess.stepStartedAt = Date.now();
        unlockSessions.set(sid, sess);
        const targetUrl = (sess.discordRequired && !sess.discordDone)
            ? (cfg.discordInviteUrl || 'https://discord.gg/6MTUP78KF6')
            : (cfg.stepUrls[sess.step % cfg.stepUrls.length] || 'https://uplcm.com/4/12169736');
        res.writeHead(302, { Location: targetUrl, 'Cache-Control': 'no-store' });
        res.end();
        return;
    }

    if (pathname === '/api/unlock/step' && req.method === 'POST') {
        try {
            const { session: sid } = await readJsonBody(req);
            const sess = unlockSessions.get(String(sid || '').trim());
            if (!sess || (Date.now() - sess.createdAt) > 30 * 60 * 1000) {
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, code: 'session_not_found', error: 'Session expired' }));
                return;
            }
            if (sess.complete) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    ok: true,
                    session: {
                        id: sess.id,
                        scriptId: sess.scriptId,
                        step: sess.step,
                        total: sess.total,
                        waitSeconds: sess.waitSeconds,
                        discordRequired: Boolean(sess.discordRequired),
                        discordDone: Boolean(sess.discordDone),
                        complete: true
                    }
                }));
                return;
            }
            if (!sess.stepStartedAt) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, code: 'step_not_started', error: 'Please open the sponsor link first' }));
                return;
            }
            const elapsedMs = Date.now() - sess.stepStartedAt;
            if (elapsedMs < (sess.waitSeconds - 1) * 1000) {
                const secondsLeft = Math.max(1, Math.ceil(((sess.waitSeconds * 1000) - elapsedMs) / 1000));
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, code: 'too_early', secondsLeft }));
                return;
            }
            let discordJustCompleted = false;
            const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
            if (sess.discordRequired && !sess.discordDone) {
                sess.discordDone = true;
                sess.stepStartedAt = 0;
                discordJustCompleted = true;
                const cfg = await getUnlockConfigLocal();
                const maxAge = Math.max(1, cfg.discordRememberDays || 30) * 86400;
                headers['Set-Cookie'] = `bs_discord_joined=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
            } else {
                sess.step += 1;
                sess.stepStartedAt = 0;
                sess.complete = sess.step >= sess.total;
            }
            unlockSessions.set(sess.id, sess);
            res.writeHead(200, headers);
            res.end(JSON.stringify({
                ok: true,
                discordJustCompleted,
                session: {
                    id: sess.id,
                    scriptId: sess.scriptId,
                    step: sess.step,
                    total: sess.total,
                    waitSeconds: sess.waitSeconds,
                    discordRequired: Boolean(sess.discordRequired),
                    discordDone: Boolean(sess.discordDone),
                    complete: sess.complete
                }
            }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
        }
        return;
    }

    if (pathname === '/api/unlock/reveal' && req.method === 'POST') {
        try {
            const { scriptId, session: sid, vipToken } = await readJsonBody(req);
            const scripts = await loadAllScriptsLocal();
            const found = scripts.find(s => String(s.id) === String(scriptId));
            if (!found) {
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Script not found' }));
                return;
            }
            if (vipToken) {
                const vr = verifyVipTokenLocal(vipToken);
                if (vr.valid && vr.payload?.canBypass === true) {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
                    res.end(JSON.stringify({ ok: true, code: found.loadstring || '', vip: true }));
                    return;
                }
            }
            const sess = unlockSessions.get(String(sid || '').trim());
            if (!sess || sess.scriptId !== String(found.id) || !sess.complete || (sess.discordRequired && !sess.discordDone)) {
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Unlock steps not completed' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify({ ok: true, code: found.loadstring || '', vip: false }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
        }
        return;
    }

    // =========================================================================
    // API: Scripts CRUD (SQLite Database)
    // =========================================================================
    if (pathname === '/api/scripts') {
        if (req.method === 'GET') {
            const scripts = db.getAllScripts();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(scripts));
            return;
        } else if (req.method === 'POST') {
            try {
                const newScript = await readJsonBody(req);
                if (!newScript.title || !newScript.loadstring) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Missing required fields (title, loadstring)' }));
                    return;
                }

                const saved = db.addScript(newScript);
                const all = db.getAllScripts();

                // Send Discord announcement asynchronously if configured
                if (typeof notifyNewScript === 'function') {
                    notifyNewScript(saved).catch(err => console.warn('[Server] Discord notify error:', err.message));
                }

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, script: saved, total: all.length }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Failed to add script', details: err.message }));
            }
            return;
        }
    }

    if (pathname === '/api/scripts/delete' && req.method === 'POST') {
        try {
            const { id } = await readJsonBody(req);
            if (!id) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Missing script id to delete' }));
                return;
            }

            const deleted = db.deleteScript(id);
            const remaining = db.getAllScripts();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, deleted, total: remaining.length }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Failed to delete script', details: err.message }));
        }
        return;
    }

    if (pathname === '/api/scripts/delete-multiple' && req.method === 'POST') {
        try {
            const { ids } = await readJsonBody(req);
            if (!Array.isArray(ids) || ids.length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Missing ids array to delete' }));
                return;
            }

            const count = db.deleteMultipleScripts(ids);
            const remaining = db.getAllScripts();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, deletedCount: count, total: remaining.length }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Failed to delete multiple scripts', details: err.message }));
        }
        return;
    }

    // API: Increment Script Views
    if (pathname === '/api/scripts/view' && req.method === 'POST') {
        try {
            const { id } = await readJsonBody(req);
            if (!id) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Missing script id' }));
                return;
            }
            db.incrementView(id);
            const script = db.getScriptById(id);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, id, views: script ? script.views : 0 }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Failed to increment view', details: err.message }));
        }
        return;
    }

    // API: Increment/Toggle Script Likes
    if (pathname === '/api/scripts/like' && req.method === 'POST') {
        try {
            const { id, delta } = await readJsonBody(req);
            if (!id) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Missing script id' }));
                return;
            }
            db.incrementLike(id, delta !== undefined ? delta : 1);
            const script = db.getScriptById(id);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, id, likes: script ? script.likes : 0 }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Failed to update like', details: err.message }));
        }
        return;
    }

    // API: Linkvertise Anti-Bypass Verify
    if (pathname === '/api/linkvertise/verify') {
        await executeServerless('./api/linkvertise-verify.js', req, res, parsedUrl);
        return;
    }

    // API: LootLabs Postback Webhook
    if (pathname === '/api/lootlabs-postback') {
        const query = parsedUrl.query || {};
        const clickId = (query.click_id || query.puid || query.session || '').trim();
        const ip = (query.ip || '').trim();
        const uniqueId = (query.unique_id || '').trim();

        if (!clickId) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Missing click_id parameter' }));
            return;
        }

        try {
            // Also sync to Firebase
            const fbUrl = `https://firestore.googleapis.com/v1/projects/blacklistscripts/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(clickId)}?key=AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI`;
            await fetch(fbUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        verified: { booleanValue: true },
                        ip: { stringValue: ip },
                        uniqueId: { stringValue: uniqueId },
                        verifiedAt: { stringValue: new Date().toISOString() }
                    }
                })
            }).catch(e => console.warn('[Server Postback] Firebase sync notice:', e.message));

            // Send Discord notification
            fetch('https://canary.discord.com/api/webhooks/1549026039294984232/M4fdAvl1SITFfzh2emyg0WBUGRDKhixswD3kqxPinKfdd-3W3G6koJ71mDxZn3PEApcQ', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'BlacklistScriptx Security',
                    avatar_url: 'https://blacklistscripty.vercel.app/Logo.ico',
                    embeds: [{
                        title: '🎉 ปลดล็อคผ่าน LootLabs สำเร็จ!',
                        description: 'มีผู้ใช้งานทำภารกิจสนับสนุนบน LootLabs เสร็จสิ้น และได้รับสิทธิ์เข้าใช้งานเว็บไซต์',
                        color: 0x22c55e,
                        fields: [
                            { name: '🆔 Conversion ID', value: `\`${uniqueId || 'N/A'}\``, inline: true },
                            { name: '🌐 IP เครื่อง', value: `\`${ip || 'Unknown'}\``, inline: true },
                            { name: '🔑 Session (PUID)', value: `\`${clickId || 'N/A'}\``, inline: false },
                            { name: '⏰ วันที่และเวลา', value: `${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} (เวลาไทย)`, inline: true },
                            { name: '⏳ ระยะเวลาจดจำ', value: '24 ชั่วโมง', inline: true }
                        ],
                        footer: { text: 'BlacklistScriptx • LootLabs Security Gate', icon_url: 'https://blacklistscripty.vercel.app/Logo.ico' },
                        timestamp: new Date().toISOString()
                    }]
                })
            }).catch(e => console.warn('[Server Postback] Discord notice:', e.message));

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, message: 'Postback verified', click_id: clickId }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // API: Check LootLabs Session Status
    if (pathname === '/api/check-session') {
        const query = parsedUrl.query || {};
        const puid = (query.puid || query.click_id || query.session || '').trim();

        if (!puid) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Missing puid parameter' }));
            return;
        }

        try {
            const fbUrl = `https://firestore.googleapis.com/v1/projects/blacklistscripts/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(puid)}?key=AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI`;
            const fbRes = await fetch(fbUrl);

            if (fbRes.status === 404) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ verified: false }));
                return;
            }

            const data = await fbRes.json();
            const isVerified = Boolean(data.fields && data.fields.verified && data.fields.verified.booleanValue);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ verified: isVerified, puid }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // API: Reset Device Test Status
    if (pathname === '/api/reset-device-test') {
        await executeServerless('./api/reset-device-test.js', req, res, parsedUrl);
        return;
    }

    // =========================================================================
    // API: Security, Bypass Logging, and Ban Controls
    // =========================================================================
    if (pathname === '/api/log-bypass') {
        await executeServerless('./api/log-bypass.js', req, res, parsedUrl);
        return;
    }

    if (pathname === '/api/admin-ban') {
        await executeServerless('./api/admin-ban.js', req, res, parsedUrl);
        return;
    }

    if (pathname === '/api/check-ban') {
        await executeServerless('./api/check-ban.js', req, res, parsedUrl);
        return;
    }

    if (pathname === '/api/banned-ips') {
        await executeServerless('./api/banned-ips.js', req, res, parsedUrl);
        return;
    }

    // =========================================================================
    // API: GET /api/latest-video (Auto-fetch latest YouTube video via RSS)
    // =========================================================================
    if (pathname === '/api/latest-video') {
        const rawCh = String(parsedUrl.query?.ch || parsedUrl.query?.channel || '@Blacklistxyx').trim();
        const cleanCh = rawCh.replace(/^@/, '').toLowerCase();
        const KNOWN_CHANNELS = {
            ghostsensix: 'UC8laKzbaWUNJMJ6XN_pxiBg',
            ghostsensi: 'UC8laKzbaWUNJMJ6XN_pxiBg',
            blacklistxyx: 'UCOAGxYeICyBbSjxJkul3HXA',
            blacklist: 'UCOAGxYeICyBbSjxJkul3HXA'
        };
        let channelId = KNOWN_CHANNELS[cleanCh] || '';
        if (!channelId && cleanCh) {
            try {
                const ytRes = await fetch(`https://www.youtube.com/@${encodeURIComponent(cleanCh)}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                const ytHtml = await ytRes.text();
                const m = ytHtml.match(/browseId":"(UC[a-zA-Z0-9_-]{22})"/);
                if (m && m[1]) channelId = m[1];
            } catch (e) {}
        }
        if (channelId) {
            try {
                const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (rssRes.ok) {
                    const rssXml = await rssRes.text();
                    const vMatch = rssXml.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/);
                    if (vMatch && vMatch[1]) {
                        const vid = vMatch[1];
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=180' });
                        res.end(JSON.stringify({ success: true, channel: cleanCh, channelId, videoId: vid, videoUrl: `https://www.youtube.com/watch?v=${vid}` }));
                        return;
                    }
                }
            } catch (e) {}
        }
        const cfg = await getUnlockConfigLocal();
        const fallbackUrl = cfg.entryTasks?.latestVideoUrl || `https://www.youtube.com/@${cleanCh || 'Blacklistxyx'}/videos`;
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, channel: cleanCh, videoUrl: fallbackUrl }));
        return;
    }

    // =========================================================================
    // API: GET /api/exploits (Proxy to WEAO Exploits API)
    // =========================================================================
    if (pathname === '/api/exploits') {
        const now = Date.now();
        if (exploitsCache.data && (now - exploitsCache.timestamp < 3 * 60 * 1000)) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(exploitsCache.data));
            return;
        }

        try {
            const resp = await fetch('https://weao.xyz/api/status/exploits', {
                headers: { 'User-Agent': 'WEAO-3PService' }
            });
            if (!resp.ok) throw new Error(`WEAO API responded with status ${resp.status}`);
            const data = await resp.json();
            exploitsCache = { data, timestamp: now };

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(data));
        } catch (err) {
            console.error('Error proxying /api/exploits:', err.message);
            if (exploitsCache.data) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(exploitsCache.data));
            } else {
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Failed to fetch from WEAO API', details: err.message }));
            }
        }
        return;
    }

    // =========================================================================
    // API: GET /api/sunc (Proxy to WEAO sUNC Data API)
    // =========================================================================
    if (pathname === '/api/sunc') {
        const scrap = parsedUrl.query.scrap;
        const key = parsedUrl.query.key;

        if (!scrap || !key) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Missing required query params: scrap and key' }));
            return;
        }

        const cacheKey = `${scrap}:${key}`;
        if (suncCache.has(cacheKey)) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(suncCache.get(cacheKey)));
            return;
        }

        try {
            const resp = await fetch(`https://weao.xyz/api/sunc?scrap=${encodeURIComponent(scrap)}&key=${encodeURIComponent(key)}`, {
                headers: { 'User-Agent': 'WEAO-3PService' }
            });
            if (!resp.ok) throw new Error(`WEAO sUNC API responded with status ${resp.status}`);
            const data = await resp.json();
            suncCache.set(cacheKey, data);

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(data));
        } catch (err) {
            console.error('Error proxying /api/sunc:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Failed to fetch sUNC data from WEAO', details: err.message }));
        }
        return;
    }

    // =========================================================================
    // API: GET /api/roblox-game (Roblox Game Info Auto-Fetch API)
    // =========================================================================
    if (pathname === '/api/roblox-game') {
        await executeServerless('./api/roblox-game.js', req, res, parsedUrl);
        return;
    }

    // =========================================================================
    // Static Files Handler
    // =========================================================================
    // ไฟล์เว็บอยู่ใน public/ ส่วน /data/* ยังอ่านจาก data/ ที่ root (db.js เขียนที่นั่น)
    const staticRoot = pathname.startsWith('/data/') ? __dirname : path.join(__dirname, 'public');
    let filePath = path.join(staticRoot, pathname === '/' ? 'index.html' : pathname);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`SQLite Database file: data/database.sqlite`);
    console.log(`Endpoints available:`);
    console.log(`- GET/POST /api/config`);
    console.log(`- GET/POST /api/scripts`);
    console.log(`- POST     /api/scripts/delete`);
    console.log(`- POST     /api/scripts/delete-multiple`);
    console.log(`- POST     /api/db/clear (Clear all scripts)`);
    console.log(`- POST     /api/db/reset (Reset default scripts)`);
    console.log(`- GET      /api/db/stats`);
    console.log(`- GET      /api/exploits`);
    console.log(`- GET      /api/sunc`);
    console.log(`- GET      /api/roblox-game`);
    console.log(`- GET      /api/health (Keep-alive endpoint)`);
});
