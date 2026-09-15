require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// SQLite Database Module
const db = require('./db.js');

// Discord Bot Integration
let notifyNewScript = null;
try {
    const notifyModule = require('./bot/notify.js');
    notifyNewScript = notifyModule.notifyNewScript;
    if (process.env.DISCORD_TOKEN) {
        require('./bot/index.js');
    }
} catch (e) {
    // Bot module optional if dependencies are not loaded
}

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

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
                    avatar_url: 'https://blacklistscripty.vercel.app/Logo.png',
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
                        footer: { text: 'BlacklistScriptx • LootLabs Security Gate', icon_url: 'https://blacklistscripty.vercel.app/Logo.png' },
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
    // Static Files Handler
    // =========================================================================
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
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
});
