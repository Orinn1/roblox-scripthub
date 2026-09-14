/**
 * Vercel Serverless Function: GET/POST /api/check-ban
 * Checks if the current visitor's IP is banned from accessing the website
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

    try {
        const query = req.query || {};
        const forwarded = req.headers["x-forwarded-for"] || "";
        const clientIp = (query.ip || forwarded.split(",")[0] || req.socket.remoteAddress || "").trim();

        if (!clientIp) {
            return res.status(200).json({ banned: false });
        }

        const now = Date.now();

        // 1. Check local SQLite DB first if available (faster for local node instances)
        try {
            const db = require("../db.js");
            if (db && typeof db.isIpBanned === "function") {
                const check = db.isIpBanned(clientIp);
                if (check && check.banned) {
                    return res.status(200).json(check);
                }
            }
        } catch (e) {}

        // 2. Check Firebase Firestore (Universal / Global source of truth)
        const cleanIp = clientIp.replace(/[^a-zA-Z0-9_]/g, "_");
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/banned_ips/${cleanIp}?key=${FIREBASE_API_KEY}`;
        const fbRes = await fetch(firestoreUrl).catch(() => null);

        if (fbRes && fbRes.ok) {
            const data = await fbRes.json();
            const fields = data.fields || {};

            const isActive = fields.active ? fields.active.booleanValue === true : true;
            const bannedUntil = fields.bannedUntil ? Number(fields.bannedUntil.integerValue || fields.bannedUntil.stringValue) : 0;
            const durationHours = fields.durationHours ? Number(fields.durationHours.integerValue || fields.durationHours.stringValue) : 24;
            const reason = fields.reason ? fields.reason.stringValue : "ตรวจพบพฤติกรรมพยายาม Bypass ระบบความปลอดภัย";

            if (isActive && bannedUntil && now < bannedUntil) {
                return res.status(200).json({
                    banned: true,
                    ip: clientIp,
                    bannedUntil,
                    remainingMs: bannedUntil - now,
                    durationHours,
                    reason,
                    bannedAt: fields.bannedAt ? fields.bannedAt.stringValue : null
                });
            }
        }

        return res.status(200).json({ banned: false, ip: clientIp });
    } catch (err) {
        console.error("[Check Ban] Error:", err);
        return res.status(500).json({ error: "Failed to check ban status", details: err.message });
    }
};
