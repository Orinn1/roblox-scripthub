/**
 * Vercel & Node Serverless Function: GET/POST /api/linkvertise/verify
 * Verifies Linkvertise Anti-Bypass Hash with Linkvertise Publisher API
 */

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const hash = (req.query?.hash || req.body?.hash || "").trim();
    const token = "51fdfa2e4968abbf74a67de73fe63cefbe2cd2e1802bd67af651d4fa88aec7e7";

    if (!hash) {
        return res.status(400).json({ success: false, error: "Missing hash parameter" });
    }

    try {
        const lvRes = await fetch(`https://publisher.linkvertise.com/api/v1/anti_bypassing?token=${token}&hash=${encodeURIComponent(hash)}`, {
            method: "POST"
        });

        const resText = await lvRes.text();
        const isValid = resText.trim().toLowerCase() === "true";

        if (isValid) {
            return res.status(200).json({
                success: true,
                verified: true,
                message: "Linkvertise anti-bypass verification successful"
            });
        } else {
            return res.status(403).json({
                success: false,
                verified: false,
                error: "Hash expired (10s limit) or invalid bypass attempt",
                details: resText
            });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

