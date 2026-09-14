/**
 * Vercel Serverless Function: GET/POST /api/config
 * Persists and retrieves site configuration from Firebase Firestore
 */

const FIREBASE_PROJECT_ID = "blacklistscripts";
const FIREBASE_API_KEY = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI";

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
        } catch (e) {}

        return res.status(200).json({
            lootlabsGate: {
                enabled: true,
                token: "blacklist_vip",
                lootlabsUrl: "https://loot-link.com/s?oSxvK7gj&data=Ie0PVBmn90rQrhCi8dVydrnOLIdR8byoGkbNlLEmHw1qavc1xhDTH/PaTy9MUFqh",
                expiryHours: 24
            }
        });
    }

    if (req.method === "POST") {
        try {
            let body = req.body;
            if (typeof body === "string") {
                try { body = JSON.parse(body); } catch (e) {}
            }

            // Fetch existing config first to merge
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

            const merged = { ...current, ...body };

            const fbRes = await fetch(firestoreUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fields: {
                        configJson: { stringValue: JSON.stringify(merged) },
                        updatedAt: { stringValue: new Date().toISOString() }
                    }
                })
            });

            if (!fbRes.ok) {
                const errText = await fbRes.text();
                return res.status(500).json({ error: "Failed to persist to Firestore", details: errText });
            }

            return res.status(200).json({ success: true, config: merged });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
