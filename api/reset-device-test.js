/**
 * Reset Device Verification Status for Testing
 * Deletes or unsets verified status for caller's IP in Firestore
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
        const forwarded = req.headers["x-forwarded-for"] || "";
        const clientIp = (forwarded.split(",")[0] || req.socket.remoteAddress || "").trim();
        const cleanIp = clientIp.replace(/[^a-zA-Z0-9_]/g, "_");

        let deletedDoc = false;
        if (cleanIp) {
            const ipDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/lootlabs_ips/${cleanIp}?key=${FIREBASE_API_KEY}`;
            const fbRes = await fetch(ipDocUrl, { method: "DELETE" }).catch(() => null);
            if (fbRes && fbRes.ok) {
                deletedDoc = true;
            }
        }

        return res.status(200).json({
            success: true,
            message: "Cleared device IP memory from server database. Device is now locked and ready for fresh LootLabs testing.",
            clientIp: clientIp,
            cleared: deletedDoc
        });
    } catch (err) {
        return res.status(500).json({ error: "Failed to reset device status", details: err.message });
    }
};
