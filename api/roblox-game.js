/**
 * Vercel Serverless Function & Local Handler: GET /api/roblox-game
 * Fetches Roblox Place & Game details, high-res thumbnails, icons, and player counts.
 */

// In-memory cache for game info (TTL: 5 minutes)
const gameCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Extracts a numeric Place ID from a raw number, string, or Roblox game URL.
 * Examples:
 * - "2753915549" -> "2753915549"
 * - "https://www.roblox.com/games/2753915549/Blox-Fruits" -> "2753915549"
 * - "https://roblox.com/games/2753915549" -> "2753915549"
 */
function extractPlaceId(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Pure numeric string
    if (/^\d+$/.test(trimmed)) {
        return trimmed;
    }

    // Match /games/123456789 or /games/123456789/
    const urlMatch = trimmed.match(/\/games\/(\d+)/i);
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
    }

    // Match any sequence of 6+ digits if present in a URL or text
    const genericMatch = trimmed.match(/\b(\d{6,15})\b/);
    if (genericMatch && genericMatch[1]) {
        return genericMatch[1];
    }

    return null;
}

/**
 * Creates a clean category slug from a game title.
 * e.g., "[🧲] Blox Fruits" -> "bloxfruits"
 */
function generateCategorySlug(name) {
    if (!name) return 'roblox';
    // Remove brackets, emojis, and special chars
    const cleaned = name
        .replace(/\[[^\]]*\]/g, '') // remove [Update 20] etc.
        .replace(/\([^\)]*\)/g, '') // remove (Alpha) etc.
        .replace(/[^\w\s-]/g, '')   // remove non-alphanumeric
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');       // remove spaces
    return cleaned || 'roblox';
}

/**
 * Cleans bracketed tags and prefixes from official game names.
 */
function cleanGameName(name) {
    if (!name) return '';
    return name
        .replace(/^[\[\(\{][^\]\)\}]+[\]\)\}][\s:.-]*/g, '') // Remove starting bracket tag like [Update 24]
        .replace(/[\s:.-]*[\[\(\{][^\]\)\}]+[\]\)\}]$/g, '') // Remove ending bracket tag
        .trim() || name;
}

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        if (typeof res.status === 'function') return res.status(200).end();
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method !== 'GET') {
        const errObj = { error: 'Method not allowed. Use GET.' };
        if (typeof res.status === 'function') return res.status(405).json(errObj);
        res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(errObj));
        return;
    }

    const query = req.query || {};
    const rawInput = query.placeId || query.url || query.id || query.input || '';
    const placeId = extractPlaceId(rawInput);

    if (!placeId) {
        const errObj = {
            error: 'Missing or invalid placeId/url parameter.',
            hint: 'Provide a valid Place ID (e.g. 2753915549) or a Roblox game URL (e.g. https://www.roblox.com/games/2753915549/Blox-Fruits)'
        };
        if (typeof res.status === 'function') return res.status(400).json(errObj);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(errObj));
        return;
    }

    // Check Cache
    const now = Date.now();
    if (gameCache.has(placeId)) {
        const cached = gameCache.get(placeId);
        if (now - cached.timestamp < CACHE_TTL_MS) {
            const data = { ...cached.data, cached: true };
            if (typeof res.status === 'function') return res.status(200).json(data);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(data));
            return;
        }
        gameCache.delete(placeId);
    }

    try {
        // Step 1: Resolve Universe ID from Place ID
        const universeRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
            headers: { 'User-Agent': 'Roblox-ScriptHub-Service/1.0' },
            signal: AbortSignal.timeout(8000)
        });

        if (!universeRes.ok) {
            if (universeRes.status === 404) {
                throw new Error(`ไม่พบเกมจาก Place ID (${placeId}) บนเซิร์ฟเวอร์ Roblox`);
            }
            throw new Error(`Roblox Universe API ตอบกลับด้วยสถานะ ${universeRes.status}`);
        }

        const universeData = await universeRes.json();
        const universeId = universeData.universeId;

        if (!universeId) {
            throw new Error(`ไม่สามารถระบุ Universe ID สำหรับ Place ID ${placeId} ได้`);
        }

        // Step 2: Fetch Game Details, High-Res Thumbnails, and Icons concurrently
        const [gameDetailsRes, thumbnailRes, iconRes] = await Promise.all([
            fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
                headers: { 'User-Agent': 'Roblox-ScriptHub-Service/1.0' },
                signal: AbortSignal.timeout(8000)
            }).then(r => r.ok ? r.json() : null).catch(() => null),

            fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png`, {
                headers: { 'User-Agent': 'Roblox-ScriptHub-Service/1.0' },
                signal: AbortSignal.timeout(8000)
            }).then(r => r.ok ? r.json() : null).catch(() => null),

            fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`, {
                headers: { 'User-Agent': 'Roblox-ScriptHub-Service/1.0' },
                signal: AbortSignal.timeout(8000)
            }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        const game = gameDetailsRes && gameDetailsRes.data && gameDetailsRes.data[0];
        if (!game) {
            throw new Error(`ไม่พบรายละเอียดของเกม Universe ID ${universeId}`);
        }

        // Extract thumbnail and icon URLs
        let bannerThumbnail = '';
        if (thumbnailRes && thumbnailRes.data && thumbnailRes.data[0] && thumbnailRes.data[0].thumbnails && thumbnailRes.data[0].thumbnails[0]) {
            bannerThumbnail = thumbnailRes.data[0].thumbnails[0].imageUrl || '';
        }

        let squareIcon = '';
        if (iconRes && iconRes.data && iconRes.data[0]) {
            squareIcon = iconRes.data[0].imageUrl || '';
        }

        // Priority for primary thumbnail: high-res widescreen banner first, then icon
        const primaryThumbnail = bannerThumbnail || squareIcon || '';

        const rawName = game.name || 'Roblox Game';
        const cleanName = cleanGameName(rawName);
        const category = generateCategorySlug(cleanName);

        const result = {
            success: true,
            placeId: String(placeId),
            universeId: universeId,
            name: rawName,
            cleanName: cleanName,
            category: category,
            thumbnail: primaryThumbnail,
            bannerUrl: bannerThumbnail,
            iconUrl: squareIcon,
            playing: game.playing || 0,
            visits: game.visits || 0,
            maxPlayers: game.maxPlayers || 0,
            creator: {
                id: game.creator ? game.creator.id : null,
                name: game.creator ? game.creator.name : 'Unknown',
                type: game.creator ? game.creator.type : 'User',
                hasVerifiedBadge: Boolean(game.creator && game.creator.hasVerifiedBadge)
            },
            genre: game.genre || 'All',
            description: (game.description || '').slice(0, 500),
            fetchedAt: new Date().toISOString()
        };

        // Cache the successful result
        gameCache.set(placeId, {
            data: result,
            timestamp: now
        });

        if (typeof res.status === 'function') return res.status(200).json(result);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
    } catch (err) {
        console.error('[Roblox Game Fetch Error]:', err.message);
        const errPayload = {
            success: false,
            error: err.message || 'Failed to fetch Roblox game info',
            placeId
        };
        if (typeof res.status === 'function') return res.status(500).json(errPayload);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(errPayload));
    }
};
