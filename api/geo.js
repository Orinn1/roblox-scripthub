/**
 * Geo Country Detection Serverless Function
 * Used for automatic language detection (TH for Thailand, EN for foreigners)
 */

module.exports = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const country = req.headers["x-vercel-ip-country"] ||
                    req.headers["cf-ipcountry"] ||
                    req.headers["x-country-code"] ||
                    "";

    const forwarded = req.headers["x-forwarded-for"] || "";
    const ip = (forwarded.split(",")[0] || req.socket.remoteAddress || "").trim();

    return res.status(200).json({
        country: country.toUpperCase(),
        ip: ip
    });
};
