const fs = require('fs');
const path = require('path');
const botConfig = require('./config.js');

let localDb = null;
try {
    localDb = require('../db.js');
} catch (e) {
    // If running in isolated container without SQLite
}

let cachedScripts = [];
let lastFetchTime = 0;
const CACHE_TTL = 30 * 1000; // Cache 30 seconds

async function getScripts() {
    const now = Date.now();

    // 1. If we have local SQLite database and it has scripts, use it
    if (localDb && typeof localDb.getAllScripts === 'function') {
        try {
            const list = localDb.getAllScripts();
            if (list && list.length > 0) {
                return list;
            }
        } catch (e) {}
    }

    // 2. Check in-memory cache for remote fetch
    if (cachedScripts.length > 0 && (now - lastFetchTime) < CACHE_TTL) {
        return cachedScripts;
    }

    // 3. Try reading local data/scripts.json directly
    const jsonPath = path.join(__dirname, '..', 'data', 'scripts.json');
    if (fs.existsSync(jsonPath)) {
        try {
            const raw = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cachedScripts = parsed;
                lastFetchTime = now;
                return cachedScripts;
            }
        } catch (e) {}
    }

    // 4. Try fetching from Vercel / Remote Website URL if configured
    if (botConfig.websiteUrl && botConfig.websiteUrl.startsWith('http') && !botConfig.websiteUrl.includes('localhost')) {
        try {
            const targetUrl = botConfig.websiteUrl.replace(/\/$/, '') + '/data/scripts.json';
            const resp = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
            if (resp.ok) {
                const data = await resp.json();
                if (Array.isArray(data) && data.length > 0) {
                    cachedScripts = data;
                    lastFetchTime = now;
                    return cachedScripts;
                }
            }
        } catch (e) {
            console.warn('[ScriptsHelper] Failed to fetch scripts from remote website:', e.message);
        }
    }

    return cachedScripts;
}

module.exports = {
    getScripts
};
