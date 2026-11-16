/**
 * Vercel & Node Serverless Function: POST /api/announce-discord
 * Broadcasts script updates to Discord channel 1571631708749561948 (#📜・update-script)
 * with role tag @Update (1571634981447663757) and interactive buttons
 */

const DEFAULT_TOKEN = Buffer.from('TVRVME9UTTVOVGt5TVRJeU9ESTNNVFk0TmcuR0gyZWpQLkEwc0xvQ2t6TXRVMkhkTG5WQkZ1YV9kazlxWDJ5RWZ6aGhvYjc0', 'base64').toString('utf8');
const BOT_TOKEN = process.env.DISCORD_TOKEN || DEFAULT_TOKEN;
const ANNOUNCE_CHANNEL_ID = process.env.DISCORD_SCRIPT_UPDATE_CHANNEL_ID || '1571631708749561948';
const UPDATE_ROLE_ID = process.env.DISCORD_SCRIPT_UPDATE_ROLE_ID || '1571634981447663757';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://th.blacklisthub.workers.dev';

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    try {
        let body = req.body;
        if (typeof body === "string") {
            try { body = JSON.parse(body); } catch (e) {}
        }

        const script = body.script || body;
        if (!script || !script.title) {
            return res.status(400).json({ error: "Script data is required (script.title)" });
        }

        const customNote = body.customNote || body.note || "";
        const title = script.title || "Roblox Script Update";
        const game = script.game || "Roblox";
        const category = script.category || game;
        const isKeyless = script.isKeyless !== false && script.isKeyless !== 0;
        const isMobile = script.isMobile !== false && script.isMobile !== 0;
        const isPC = script.isPC !== false && script.isPC !== 0;

        let deviceText = "📱 รองรับมือถือ & 💻 คอมพิวเตอร์";
        if (isMobile && !isPC) deviceText = "📱 รองรับมือถือ (Mobile Only)";
        if (!isMobile && isPC) deviceText = "💻 รองรับคอมพิวเตอร์ (PC Only)";

        const keyText = isKeyless ? "🟢 ไม่ต้องใช้คีย์ (Keyless)" : "🔑 มีระบบคีย์ (Key System)";
        const desc = script.description || `สคริปต์ ${game} อัปเดตใหม่ล่าสุด ใช้งานง่าย ปลอดภัย พร้อมใช้งานบนเว็บ BlacklistScriptX`;
        const scriptWebUrl = `${WEBSITE_URL}/?script=${encodeURIComponent(script.id || "")}`;

        let descContent = `🎮 **เกม:** \`${game}\`\n` +
                          `📌 **หมวดหมู่:** \`${category}\`\n` +
                          `⚡ **สถานะ:** 🟢 ใช้งานได้ปกติ (Working)\n` +
                          `🔑 **ระบบคีย์:** ${keyText}\n` +
                          `📱 **อุปกรณ์:** ${deviceText}\n`;

        if (customNote && customNote.trim()) {
            descContent += `\n💬 **โน้ตจากผู้พัฒนา:**\n> ${customNote.trim()}\n`;
        }

        descContent += `\n📝 **รายละเอียด:**\n${desc}`;

        let thumbUrl = script.thumbnail || script.thumbnail_en || "";
        if (!thumbUrl || (!thumbUrl.startsWith("http://") && !thumbUrl.startsWith("https://"))) {
            thumbUrl = "https://media.discordapp.net/attachments/1566173425238671370/1571438867276365954/d2e72ecdd63466351298fae29175ece7_1.gif";
        }

        const discordPayload = {
            content: `🔔 **แจ้งเตือนสคริปต์อัปเดตใหม่!** <@&${UPDATE_ROLE_ID}>`,
            embeds: [
                {
                    title: `🚀 [UPDATE] ${title}`,
                    url: scriptWebUrl,
                    color: 0x00f3ff,
                    description: descContent,
                    image: { url: thumbUrl },
                    footer: { text: "BlacklistScriptX • กดปุ่มด้านล่างเพื่อเปิดดูบนเว็บหรือรับยศ" },
                    timestamp: new Date().toISOString()
                }
            ],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 5, // Link Button
                            label: "🌐 เปิดดูบนเว็บ ScriptHub",
                            url: scriptWebUrl
                        },
                        {
                            type: 2, // Button
                            style: 1, // Primary (Blurple)
                            label: "🔔 รับยศแจ้งเตือนสคริปต์",
                            custom_id: "btn_toggle_update_role"
                        }
                    ]
                }
            ]
        };

        const discordUrl = `https://discord.com/api/v10/channels/${ANNOUNCE_CHANNEL_ID}/messages`;
        const response = await fetch(discordUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${BOT_TOKEN}`,
                "User-Agent": "DiscordBot (https://github.com/Orinn1/roblox-scripthub, 1.0)",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(discordPayload)
        });

        if (!response.ok) {
            const errData = await response.text();
            console.error("[api/announce-discord] Discord API error:", errData);
            return res.status(response.status).json({
                error: "Discord API returned error",
                details: errData
            });
        }

        const resData = await response.json();
        return res.status(200).json({
            success: true,
            messageId: resData.id,
            channelId: ANNOUNCE_CHANNEL_ID
        });

    } catch (err) {
        console.error("[api/announce-discord] Exception:", err);
        return res.status(500).json({ error: err.message });
    }
};

