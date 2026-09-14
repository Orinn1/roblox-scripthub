/**
 * Check LootLabs Session Verification Status
 * Queried by client browser to verify if their puid was confirmed via postback
 */

const FIREBASE_PROJECT_ID = "blacklistscripts";
const FIREBASE_API_KEY = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI";

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const query = req.query || {};
        const puid = (query.puid || query.click_id || query.session || "").trim();

        if (!puid) {
            return res.status(400).json({ error: "Missing puid parameter" });
        }

        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(puid)}?key=${FIREBASE_API_KEY}`;

        const fbRes = await fetch(firestoreUrl);
        if (fbRes.status === 404) {
            return res.status(200).json({ verified: false, message: "Session not verified yet" });
        }

        if (!fbRes.ok) {
            return res.status(500).json({ error: "Failed to query database" });
        }

        const data = await fbRes.json();
        const isVerified = Boolean(data.fields && data.fields.verified && data.fields.verified.booleanValue === true);

        return res.status(200).json({
            verified: isVerified,
            puid: puid,
            verifiedAt: data.fields && data.fields.verifiedAt ? data.fields.verifiedAt.stringValue : null
        });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error", details: err.message });
    }
};
