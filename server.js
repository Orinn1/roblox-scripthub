const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// SQLite Database Module
const db = require('./db.js');

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
    // API: Config (Site Name & Settings)
    // =========================================================================
    if (pathname === '/api/config') {
        if (req.method === 'GET') {
            const config = db.getConfig();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(config));
            return;
        } else if (req.method === 'POST') {
            try {
                const body = await readJsonBody(req);
                const updated = db.saveConfig(body);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, config: updated }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Invalid config payload', details: err.message }));
            }
            return;
        }
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
