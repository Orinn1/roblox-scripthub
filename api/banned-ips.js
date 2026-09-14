/**
 * Vercel Serverless Function: GET/POST /api/banned-ips
 * Admin API to retrieve active banned IPs and perform manual bans
 */

const FIREBASE_PROJECT_ID = "blacklistscripts";
const FIREBASE_API_KEY = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI";
const ADMIN_TOKEN = "blacklist_vip";

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const query = req.query || {};
        let body = {};
        if (req.method === "POST") {
            try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
        }

        const token = (body.token || query.token || req.headers["x-admin-token"] || "").trim();
        if (token !== ADMIN_TOKEN) {
            return res.status(403).json({ error: "Unauthorized: Invalid admin token" });
        }

        let sqliteDb = null;
        try { sqliteDb = require("../db.js"); } catch (e) {}

        if (req.method === "GET") {
            const now = Date.now();
            let results = [];

            // 1. Try Firestore
            try {
                const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/banned_ips?key=${FIREBASE_API_KEY}`;
                const fbRes = await fetch(url);
                if (fbRes.ok) {
                    const data = await fbRes.json();
                    const docs = data.documents || [];
                    docs.forEach(doc => {
                        const fields = doc.fields || {};
                        const isActive = fields.active ? fields.active.booleanValue === true : true;
                        const bannedUntil = fields.bannedUntil ? Number(fields.bannedUntil.integerValue || fields.bannedUntil.stringValue) : 0;
                        if (isActive && bannedUntil && bannedUntil > now) {
                            results.push({
                                ip: fields.ip ? fields.ip.stringValue : doc.name.split("/").pop(),
                                bannedUntil,
                                remainingMs: bannedUntil - now,
                                durationHours: fields.durationHours ? Number(fields.durationHours.integerValue) : 24,
                                reason: fields.reason ? fields.reason.stringValue : "",
                                bannedAt: fields.bannedAt ? fields.bannedAt.stringValue : null
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn("[Banned IPs] Firestore query notice:", e.message);
            }

            // 2. Merge with SQLite if present
            if (sqliteDb && typeof sqliteDb.getBannedIps === "function") {
                try {
                    const localBans = sqliteDb.getBannedIps();
                    localBans.forEach(lb => {
                        if (!results.some(r => r.ip === lb.ip)) {
                            results.push(lb);
                        }
                    });
                } catch (e) {}
            }

            return res.status(200).json({ success: true, count: results.length, bans: results });
        }

        // POST: manual ban/unban from admin panel
        const ip = (body.ip || "").trim();
        const action = (body.action || "ban").toLowerCase().trim();
        const hours = Number(body.hours || 24);
        const reason = (body.reason || "สั่งระงับโดยผู้ดูแลระบบ").trim();

        if (!ip) {
            return res.status(400).json({ error: "Missing required ip" });
        }

        // Delegate to /api/admin-ban logic
        const adminBanHandler = require("./admin-ban.js");
        req.body = { token, ip, action, hours, reason };
        req.headers.accept = "application/json";
        return adminBanHandler(req, res);
    } catch (err) {
        console.error("[Banned IPs] Error:", err);
        return res.status(500).json({ error: err.message });
    }
};
