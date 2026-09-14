/**
 * LootLabs Server-to-Server Postback Webhook
 * Called by LootLabs.gg upon successful user task completion
 * Query parameters sent by LootLabs:
 *   - click_id: the puid passed in the original link
 *   - ip: visitor's IP address
 *   - unique_id: unique conversion identifier
 */

const FIREBASE_PROJECT_ID = "blacklistscripts";
const FIREBASE_API_KEY = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI";

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const query = req.query || {};
        const clickId = (query.click_id || query.puid || query.session || "").trim();
        const ip = (query.ip || "").trim();
        const uniqueId = (query.unique_id || "").trim();

        if (!clickId) {
            return res.status(400).json({ error: "Missing click_id parameter" });
        }

        // Store verified session in Firebase Firestore
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(clickId)}?key=${FIREBASE_API_KEY}`;
        
        const payload = {
            fields: {
                verified: { booleanValue: true },
                ip: { stringValue: ip },
                uniqueId: { stringValue: uniqueId },
                verifiedAt: { stringValue: new Date().toISOString() },
                timestamp: { integerValue: String(Date.now()) }
            }
        };

        const fbRes = await fetch(firestoreUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        // Also save by IP to allow IP-based instant verification
        if (ip) {
            const cleanIp = ip.replace(/[^a-zA-Z0-9_]/g, "_");
            const ipUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_ips/${cleanIp}?key=${FIREBASE_API_KEY}`;
            fetch(ipUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fields: {
                        verified: { booleanValue: true },
                        clickId: { stringValue: clickId },
                        timestamp: { integerValue: String(Date.now()) },
                        verifiedAt: { stringValue: new Date().toISOString() }
                    }
                })
            }).catch(e => console.warn("[Postback] IP save notice:", e.message));
        }

        if (!fbRes.ok) {
            const errText = await fbRes.text();
            console.error("[Postback] Firestore error:", errText);
            return res.status(500).json({ error: "Failed to persist verification", details: errText });
        }

        console.log(`[Postback] Verified session click_id: ${clickId} (IP: ${ip})`);
        return res.status(200).json({
            success: true,
            message: "LootLabs postback received and session verified",
            click_id: clickId
        });
    } catch (err) {
        console.error("[Postback] Error:", err);
        return res.status(500).json({ error: "Internal server error", details: err.message });
    }
};
