const fs = require('fs');
const path = require('path');
const botConfig = require('./config.js');

let localDb = null;
try {
    localDb = require('../db.js');
} catch (e) {
    // If running in isolated container without SQLite
}

// Firebase Firestore Configuration
let firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'blacklistscripts';
let firebaseApiKey = process.env.FIREBASE_API_KEY || 'AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI';

try {
    const cfgPath = path.join(__dirname, '..', 'data', 'config.json');
    if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        if (cfg && cfg.firebaseConfig) {
            if (cfg.firebaseConfig.projectId) firebaseProjectId = cfg.firebaseConfig.projectId;
            if (cfg.firebaseConfig.apiKey) firebaseApiKey = cfg.firebaseConfig.apiKey;
        }
    }
} catch (e) {}

let cachedScripts = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // Cache for 5 minutes (reduced from 30s to prevent 429 quota exhaustion)
let syncListeners = [];
let firestoreCooldownUntil = 0;
let hasLogged429 = false;

// Preload cached scripts from local storage on startup
try {
    const jsonPath = path.join(__dirname, '..', 'data', 'scripts.json');
    if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            cachedScripts = parsed;
        }
    }
} catch (e) {}

/**
 * Fetch scripts directly from Google Firebase Firestore REST API
 */
async function fetchFromFirestore() {
    // If we are currently in 429 cooldown, do not query Firestore
    if (Date.now() < firestoreCooldownUntil) {
        return null;
    }

    try {
        const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/hub/database?key=${firebaseApiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
            if (res.status === 429) {
                // Rate limited / Quota exhausted -> Cooldown 10 minutes
                firestoreCooldownUntil = Date.now() + 10 * 60 * 1000;
                if (!hasLogged429) {
                    console.warn(`[ScriptsHelper] ⚠️ Firestore Status 429 (Too Many Requests / โควต้าเต็มชั่วคราว) -> พักการเชื่อมต่อ 10 นาที และใช้ข้อมูลแคชแทน`);
                    hasLogged429 = true;
                    setTimeout(() => { hasLogged429 = false; }, 10 * 60 * 1000);
                }
            } else {
                console.warn(`[ScriptsHelper] Firestore returned status ${res.status}`);
            }
            return null;
        }

        const data = await res.json();
        let list = null;

        if (data.fields && data.fields.scriptsJson && data.fields.scriptsJson.stringValue) {
            try {
                list = JSON.parse(data.fields.scriptsJson.stringValue);
            } catch (e) {
                console.warn('[ScriptsHelper] JSON parse error in scriptsJson:', e.message);
            }
        }

        if (Array.isArray(list) && list.length > 0) {
            return list;
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.warn('[ScriptsHelper] Failed to fetch scripts from Firebase Firestore:', err.message);
        }
    }
    return null;
}

/**
 * Persist scripts to local SQLite database and JSON files for offline resilience
 */
function syncToLocal(scripts) {
    if (!Array.isArray(scripts) || scripts.length === 0) return;

    // 1. Sync to local data/scripts.json
    try {
        const jsonDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
        const jsonPath = path.join(jsonDir, 'scripts.json');
        fs.writeFileSync(jsonPath, JSON.stringify(scripts, null, 2), 'utf8');
    } catch (e) {}

    // 2. Sync to public/data/scripts.json if public directory exists
    try {
        const publicDir = path.join(__dirname, '..', 'public', 'data');
        if (fs.existsSync(publicDir)) {
            const publicPath = path.join(publicDir, 'scripts.json');
            fs.writeFileSync(publicPath, JSON.stringify(scripts, null, 2), 'utf8');
        }
    } catch (e) {}

    // 3. Upsert into SQLite database
    if (localDb && typeof localDb.addScript === 'function') {
        try {
            for (const s of scripts) {
                localDb.addScript(s);
            }
        } catch (e) {
            console.warn('[ScriptsHelper] Failed to upsert to local SQLite:', e.message);
        }
    }
}

/**
 * Get all scripts - Always prioritize live Firebase Firestore with smart TTL cache
 * @param {boolean} forceRefresh - Bypass TTL cache and force fetch from Firestore
 */
async function getScripts(forceRefresh = false) {
    const now = Date.now();

    // 1. If cache is fresh and not forced, return immediately (< 1ms)
    if (!forceRefresh && cachedScripts.length > 0 && (now - lastFetchTime) < CACHE_TTL) {
        return cachedScripts;
    }

    // 2. Fetch live data from Firebase Firestore
    const remoteScripts = await fetchFromFirestore();
    if (remoteScripts && remoteScripts.length > 0) {
        const isNewCount = cachedScripts.length !== remoteScripts.length;
        cachedScripts = remoteScripts;
        lastFetchTime = now;
        syncToLocal(remoteScripts);

        if (isNewCount) {
            syncListeners.forEach(cb => {
                try { cb(cachedScripts); } catch (e) {}
            });
        }
        return cachedScripts;
    }

    // Set lastFetchTime so we don't immediately retry every millisecond if Firestore is down/throttled
    lastFetchTime = now;

    // 3. Fallback: If we already have memory cache (even if expired), use it
    if (cachedScripts.length > 0) {
        return cachedScripts;
    }

    // 4. Fallback: Read from local SQLite
    if (localDb && typeof localDb.getAllScripts === 'function') {
        try {
            const list = localDb.getAllScripts();
            if (Array.isArray(list) && list.length > 0) {
                cachedScripts = list;
                lastFetchTime = now;
                return cachedScripts;
            }
        } catch (e) {}
    }

    // 5. Fallback: Read from local data/scripts.json
    try {
        const jsonPath = path.join(__dirname, '..', 'data', 'scripts.json');
        if (fs.existsSync(jsonPath)) {
            const raw = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cachedScripts = parsed;
                lastFetchTime = now;
                return cachedScripts;
            }
        }
    } catch (e) {}

    return cachedScripts;
}

/**
 * Get a specific script by ID or fuzzy title/game
 */
async function getScriptById(idOrQuery) {
    if (!idOrQuery) return null;
    const scripts = await getScripts();
    const strQuery = String(idOrQuery).trim();

    // Exact ID match
    let found = scripts.find(s => String(s.id) === strQuery);
    if (found) return found;

    // Fuzzy title or game match
    const lower = strQuery.toLowerCase();
    found = scripts.find(s => 
        (s.title && s.title.toLowerCase().includes(lower)) ||
        (s.game && s.game.toLowerCase().includes(lower))
    );
    return found || null;
}

/**
 * Force refresh scripts from Firestore immediately
 */
async function forceSyncScripts() {
    return await getScripts(true);
}

/**
 * Subscribe to sync updates
 */
function onScriptsSynced(callback) {
    if (typeof callback === 'function') {
        syncListeners.push(callback);
    }
}

// Background auto-refresh loop (every 5 minutes instead of 30 seconds)
const autoRefreshTimer = setInterval(async () => {
    try {
        if (Date.now() >= firestoreCooldownUntil) {
            await forceSyncScripts();
        }
    } catch (e) {}
}, 5 * 60 * 1000);
if (autoRefreshTimer && typeof autoRefreshTimer.unref === 'function') {
    autoRefreshTimer.unref();
}

// Initial prime on boot
const initialPrimeTimer = setTimeout(() => {
    forceSyncScripts().then(list => {
        console.log(`[ScriptsHelper] 🔥 Synced ${list.length} scripts from Firebase Firestore`);
    }).catch(() => {});
}, 1000);
if (initialPrimeTimer && typeof initialPrimeTimer.unref === 'function') {
    initialPrimeTimer.unref();
}

module.exports = {
    getScripts,
    getScriptById,
    forceSyncScripts,
    onScriptsSynced
};
