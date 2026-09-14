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

        // Extract client IP from headers
        const forwarded = req.headers["x-forwarded-for"] || "";
        const clientIp = (forwarded.split(",")[0] || req.socket.remoteAddress || "").trim();
        const cleanIp = clientIp.replace(/[^a-zA-Z0-9_]/g, "_");

        // 1. ตรวจสอบตาม puid ถ้ามี
        if (puid) {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(puid)}?key=${FIREBASE_API_KEY}`;
            const fbRes = await fetch(firestoreUrl).catch(() => null);
            if (fbRes && fbRes.ok) {
                const data = await fbRes.json();
                if (data.fields && data.fields.verified && data.fields.verified.booleanValue === true) {
                    return res.status(200).json({
                        verified: true,
                        puid: puid,
                        verifiedAt: data.fields.verifiedAt ? data.fields.verifiedAt.stringValue : null
                    });
                }
            }
        }

        // 2. ตรวจสอบสำรองตาม IP ของเครื่องผู้ใช้
        if (cleanIp) {
            const ipDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_ips/${cleanIp}?key=${FIREBASE_API_KEY}`;
            const ipRes = await fetch(ipDocUrl).catch(() => null);
            if (ipRes && ipRes.ok) {
                const data = await ipRes.json();
                if (data.fields && data.fields.verified && data.fields.verified.booleanValue === true) {
                    return res.status(200).json({
                        verified: true,
                        by: "ip",
                        ip: clientIp,
                        verifiedAt: data.fields.verifiedAt ? data.fields.verifiedAt.stringValue : null
                    });
                }
            }
        }

        return res.status(200).json({ verified: false, message: "Session not verified yet" });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error", details: err.message });
    }
};
