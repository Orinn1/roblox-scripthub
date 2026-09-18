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

        if (!clickId || !clickId.startsWith("ll_") || clickId.length < 15) {
            return res.status(400).json({ error: "Invalid click_id format" });
        }

        if (!uniqueId || !/^\d{8,}$/.test(uniqueId)) {
            return res.status(400).json({ error: "Invalid conversion token" });
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

        // Send notification to Discord Webhook
        await sendDiscordLog({ clickId, ip, uniqueId });

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

const DISCORD_WEBHOOK_URL = "https://canary.discord.com/api/webhooks/1549026039294984232/M4fdAvl1SITFfzh2emyg0WBUGRDKhixswD3kqxPinKfdd-3W3G6koJ71mDxZn3PEApcQ";

async function sendDiscordLog({ clickId, ip, uniqueId }) {
    try {
        const thaiTime = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
        const embed = {
            title: "🎉 ปลดล็อคผ่าน LootLabs สำเร็จ!",
            description: "มีผู้ใช้งานทำภารกิจสนับสนุนบน LootLabs เสร็จสิ้น และได้รับสิทธิ์เข้าใช้งานเว็บไซต์",
            color: 0x22c55e, // Emerald Green
            fields: [
                {
                    name: "🆔 Conversion ID",
                    value: `\`${uniqueId || "N/A"}\``,
                    inline: true
                },
                {
                    name: "🌐 IP เครื่อง",
                    value: `\`${ip || "Unknown"}\``,
                    inline: true
                },
                {
                    name: "🔑 Session (PUID)",
                    value: `\`${clickId || "N/A"}\``,
                    inline: false
                },
                {
                    name: "⏰ วันที่และเวลา",
                    value: `${thaiTime} (เวลาไทย)`,
                    inline: true
                },
                {
                    name: "⏳ ระยะเวลาจดจำ",
                    value: "24 ชั่วโมง",
                    inline: true
                }
            ],
            footer: {
                text: "BlacklistScriptx • LootLabs Security Gate",
                icon_url: "https://blacklistscripty.vercel.app/Logo.ico"
            },
            timestamp: new Date().toISOString()
        };

        const webhookUrl = process.env.DISCORD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "BlacklistScriptx Gatekeeper",
                avatar_url: "https://blacklistscripty.vercel.app/Logo.ico",
                embeds: [embed]
            })
        });
    } catch (err) {
        console.warn("[Postback] Discord webhook notice:", err.message);
    }
}
