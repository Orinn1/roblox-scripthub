/**
 * ShrinkEarn API Helper & Shortener Serverless Function
 * Calls ShrinkEarn Developers API to generate shortened monetization links automatically
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_API_TOKEN = "3ce8c70d0c1e31404164f66164ea8f9117b29b69";

function getConfigToken() {
    try {
        const configPath = path.join(__dirname, '../data/config.json');
        if (fs.existsSync(configPath)) {
            const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (cfg.lootlabsGate && cfg.lootlabsGate.shrinkearnApiToken) {
                return cfg.lootlabsGate.shrinkearnApiToken.trim();
            }
        }
    } catch (e) {}
    return DEFAULT_API_TOKEN;
}

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const query = req.query || {};
        const body = req.body || {};

        const targetUrl = (body.url || query.url || "").trim();
        const apiToken = (body.apiToken || query.apiToken || getConfigToken()).trim();

        if (!targetUrl) {
            return res.status(400).json({ error: "Missing required 'url' parameter" });
        }

        const shrinkearnApiUrl = `https://shrinkearn.com/api?api=${encodeURIComponent(apiToken)}&url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(shrinkearnApiUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null);

        if (!response || !response.ok) {
            // Fallback to Quick Link format if API has temporary timeout
            const quickLink = `https://shrinkearn.com/st?api=${encodeURIComponent(apiToken)}&url=${encodeURIComponent(targetUrl)}`;
            return res.status(200).json({
                success: true,
                shortenedUrl: quickLink,
                fallback: true
            });
        }

        const data = await response.json().catch(() => null);

        if (data && data.status === "success" && data.shortenedUrl) {
            return res.status(200).json({
                success: true,
                shortenedUrl: data.shortenedUrl
            });
        } else {
            // Fallback to Quick Link format
            const quickLink = `https://shrinkearn.com/st?api=${encodeURIComponent(apiToken)}&url=${encodeURIComponent(targetUrl)}`;
            return res.status(200).json({
                success: true,
                shortenedUrl: quickLink,
                fallback: true,
                rawError: data ? data.message : "Unknown API response"
            });
        }
    } catch (err) {
        return res.status(500).json({ error: "Internal server error", details: err.message });
    }
};
