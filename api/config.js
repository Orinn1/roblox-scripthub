/**
 * Vercel & Node Serverless Function: GET/POST /api/config
 * Persists and retrieves site configuration from Firebase Firestore & local backup
 */

const fs = require('fs');
const path = require('path');

const FIREBASE_PROJECT_ID = "blacklistscripts";
const FIREBASE_API_KEY = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI";

function deepMerge(target, source) {
    if (!source || typeof source !== "object") return target;
    for (const key of Object.keys(source)) {
        if (key === "configJson") {
            if (typeof source[key] === "string") {
                try {
                    const unpacked = JSON.parse(source[key]);
                    deepMerge(target, unpacked);
                } catch (e) {}
            }
            continue;
        }
        const val = source[key];
        if (val && typeof val === "object" && !Array.isArray(val)) {
            if (!target[key] || typeof target[key] !== "object") {
                target[key] = {};
            }
            deepMerge(target[key], val);
        } else if (val !== undefined && val !== null) {
            target[key] = val;
        }
    }
    return target;
}

function getLocalConfigBackup() {
    try {
        const localPath = path.join(__dirname, '../data/config.json');
        if (fs.existsSync(localPath)) {
            return JSON.parse(fs.readFileSync(localPath, 'utf8'));
        }
    } catch (e) {}
    return null;
}

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/hub/config?key=${FIREBASE_API_KEY}`;

    if (req.method === "GET") {
        try {
            const fbRes = await fetch(firestoreUrl);
            if (fbRes.ok) {
                const data = await fbRes.json();
                if (data.fields && data.fields.configJson && data.fields.configJson.stringValue) {
                    const parsed = JSON.parse(data.fields.configJson.stringValue);
                    return res.status(200).json(parsed);
                }
            }
        } catch (e) {
            console.warn("[api/config] Failed to fetch from Firestore:", e.message);
        }

        // Fallback to local config file if Firestore fetch failed
        const localBackup = getLocalConfigBackup();
        if (localBackup) {
            return res.status(200).json(localBackup);
        }

        return res.status(200).json({
            lootlabsGate: {
                enabled: true,
                token: "blacklist_vip",
                lootlabsUrl: "https://loot-link.com/s?oSxvK7gj&data=Ie0PVBmn90rQrhCi8dVydrnOLIdR8byoGkbNlLEmHw1qavc1xhDTH/PaTy9MUFqh",
                expiryHours: 24,
                bypassMessage: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน LootLabs เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
            }
        });
    }

    if (req.method === "POST") {
        try {
            let body = req.body;
            if (typeof body === "string") {
                try { body = JSON.parse(body); } catch (e) {}
            }
            if (!body || typeof body !== "object") {
                return res.status(400).json({ error: "Invalid JSON body" });
            }

            // Fetch existing config first to deep merge
            let current = {};
            try {
                const getRes = await fetch(firestoreUrl);
                if (getRes.ok) {
                    const existingData = await getRes.json();
                    if (existingData.fields && existingData.fields.configJson && existingData.fields.configJson.stringValue) {
                        current = JSON.parse(existingData.fields.configJson.stringValue);
                    }
                }
            } catch (e) {}

            if (Object.keys(current).length === 0) {
                const localBackup = getLocalConfigBackup();
                if (localBackup) current = localBackup;
            }

            const merged = deepMerge({ ...current }, body);
            delete merged.configJson;

            const fbRes = await fetch(firestoreUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                    fields: {
                        configJson: { stringValue: JSON.stringify(merged) },
                        updatedAt: { stringValue: new Date().toISOString() }
                    }
                })
            });

            if (!fbRes.ok) {
                const errText = await fbRes.text();
                console.warn("[api/config] Failed to patch Firestore:", errText);
            }

            // Also update local data/config.json if running in Node environment
            try {
                const localPath = path.join(__dirname, '../data/config.json');
                fs.writeFileSync(localPath, JSON.stringify(merged, null, 2), 'utf8');
            } catch (e) {}

            return res.status(200).json({ success: true, config: merged });
        } catch (err) {
            console.error("[api/config] Error processing POST:", err);
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
