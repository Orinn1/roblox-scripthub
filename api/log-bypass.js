/**
 * Vercel Serverless Function: POST/GET /api/log-bypass
 * Detects and logs bypass attempts, sending real-time Discord alerts with Action Ban Buttons
 */

const DEFAULT_WEBHOOK_URL = "https://canary.discord.com/api/webhooks/1549026039294984232/M4fdAvl1SITFfzh2emyg0WBUGRDKhixswD3kqxPinKfdd-3W3G6koJ71mDxZn3PEApcQ";
const ADMIN_TOKEN = "blacklist_vip";

// In-memory simple rate-limiting cache (per Lambda instance)
const recentLogs = new Map();

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const forwarded = req.headers["x-forwarded-for"] || "";
        const clientIp = (forwarded.split(",")[0] || req.socket.remoteAddress || "").trim() || "Unknown";

        let body = {};
        if (req.method === "POST") {
            try {
                body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
            } catch (e) {
                body = {};
            }
        }
        const query = req.query || {};

        const reason = (body.reason || query.reason || "พยายามหลบเลี่ยงระบบความปลอดภัย (Bypass Attempt)").trim();
        const referrer = (body.referrer || query.referrer || req.headers["referer"] || "Direct / None").trim();
        const details = (body.details || query.details || "").trim();
        const userAgent = (body.userAgent || req.headers["user-agent"] || "Unknown").trim();

        // Rate-limit alerts per IP (1 alert per 60 seconds to prevent webhook spam)
        const now = Date.now();
        const lastLog = recentLogs.get(clientIp);
        if (lastLog && now - lastLog < 60000) {
            return res.status(200).json({ success: true, rateLimited: true, message: "Rate limit active" });
        }
        recentLogs.set(clientIp, now);

        // Dynamically determine base URL (supports local dev, custom domain, and Vercel)
        let baseUrl = "https://blacklistscripty.vercel.app";
        const hostHeader = req.headers.host || "";
        if (hostHeader) {
            const proto = req.headers["x-forwarded-proto"] || (hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1") ? "http" : "https");
            baseUrl = `${proto}://${hostHeader}`;
        }

        const thaiTime = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

        const embed = {
            title: "🚨 ตรวจพบพฤติกรรมพยายาม Bypass เว็บไซต์!",
            description: `ระบบตรวจจับความปลอดภัยตรวจพบผู้ใช้พยายามข้ามระบบ LootLabs Security Gate\nคุณสามารถกดปุ่มด้านล่างเพื่อสั่ง **บล็อก IP นี้ทันที 1-24 ชั่วโมง**`,
            color: 0xef4444, // Red
            fields: [
                {
                    name: "🌐 IP เครื่องผู้กระทำ",
                    value: `\`${clientIp}\``,
                    inline: true
                },
                {
                    name: "⚠️ เหตุการณ์ที่ตรวจพบ",
                    value: `**${reason}**`,
                    inline: true
                },
                {
                    name: "⏰ เวลาตรวจพบ",
                    value: `${thaiTime} (เวลาไทย)`,
                    inline: true
                },
                {
                    name: "🔗 แหล่งที่มา (Referrer)",
                    value: `\`${referrer.substring(0, 120)}\``,
                    inline: false
                },
                {
                    name: "📱 อุปกรณ์ / เบราว์เซอร์",
                    value: `\`${userAgent.substring(0, 120)}\``,
                    inline: false
                },
                {
                    name: "🛡️ สถานะการป้องกัน",
                    value: "🔒 บล็อคหน้าจอเว็บไซต์ไว้แล้ว",
                    inline: true
                }
            ],
            footer: {
                text: "BlacklistScriptx Anti-Bypass Defense • กดปุ่มด้านล่างเพื่อแบน 1-24 ชม.",
                icon_url: `${baseUrl}/Logo.png`
            },
            timestamp: new Date().toISOString()
        };

        if (details) {
            embed.fields.push({
                name: "📝 รายละเอียดทางเทคนิค",
                value: `\`${details.substring(0, 200)}\``,
                inline: false
            });
        }

        // Action Link Buttons for Discord (Type 2, Style 5: Link)
        const components = [
            {
                type: 1, // Action Row 1: Fast ban choices
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: "🚫 บล็อค 1 ชม.",
                        url: `${baseUrl}/api/admin-ban?ip=${encodeURIComponent(clientIp)}&hours=1&token=${ADMIN_TOKEN}`
                    },
                    {
                        type: 2,
                        style: 5,
                        label: "🚫 บล็อค 6 ชม.",
                        url: `${baseUrl}/api/admin-ban?ip=${encodeURIComponent(clientIp)}&hours=6&token=${ADMIN_TOKEN}`
                    },
                    {
                        type: 2,
                        style: 5,
                        label: "🚫 บล็อค 12 ชม.",
                        url: `${baseUrl}/api/admin-ban?ip=${encodeURIComponent(clientIp)}&hours=12&token=${ADMIN_TOKEN}`
                    },
                    {
                        type: 2,
                        style: 5,
                        label: "🚫 บล็อค 24 ชม.",
                        url: `${baseUrl}/api/admin-ban?ip=${encodeURIComponent(clientIp)}&hours=24&token=${ADMIN_TOKEN}`
                    },
                    {
                        type: 2,
                        style: 5,
                        label: "⚙️ เลือก 1-24 ชม.",
                        url: `${baseUrl}/api/admin-ban?ip=${encodeURIComponent(clientIp)}&action=custom&token=${ADMIN_TOKEN}`
                    }
                ]
            },
            {
                type: 1, // Action Row 2: Management & Recovery
                components: [
                    {
                        type: 2,
                        style: 5,
                        label: "✅ ปลดบล็อคทันที",
                        url: `${baseUrl}/api/admin-ban?ip=${encodeURIComponent(clientIp)}&action=unban&token=${ADMIN_TOKEN}`
                    },
                    {
                        type: 2,
                        style: 5,
                        label: "🛡️ จัดการในแอดมิน",
                        url: `${baseUrl}/admin.html#bans`
                    }
                ]
            }
        ];

        const webhookUrl = process.env.DISCORD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "BlacklistScriptx Security Guard",
                avatar_url: `${baseUrl}/Logo.png`,
                embeds: [embed],
                components: components
            })
        });

        return res.status(200).json({ success: true, message: "Bypass attempt logged to Discord with action buttons" });
    } catch (err) {
        console.error("[Log Bypass] Error:", err);
        return res.status(500).json({ error: err.message });
    }
};
