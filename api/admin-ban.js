/**
 * Vercel Serverless Function & Web UI: /api/admin-ban
 * Handles ban/unban commands from Discord Link Buttons and Admin Dashboard
 * Persists bans to Firebase Firestore (global) and SQLite (local)
 */

const FIREBASE_PROJECT_ID = "blacklistscripts";
const FIREBASE_API_KEY = "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI";
const DEFAULT_WEBHOOK_URL = "https://canary.discord.com/api/webhooks/1549039337230827700/GcVrBLjVPyJjryy2bnZh8-MVdm7DCBcVaGMuzn7cq4mQepP_TnUeBrBRi0KR5JvG_a5s";
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
            try {
                body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
            } catch (e) {
                body = {};
            }
        }

        const token = (body.token || query.token || "").trim();
        const ip = (body.ip || query.ip || "").trim();
        const action = (body.action || query.action || "ban").toLowerCase().trim();
        const hoursParam = body.hours !== undefined ? body.hours : query.hours;
        const reason = (body.reason || query.reason || "ตรวจพบพฤติกรรมพยายาม Bypass ระบบความปลอดภัย").trim();

        // 1. Security check
        if (!token || token !== ADMIN_TOKEN) {
            if (req.headers.accept && req.headers.accept.includes("application/json")) {
                return res.status(403).json({ error: "Unauthorized: Invalid or missing admin token" });
            }
            return res.status(403).send(renderHtmlLayout("🚫 ไม่อนุญาตให้เข้าถึง", `
                <div class="card error-card">
                    <div class="icon-pulse error-icon">🔒</div>
                    <h2>ไม่มีสิทธิ์ดำเนินการ (403 Unauthorized)</h2>
                    <p>รหัส Admin Token ไม่ถูกต้องหรือไม่ได้รับอนุญาต</p>
                </div>
            `));
        }

        // 2. Validate IP
        if (!ip) {
            if (req.headers.accept && req.headers.accept.includes("application/json")) {
                return res.status(400).json({ error: "Missing required ip parameter" });
            }
            return res.status(400).send(renderHtmlLayout("⚠️ ข้อมูลไม่ครบถ้วน", `
                <div class="card error-card">
                    <h2>ไม่พบ IP ที่ต้องการดำเนินการ</h2>
                    <p>กรุณาระบุ IP Address ที่ถูกต้อง</p>
                </div>
            `));
        }

        const cleanIp = ip.replace(/[^a-zA-Z0-9_]/g, "_");
        const firestoreDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/banned_ips/${cleanIp}?key=${FIREBASE_API_KEY}`;
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

        // Try local SQLite if running in Node server environment
        let sqliteDb = null;
        try {
            sqliteDb = require("../db.js");
        } catch (e) {}

        // 3. Handle action = custom (Show interactive 1-24 hour slider page)
        if (action === "custom" && (hoursParam === undefined || hoursParam === "")) {
            return res.status(200).send(renderCustomBanPage({ ip, token, reason }));
        }

        // 4. Handle action = unban
        if (action === "unban" || hoursParam === "0" || Number(hoursParam) === 0) {
            // Delete / Deactivate from Firestore
            await fetch(firestoreDocUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fields: {
                        ip: { stringValue: ip },
                        active: { booleanValue: false },
                        unbannedAt: { stringValue: new Date().toISOString() }
                    }
                })
            }).catch(e => console.warn("[Admin Ban] Firestore unban warning:", e.message));

            if (sqliteDb && typeof sqliteDb.unbanIp === "function") {
                try { sqliteDb.unbanIp(ip); } catch (e) {}
            }

            // Send Discord Notice
            const thaiTime = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
            fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: "BlacklistScriptx Security Guard",
                    embeds: [{
                        title: "🔓 [ผู้ดูแลระบบ] ปลดบล็อกการเข้าใช้งานสำเร็จ!",
                        description: `ผู้ดูแลระบบได้สั่งปลดบล็อก IP ผู้ใช้ ให้สามารถกลับมาเข้าใช้งานเว็บไซต์ได้ตามปกติแล้ว`,
                        color: 0x22c55e, // Green
                        fields: [
                            { name: "🌐 IP เครื่อง", value: `\`${ip}\``, inline: true },
                            { name: "✅ สถานะ", value: "**ปลดบล็อคแล้ว (Active)**", inline: true },
                            { name: "⏰ เวลาดำเนินการ", value: `${thaiTime} (เวลาไทย)`, inline: false }
                        ],
                        footer: { text: "BlacklistScriptx Security Defense • จัดการโดยผู้ดูแลระบบ" },
                        timestamp: new Date().toISOString()
                    }]
                })
            }).catch(e => console.warn("[Admin Ban] Discord notice warning:", e.message));

            if (req.headers.accept && req.headers.accept.includes("application/json")) {
                return res.status(200).json({ success: true, action: "unban", ip });
            }

            return res.status(200).send(renderHtmlLayout("🔓 ปลดบล็อคสำเร็จ", `
                <div class="card success-card">
                    <div class="icon-pulse success-icon">✅</div>
                    <span class="badge badge-success">UNBANNED</span>
                    <h2>ปลดบล็อค IP เรียบร้อยแล้ว!</h2>
                    <p class="ip-display">IP: <code>${escapeHtml(ip)}</code></p>
                    <p class="desc">ผู้ใช้เครื่องนี้สามารถเข้าใช้งานเว็บไซต์ BlacklistScriptx ได้ตามปกติทันที</p>
                    <div class="actions-row">
                        <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&action=custom&token=${token}" class="btn btn-secondary">⚙️ สั่งบล็อกใหม่อีกครั้ง</a>
                        <a href="/admin.html" class="btn btn-primary">🛡️ ไปยังหน้าจัดการแอดมิน</a>
                    </div>
                </div>
            `));
        }

        // 5. Handle Ban Execution (Hours 1 - 24 or custom)
        const durationHours = Math.max(1, Math.min(720, Number(hoursParam) || 24));
        const now = Date.now();
        const bannedUntil = now + (durationHours * 3600 * 1000);
        const thaiTime = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
        const expireTime = new Date(bannedUntil).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

        // Save to Firestore
        const fbPayload = {
            fields: {
                ip: { stringValue: ip },
                bannedUntil: { integerValue: String(bannedUntil) },
                durationHours: { integerValue: String(durationHours) },
                bannedAt: { stringValue: new Date(now).toISOString() },
                reason: { stringValue: reason },
                active: { booleanValue: true }
            }
        };

        const fbRes = await fetch(firestoreDocUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fbPayload)
        });

        if (!fbRes.ok) {
            console.warn("[Admin Ban] Firestore save error:", await fbRes.text());
        }

        if (sqliteDb && typeof sqliteDb.banIp === "function") {
            try { sqliteDb.banIp(ip, durationHours, reason); } catch (e) {}
        }

        // Send Discord Confirmation Log
        fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "BlacklistScriptx Security Guard",
                embeds: [{
                    title: "🔨 [ผู้ดูแลระบบสั่งการ] บล็อก IP สำเร็จแล้ว!",
                    description: `คำสั่งบล็อกผู้ใช้จาก Discord ได้รับการประมวลผลเรียบร้อยแล้ว ผู้ใช้เครื่องนี้จะไม่สามารถเข้าเว็บได้จนกว่าจะหมดเวลา`,
                    color: 0xd97706, // Amber/Red
                    fields: [
                        { name: "🌐 IP เครื่องที่ถูกบล็อก", value: `\`${ip}\``, inline: true },
                        { name: "⏳ ระยะเวลาที่บล็อก", value: `**${durationHours} ชั่วโมง**`, inline: true },
                        { name: "⏰ ปลดบล็อกอัตโนมัติเมื่อ", value: `${expireTime} (เวลาไทย)`, inline: false },
                        { name: "⚠️ เหตุผล", value: `\`${reason}\``, inline: false },
                        { name: "🛡️ สถานะการบังคับใช้", value: "🔒 ล็อคหน้าจอแบบเรียลไทม์", inline: true }
                    ],
                    footer: { text: "BlacklistScriptx Security Defense • จัดการโดยผู้ดูแลระบบ" },
                    timestamp: new Date().toISOString()
                }]
            })
        }).catch(e => console.warn("[Admin Ban] Discord notice warning:", e.message));

        if (req.headers.accept && req.headers.accept.includes("application/json")) {
            return res.status(200).json({
                success: true,
                action: "ban",
                ip,
                durationHours,
                bannedUntil,
                expireTime,
                reason
            });
        }

        // Render sleek Admin Confirmation Web Page
        return res.status(200).send(renderHtmlLayout("🔨 บล็อก IP สำเร็จ", `
            <div class="card ban-success-card">
                <div class="icon-pulse danger-icon">🔒</div>
                <span class="badge badge-danger">BANNED (${durationHours} HOURS)</span>
                <h2>สั่งบล็อก IP เรียบร้อยแล้ว!</h2>
                
                <div class="info-table">
                    <div class="info-row">
                        <span class="info-label">🌐 IP เครื่อง:</span>
                        <span class="info-value"><code>${escapeHtml(ip)}</code></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">⏳ ระยะเวลา:</span>
                        <span class="info-value"><strong>${durationHours} ชั่วโมง</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">⏰ ปลดบล็อกเมื่อ:</span>
                        <span class="info-value text-accent">${expireTime}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">⚠️ สาเหตุ:</span>
                        <span class="info-value">${escapeHtml(reason)}</span>
                    </div>
                </div>

                <p class="desc" style="margin-top: 16px;">
                    หน้าเว็บของผู้ใช้เครื่องนี้จะถูกล็อคหน้าจอด้วย Modal แจ้งเตือนพร้อมเวลานับถอยหลังสด
                </p>

                <!-- Quick adjustment form -->
                <div class="quick-adjust">
                    <label>🔄 เปลี่ยนระยะเวลาการบล็อกเป็น:</label>
                    <div class="chips-grid">
                        <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&hours=1&token=${token}" class="chip">1 ชม.</a>
                        <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&hours=3&token=${token}" class="chip">3 ชม.</a>
                        <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&hours=6&token=${token}" class="chip">6 ชม.</a>
                        <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&hours=12&token=${token}" class="chip">12 ชม.</a>
                        <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&hours=24&token=${token}" class="chip">24 ชม.</a>
                        <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&action=custom&token=${token}" class="chip chip-custom">⚙️ กำหนดเอง (1-24)</a>
                    </div>
                </div>

                <div class="actions-row">
                    <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&action=unban&token=${token}" class="btn btn-unban">🔓 ปลดบล็อคทันที</a>
                    <a href="/admin.html" class="btn btn-primary">🛡️ ไปยังหน้าแอดมิน</a>
                </div>
            </div>
        `));
    } catch (err) {
        console.error("[Admin Ban] Error:", err);
        return res.status(500).send(renderHtmlLayout("❌ เกิดข้อผิดพลาด", `
            <div class="card error-card">
                <h2>เกิดข้อผิดพลาดในการประมวลผล</h2>
                <p>${escapeHtml(err.message)}</p>
            </div>
        `));
    }
};

function renderCustomBanPage({ ip, token, reason }) {
    return renderHtmlLayout("⚙️ เลือกระยะเวลาบล็อก IP (1-24 ชม.)", `
        <div class="card">
            <div class="icon-pulse warning-icon">⏱️</div>
            <span class="badge badge-warning">SELECT BAN DURATION</span>
            <h2>กำหนดระยะเวลาบล็อก IP</h2>
            <p class="ip-display">เป้าหมาย IP: <code>${escapeHtml(ip)}</code></p>
            
            <form action="/api/admin-ban" method="GET" class="ban-form">
                <input type="hidden" name="ip" value="${escapeHtml(ip)}">
                <input type="hidden" name="token" value="${escapeHtml(token)}">

                <div class="slider-box">
                    <div class="slider-header">
                        <span>ระยะเวลาที่ต้องการแบน:</span>
                        <span class="slider-val" id="valHoursDisplay">6 ชั่วโมง</span>
                    </div>
                    <input type="range" name="hours" id="hoursSlider" min="1" max="24" value="6" step="1" class="slider-input">
                    <div class="slider-ticks">
                        <span>1 ชม.</span>
                        <span>6 ชม.</span>
                        <span>12 ชม.</span>
                        <span>18 ชม.</span>
                        <span>24 ชม.</span>
                    </div>
                </div>

                <!-- Quick Presets -->
                <div class="chips-row">
                    <button type="button" class="preset-btn" onclick="setSlider(1)">1 ชม.</button>
                    <button type="button" class="preset-btn" onclick="setSlider(3)">3 ชม.</button>
                    <button type="button" class="preset-btn active" onclick="setSlider(6)">6 ชม.</button>
                    <button type="button" class="preset-btn" onclick="setSlider(12)">12 ชม.</button>
                    <button type="button" class="preset-btn" onclick="setSlider(18)">18 ชม.</button>
                    <button type="button" class="preset-btn" onclick="setSlider(24)">24 ชม.</button>
                </div>

                <div class="field-box">
                    <label>เหตุผลการบล็อก (แสดงให้ผู้ใช้เห็น):</label>
                    <input type="text" name="reason" value="${escapeHtml(reason)}" class="text-input" placeholder="ระบุเหตุผลการระงับสิทธิ์">
                </div>

                <div class="actions-row">
                    <button type="submit" class="btn btn-danger">🔨 ยืนยันการสั่งบล็อก IP</button>
                    <a href="/api/admin-ban?ip=${encodeURIComponent(ip)}&action=unban&token=${token}" class="btn btn-unban">🔓 ปลดบล็อค IP นี้</a>
                </div>
            </form>
        </div>
        <script>
            const slider = document.getElementById('hoursSlider');
            const display = document.getElementById('valHoursDisplay');
            const btns = document.querySelectorAll('.preset-btn');
            function updateDisplay(val) {
                display.textContent = val + ' ชั่วโมง';
                btns.forEach(b => {
                    b.classList.toggle('active', b.textContent.startsWith(val + ' '));
                });
            }
            if (slider) {
                slider.addEventListener('input', (e) => updateDisplay(e.target.value));
            }
            function setSlider(val) {
                if (slider) {
                    slider.value = val;
                    updateDisplay(val);
                }
            }
        </script>
    `);
}

function renderHtmlLayout(title, contentHtml) {
    return `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} - BlacklistScriptx Security</title>
    <link rel="icon" type="image/x-icon" href="/Logo.ico">
    <link rel="shortcut icon" type="image/x-icon" href="/Logo.ico">
    <link rel="apple-touch-icon" href="/Logo.ico">
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #07090e;
            --surface: #0f131c;
            --surface-border: rgba(148, 163, 184, 0.15);
            --primary: #8b5cf6;
            --danger: #ef4444;
            --success: #22c55e;
            --warning: #f59e0b;
            --text: #f1f5f9;
            --text-muted: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: var(--bg);
            background-image: 
                radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(239, 68, 68, 0.12) 0px, transparent 50%);
            color: var(--text);
            font-family: 'Prompt', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
        }
        .card {
            background: var(--surface);
            border: 1px solid var(--surface-border);
            border-radius: 20px;
            padding: 32px 28px;
            max-width: 520px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.1);
            position: relative;
            overflow: hidden;
        }
        .card::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, #ef4444, #8b5cf6, #3b82f6);
        }
        .icon-pulse {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }
        .danger-icon {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);
        }
        .success-icon {
            background: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.4);
            box-shadow: 0 0 25px rgba(34, 197, 94, 0.3);
        }
        .warning-icon {
            background: rgba(245, 158, 11, 0.15);
            border: 1px solid rgba(245, 158, 11, 0.4);
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.3);
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-success { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
        .badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        h2 { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
        p.desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; }
        .ip-display { margin-bottom: 20px; font-size: 14px; }
        code {
            background: #000;
            padding: 4px 10px;
            border-radius: 6px;
            color: #a78bfa;
            font-family: 'JetBrains Mono', monospace;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }
        .info-table {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 14px;
            margin: 18px 0;
            text-align: left;
            font-size: 13px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: var(--text-muted); }
        .info-value { font-weight: 500; }
        .text-accent { color: #f59e0b; font-weight: 600; }
        .quick-adjust {
            background: rgba(255, 255, 255, 0.02);
            border: 1px dashed rgba(148, 163, 184, 0.25);
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            text-align: left;
        }
        .quick-adjust label { font-size: 12px; color: #c084fc; font-weight: 600; display: block; margin-bottom: 10px; }
        .chips-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        .chip {
            background: #181d29;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #e2e8f0;
            padding: 8px 10px;
            border-radius: 8px;
            font-size: 12px;
            text-decoration: none;
            text-align: center;
            font-weight: 500;
            transition: all 0.2s;
        }
        .chip:hover {
            background: #23293a;
            border-color: #8b5cf6;
            color: #fff;
            transform: translateY(-1px);
        }
        .chip-custom {
            grid-column: span 3;
            background: rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.4);
            color: #c084fc;
        }
        .slider-box {
            background: #141824;
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 16px;
            margin: 18px 0;
            text-align: left;
        }
        .slider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
        }
        .slider-val {
            font-size: 18px;
            font-weight: 700;
            color: #38bdf8;
            background: rgba(56, 189, 248, 0.1);
            padding: 2px 10px;
            border-radius: 6px;
            border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .slider-input {
            width: 100%;
            height: 8px;
            border-radius: 4px;
            background: #23293d;
            outline: none;
            cursor: pointer;
            accent-color: #8b5cf6;
        }
        .slider-ticks {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 8px;
        }
        .chips-row {
            display: flex;
            gap: 6px;
            justify-content: center;
            margin-bottom: 18px;
            flex-wrap: wrap;
        }
        .preset-btn {
            background: #181d29;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-muted);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
        }
        .preset-btn.active, .preset-btn:hover {
            background: #7c3aed;
            color: #fff;
            border-color: #a78bfa;
        }
        .field-box {
            text-align: left;
            margin-bottom: 20px;
        }
        .field-box label {
            display: block;
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 6px;
        }
        .text-input {
            width: 100%;
            background: #141824;
            border: 1px solid var(--surface-border);
            color: #fff;
            padding: 10px 14px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 13px;
        }
        .text-input:focus {
            outline: none;
            border-color: #8b5cf6;
        }
        .actions-row {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        .btn {
            padding: 12px 20px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            font-family: inherit;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .btn-primary { background: #6d28d9; color: #fff; }
        .btn-primary:hover { background: #7c3aed; }
        .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); }
        .btn-secondary:hover { background: #334155; color: #fff; }
        .btn-danger { background: #dc2626; color: #fff; flex: 1; justify-content: center; }
        .btn-danger:hover { background: #ef4444; }
        .btn-unban { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
        .btn-unban:hover { background: rgba(34, 197, 94, 0.25); color: #fff; }

        @media (max-width: 480px) {
            body { padding: 14px 10px; }
            .card { padding: 22px 14px; border-radius: 16px; }
            h2 { font-size: 19px; }
            .chips-grid { grid-template-columns: repeat(2, 1fr); }
            .chip-custom { grid-column: span 2; }
            .chips-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            .preset-btn { width: 100%; text-align: center; }
            .actions-row { flex-direction: column; width: 100%; gap: 8px; }
            .btn { width: 100%; justify-content: center; }
        }
    </style>
</head>
<body>
    ${contentHtml}
</body>
</html>`;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
