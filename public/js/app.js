/**
 * BlacklistScriptx App Logic
 * Layout: Dashboard with Home, Feed, & Exploits / sUNC Views
 * Features: Dynamic Site Name, Script Sync, Sub2Unlock Locker, WEAO API Live Exploits & sUNC Data
 * Icons: Lucide Vector Icons (Strictly No Emojis)
 */

document.addEventListener("DOMContentLoaded", () => {
    let scripts = getScriptsData();

    // App State
    let currentView = "home";
    let activeFilter = "all";
    let activeGame = null;
    let searchQuery = "";
    let selectedScript = null;

    // Exploits & sUNC State
    let allExploits = [];
    let activeExploitPlatform = "all";
    let currentSuncData = null;
    let currentSuncFilter = "";

    // Task State for Locker
    let tasks = { t1: false, t2: false, t3: false };
    let currentTaskTimer = null;

    // Views
    const homeView = document.getElementById("homeView");
    const feedView = document.getElementById("feedView");
    const exploitsView = document.getElementById("exploitsView");

    // Feeds & Grids
    const scriptsFeed = document.getElementById("scriptsFeed");
    const homeRecentScripts = document.getElementById("homeRecentScripts");
    const homeExecutorsGrid = document.getElementById("homeExecutorsGrid");
    const exploitsGrid = document.getElementById("exploitsGrid");

    // Controls & Toolbars
    const globalSearch = document.getElementById("globalSearch");
    const currentViewTitle = document.getElementById("currentViewTitle");
    const currentViewDesc = document.getElementById("currentViewDesc");
    const totalCount = document.getElementById("totalCount");
    const exploitPlatformFilter = document.getElementById("exploitPlatformFilter");

    const mainMenu = document.getElementById("mainMenu");
    const gameMenu = document.getElementById("gameMenu");
    const filterChips = document.querySelector(".view-filter-chips");
    const trendingGamesGrid = document.getElementById("trendingGamesGrid");
    const brandLogo = document.getElementById("brandLogo");
    const brandTitleText = document.getElementById("brandTitleText");

    // Mobile Navigation Elements
    const appSidebar = document.getElementById("appSidebar");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const mobileBottomNav = document.getElementById("mobileBottomNav");
    const bottomNavMenuBtn = document.getElementById("bottomNavMenuBtn");
    const mobileBrandTitle = document.getElementById("mobileBrandTitle");

    // Buttons
    const btnGoFeedAll = document.getElementById("btnGoFeedAll");
    const btnSeeAllGames = document.getElementById("btnSeeAllGames");
    const btnSeeAllScripts = document.getElementById("btnSeeAllScripts");
    const btnSeeAllExploits = document.getElementById("btnSeeAllExploits");

    // Sub2Unlock Modal Elements
    const lockerModal = document.getElementById("lockerModal");
    const closeLockerBtn = document.getElementById("closeLockerBtn");
    const tasksStack = document.getElementById("tasksStack");
    const lockedLabel = document.getElementById("lockedLabel");
    const unlockedView = document.getElementById("unlockedView");
    const scriptCodeBox = document.getElementById("scriptCodeBox");
    const btnCopyScript = document.getElementById("btnCopyScript");

    const task1Btn = document.getElementById("task1Btn");
    const task2Btn = document.getElementById("task2Btn");
    const task3Btn = document.getElementById("task3Btn");

    const dot1 = document.getElementById("dot1");
    const dot2 = document.getElementById("dot2");
    const dot3 = document.getElementById("dot3");

    // sUNC Modal Elements
    const suncModal = document.getElementById("suncModal");
    const closeSuncModalBtn = document.getElementById("closeSuncModalBtn");
    const suncModalTitle = document.getElementById("suncModalTitle");
    const suncVersion = document.getElementById("suncVersion");
    const suncTime = document.getElementById("suncTime");
    const suncPassedCount = document.getElementById("suncPassedCount");
    const suncFailedCount = document.getElementById("suncFailedCount");
    const searchSuncFunc = document.getElementById("searchSuncFunc");
    const suncTestList = document.getElementById("suncTestList");

    const toastBar = document.getElementById("toastBar");

    // LootLabs Gate Elements
    const lootlabsGateOverlay = document.getElementById("lootlabsGateOverlay");
    const gateMessageText = document.getElementById("gateMessageText");
    const gateLootlabsBtn = document.getElementById("gateLootlabsBtn");
    const gateAutoDetectBox = document.getElementById("gateAutoDetectBox");
    const gateAutoDetectText = document.getElementById("gateAutoDetectText");
    const gateCheckStatusBtn = document.getElementById("gateCheckStatusBtn");
    const gateTokenInput = document.getElementById("gateTokenInput");
    const gateTokenSubmitBtn = document.getElementById("gateTokenSubmitBtn");
    const gateErrorMsg = document.getElementById("gateErrorMsg");

    // Banned Screen Overlay Elements
    const bannedScreenOverlay = document.getElementById("bannedScreenOverlay");
    const bannedReasonText = document.getElementById("bannedReasonText");
    const bannedHours = document.getElementById("bannedHours");
    const bannedMinutes = document.getElementById("bannedMinutes");
    const bannedSeconds = document.getElementById("bannedSeconds");
    const bannedClientIp = document.getElementById("bannedClientIp");
    const bannedDurationText = document.getElementById("bannedDurationText");
    const bannedExpireTimeText = document.getElementById("bannedExpireTimeText");
    let bannedCountdownInterval = null;
    let isCurrentlyBanned = false;

    // Social Links
    const sideYtBtn = document.getElementById("sideYtBtn");
    const sideDcBtn = document.getElementById("sideDcBtn");

    // Helper: Refresh Lucide Icons
    function refreshIcons() {
        if (window.lucide && window.lucide.icons && !window.lucide.icons.Youtube) {
            window.lucide.icons.Youtube = [
                ["path", { "d": "M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" }],
                ["path", { "d": "m10 15 5-3-5-3z" }]
            ];
        }
        if (window.lucide && typeof lucide.createIcons === "function") {
            lucide.createIcons();
        }
    }

    // Helper: Escape HTML strings
    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // =========================================================================
    // Dynamic Site Config & Category Badge Counters
    // =========================================================================
    function applySiteConfig() {
        if (SITE_CONFIG.siteName) {
            document.title = `${SITE_CONFIG.siteName} - Roblox Script Hub & Exploit Status`;
        }
        const p = SITE_CONFIG.brandPrefix || "Rocket";
        const s = SITE_CONFIG.brandSuffix || "Scriptz";
        if (brandTitleText) {
            brandTitleText.innerHTML = `${escapeHtml(p)}<span>${escapeHtml(s)}</span>`;
        }
        if (mobileBrandTitle) {
            mobileBrandTitle.innerHTML = `${escapeHtml(p)}<span>${escapeHtml(s)}</span>`;
        }
        if (sideYtBtn) {
            let yt = (SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.youtube) || "https://www.youtube.com/@Blacklistxyx";
            if (yt.includes("YOUR_CHANNEL")) yt = "https://www.youtube.com/@Blacklistxyx";
            sideYtBtn.href = yt;
        }
        if (sideDcBtn && SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.discord) {
            sideDcBtn.href = SITE_CONFIG.socialLinks.discord;
        }
    }

    // Helper: สร้างหรือดึง Device PUID สำหรับส่งให้ LootLabs
    function getOrCreateLootlabsPuid() {
        let puid = localStorage.getItem("blacklist_lootlabs_puid");
        if (!puid || !puid.startsWith("ll_")) {
            puid = "ll_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
            localStorage.setItem("blacklist_lootlabs_puid", puid);
        }
        return puid;
    }

    let gatePollTimer = null;

    // Helper: ซ่อนหน้าต่างล็อคอย่างนุ่มนวล (Fade Out)
    function hideGateOverlay(withToast = false) {
        if (!lootlabsGateOverlay) return;
        isGateActivelyEnforced = false;
        isInternalGateChange = true;
        stopGatePolling();
        lootlabsGateOverlay.classList.add("gate-fade-out");
        setTimeout(() => {
            lootlabsGateOverlay.style.display = "none";
            lootlabsGateOverlay.classList.remove("gate-fade-out");
            isInternalGateChange = false;
        }, 450);

        if (withToast) {
            const gate = SITE_CONFIG.lootlabsGate || {};
            const durationHours = Number(gate.expiryHours || 24);
            showToast(`🎉 ปลดล็อคสำเร็จ! จดจำเครื่องนี้ไว้ ${durationHours} ชั่วโมง`);
        }
    }

    // Helper: วนลูปตรวจจับสถานะจาก LootLabs อัตโนมัติ (ไม่ต้องกดปุ่มเอง)
    function startGatePolling(fast = false) {
        if (gatePollTimer) clearInterval(gatePollTimer);
        const intervalMs = fast ? 1500 : 2500;
        gatePollTimer = setInterval(async () => {
            if (!lootlabsGateOverlay || lootlabsGateOverlay.style.display === "none") {
                stopGatePolling();
                return;
            }
            const ok = await verifyLootlabsSession(true);
            if (ok) {
                stopGatePolling();
            }
        }, intervalMs);
    }

    function stopGatePolling() {
        if (gatePollTimer) {
            clearInterval(gatePollTimer);
            gatePollTimer = null;
        }
    }

    // Helper: ตรวจสอบว่าเครื่องนี้มีสิทธิ์ผ่าน LootLabs หรือยัง
    function isGateAuthorized() {
        const gate = SITE_CONFIG.lootlabsGate;
        if (!gate || !gate.enabled) return true;
        const savedExpiry = localStorage.getItem("blacklist_lootlabs_auth_expiry");
        if (savedExpiry && Date.now() < Number(savedExpiry)) return true;
        if (sessionStorage.getItem("blacklist_lootlabs_auth") === "true") return true;
        return false;
    }

    // Helper: ตรวจสอบสถานะการยืนยัน Postback จากเซิร์ฟเวอร์
    async function verifyLootlabsSession(silent = false) {
        const puid = localStorage.getItem("blacklist_lootlabs_puid") || "";
        const gate = SITE_CONFIG.lootlabsGate || {};
        const durationHours = Number(gate.expiryHours || 24);

        try {
            // 1. ตรวจสอบผ่าน Endpoint /api/check-session (รองรับทั้ง puid และ IP)
            const queryParam = puid ? `?puid=${encodeURIComponent(puid)}` : "";
            let res = await fetch(`/api/check-session${queryParam}`).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                if (data.verified) {
                    const expiryTimestamp = Date.now() + (durationHours * 60 * 60 * 1000);
                    localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
                    sessionStorage.setItem("blacklist_lootlabs_auth", "true");
                    localStorage.setItem("blacklist_lootlabs_unlocked_event", String(Date.now()));
                    localStorage.removeItem("blacklist_lootlabs_puid");

                    if (gateAutoDetectBox) {
                        gateAutoDetectBox.style.display = "flex";
                        gateAutoDetectBox.innerHTML = '<i data-lucide="check-circle" style="color: #4ade80; width: 16px; height: 16px;"></i> <span style="color: #4ade80; font-weight: 600;">ปลดล็อคสำเร็จ! กำลังเปิดหน้าเว็บ...</span>';
                        refreshIcons();
                    }

                    setTimeout(() => {
                        hideGateOverlay(true);
                    }, 500);
                    return true;
                }
            }

            // 2. ตรวจสอบสำรองตรงไปยัง Firebase Firestore
            if (puid) {
                const fbUrl = `https://firestore.googleapis.com/v1/projects/blacklistscripts/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(puid)}?key=AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI`;
                const fbRes = await fetch(fbUrl).catch(() => null);
                if (fbRes && fbRes.ok) {
                    const data = await fbRes.json();
                    if (data.fields && data.fields.verified && data.fields.verified.booleanValue === true) {
                        const expiryTimestamp = Date.now() + (durationHours * 60 * 60 * 1000);
                        localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
                        sessionStorage.setItem("blacklist_lootlabs_auth", "true");
                        localStorage.setItem("blacklist_lootlabs_unlocked_event", String(Date.now()));
                        localStorage.removeItem("blacklist_lootlabs_puid");

                        if (gateAutoDetectBox) {
                            gateAutoDetectBox.style.display = "flex";
                            gateAutoDetectBox.innerHTML = '<i data-lucide="check-circle" style="color: #4ade80; width: 16px; height: 16px;"></i> <span style="color: #4ade80; font-weight: 600;">ปลดล็อคสำเร็จ! กำลังเปิดหน้าเว็บ...</span>';
                            refreshIcons();
                        }

                        setTimeout(() => {
                            hideGateOverlay(true);
                        }, 500);
                        return true;
                    }
                }
            }
        } catch (err) {
            console.warn("Session check notice:", err);
        }

        if (!silent) {
            showToast("ยังไม่พบการยืนยันจาก LootLabs กรุณาทำภารกิจให้ครบ");
        }
        return false;
    }

    // =========================================================================
    // Real-time Anti-Bypass Logger & Discord Alert Sender
    // =========================================================================
    let pageReadyForTamperCheck = false;
    let isInternalGateChange = false;
    let isGateActivelyEnforced = false;
    let lastBypassReport = 0;

    // Grace period on initial load: do not report bypass attempts during initial 4 seconds of page loading
    setTimeout(() => {
        pageReadyForTamperCheck = true;
    }, 4000);

    function reportBypassAttempt(reason, details = "") {
        if (!pageReadyForTamperCheck) return; // Prevent any false positives during initial boot & CSS animations
        const now = Date.now();
        if (now - lastBypassReport < 25000) return; // 25s debounce
        lastBypassReport = now;

        const payload = {
            reason: reason,
            details: details,
            referrer: document.referrer || "Direct / None",
            userAgent: navigator.userAgent || ""
        };

        fetch("/api/log-bypass", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(() => {
            setTimeout(checkBanStatus, 2000);
        }).catch(err => console.warn("[Anti-Bypass] Report notice:", err.message));
    }

    // =========================================================================
    // Ban Enforcement & Real-time Countdown System
    // =========================================================================
    function showBannedScreen(banData) {
        isCurrentlyBanned = true;
        isGateActivelyEnforced = false;
        isInternalGateChange = true;
        if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
        stopGatePolling();

        if (bannedScreenOverlay) {
            bannedScreenOverlay.style.display = "flex";
        }
        setTimeout(() => { isInternalGateChange = false; }, 300);
        if (bannedReasonText && banData.reason) {
            bannedReasonText.textContent = banData.reason;
        }
        if (bannedClientIp && banData.ip) {
            bannedClientIp.textContent = banData.ip;
        }
        if (bannedDurationText && banData.durationHours) {
            bannedDurationText.textContent = `${banData.durationHours} ชั่วโมง`;
        }
        if (bannedExpireTimeText && banData.bannedUntil) {
            const expDate = new Date(banData.bannedUntil);
            bannedExpireTimeText.textContent = expDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " (" + expDate.toLocaleDateString("th-TH") + ")";
        }

        refreshIcons();

        if (bannedCountdownInterval) clearInterval(bannedCountdownInterval);

        function updateCountdown() {
            const now = Date.now();
            const remaining = banData.bannedUntil - now;
            if (remaining <= 0) {
                clearInterval(bannedCountdownInterval);
                bannedCountdownInterval = null;
                checkBanStatus();
                return;
            }

            const totalSec = Math.floor(remaining / 1000);
            const hrs = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;

            if (bannedHours) bannedHours.textContent = String(hrs).padStart(2, "0");
            if (bannedMinutes) bannedMinutes.textContent = String(mins).padStart(2, "0");
            if (bannedSeconds) bannedSeconds.textContent = String(secs).padStart(2, "0");
        }

        updateCountdown();
        bannedCountdownInterval = setInterval(updateCountdown, 1000);
    }

    function hideBannedScreen() {
        isCurrentlyBanned = false;
        isInternalGateChange = true;
        if (bannedCountdownInterval) {
            clearInterval(bannedCountdownInterval);
            bannedCountdownInterval = null;
        }
        if (bannedScreenOverlay) {
            bannedScreenOverlay.style.display = "none";
        }
        setTimeout(() => { isInternalGateChange = false; }, 300);
        checkLootlabsGate();
    }

    async function checkBanStatus() {
        try {
            const res = await fetch("/api/check-ban");
            if (res.ok) {
                const data = await res.json();
                if (data && data.banned) {
                    showBannedScreen(data);
                    return true;
                } else if (isCurrentlyBanned) {
                    hideBannedScreen();
                }
            }
        } catch (e) {
            console.warn("[Anti-Bypass] Check ban notice:", e);
        }
        return false;
    }

    // =========================================================================
    // LootLabs Anti-Bypass Gate Logic (Remember device for 24 hours + Postback)
    // =========================================================================
    function checkLootlabsGate() {
        if (isCurrentlyBanned) return;

        const gate = SITE_CONFIG.lootlabsGate;
        if (!gate || !gate.enabled) {
            isGateActivelyEnforced = false;
            isInternalGateChange = true;
            if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
            stopGatePolling();
            setTimeout(() => { isInternalGateChange = false; }, 200);
            return;
        }

        // ตรวจสอบ Referrer ดักจับพวก bypass.vip หรือเครื่องมือ Bypass (เฉพาะโดเมน bypass จริงๆ และเช็คเพียงครั้งเดียวต่อ session)
        if (document.referrer && !sessionStorage.getItem("blacklist_bypass_ref_logged")) {
            try {
                const refUrl = new URL(document.referrer);
                const host = refUrl.hostname.toLowerCase();
                const knownBypassHosts = ["bypass.vip", "thebypasser.com", "linkvertisebypasser.com", "adlinkfly.com"];
                const isBypass = knownBypassHosts.some(d => host === d || host.endsWith("." + d));
                if (isBypass) {
                    sessionStorage.setItem("blacklist_bypass_ref_logged", "true");
                    reportBypassAttempt("เปิดเว็บไซต์ผ่านเครื่องมือ Bypass อัตโนมัติ", `Referrer Host: ${host}`);
                    showToast("⚠️ ตรวจพบการเปิดผ่านเครื่องมือ Bypass กรุณาทำภารกิจผ่าน LootLabs อย่างถูกต้อง");
                }
            } catch (e) {}
        }

        const requiredToken = (gate.token || "blacklist_vip").trim().toLowerCase();
        const durationHours = Number(gate.expiryHours || 24);
        const durationMs = durationHours * 60 * 60 * 1000;

        function grantDeviceAccess() {
            const expiryTimestamp = Date.now() + durationMs;
            localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
            sessionStorage.setItem("blacklist_lootlabs_auth", "true");
            hideGateOverlay(false);
        }

        // 1. Check URL parameters (?auth= or ?token= or ?key=) - Backdoor สำหรับแอดมิน
        const urlParams = new URLSearchParams(window.location.search);

        // ทดสอบระบบ: หากใส่ ?lock=1 หรือ ?reset=1 จะรีเซ็ตเครื่องให้กลับมาล็อคเหมือนเครื่องใหม่ทันที
        if (urlParams.has("lock") || urlParams.has("reset") || urlParams.has("relock") || urlParams.has("test")) {
            localStorage.removeItem("blacklist_lootlabs_auth_expiry");
            localStorage.removeItem("blacklist_lootlabs_puid");
            localStorage.removeItem("blacklist_lootlabs_unlocked_event");
            sessionStorage.removeItem("blacklist_lootlabs_auth");
            
            // ลบสถานะการยืนยัน IP บนเซิร์ฟเวอร์ทันที เพื่อให้จำลองเป็นเครื่องใหม่ 100%
            fetch("/api/reset-device-test").catch(() => null);

            try {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            } catch (e) {}
            showToast("รีเซ็ตสถานะเป็นเครื่องใหม่ (ล็อคหน้าเว็บ) เรียบร้อยแล้ว");
        }

        const incomingToken = (urlParams.get("auth") || urlParams.get("token") || urlParams.get("key") || "").trim().toLowerCase();

        if (incomingToken && incomingToken === requiredToken) {
            grantDeviceAccess();
            try {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            } catch (e) {}
            return;
        }

        // 2. Check 24-Hour Device Remember in localStorage
        const savedExpiry = localStorage.getItem("blacklist_lootlabs_auth_expiry");
        if (savedExpiry) {
            const expTime = Number(savedExpiry);
            if (!isNaN(expTime) && Date.now() < expTime) {
                // Device is within 24-hour validity window!
                isGateActivelyEnforced = false;
                isInternalGateChange = true;
                if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
                stopGatePolling();
                setTimeout(() => { isInternalGateChange = false; }, 200);
                return;
            } else {
                // Expired after 24 hours! Remove and re-lock
                localStorage.removeItem("blacklist_lootlabs_auth_expiry");
                sessionStorage.removeItem("blacklist_lootlabs_auth");
            }
        }

        // 3. Check sessionStorage fallback
        if (sessionStorage.getItem("blacklist_lootlabs_auth") === "true") {
            isGateActivelyEnforced = false;
            isInternalGateChange = true;
            if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
            stopGatePolling();
            setTimeout(() => { isInternalGateChange = false; }, 200);
            return;
        }

        // 4. Otherwise show gate overlay and setup LootLabs dynamic link
        if (lootlabsGateOverlay) {
            isInternalGateChange = true;
            lootlabsGateOverlay.style.display = "flex";
            lootlabsGateOverlay.style.visibility = "visible";
            lootlabsGateOverlay.style.opacity = "1";
            setTimeout(() => {
                isInternalGateChange = false;
                if (!isGateAuthorized() && !isCurrentlyBanned) {
                    isGateActivelyEnforced = true;
                }
            }, 600);

            const puid = getOrCreateLootlabsPuid();

            if (gateLootlabsBtn) {
                let baseLink = (gate.lootlabsUrl || "https://loot-link.com/s?example").trim();
                // ลบ puid เดิมออกถ้ามี แล้วแปะ puid ของเครื่องนี้เข้าไปใหม่
                baseLink = baseLink.replace(/[?&]puid=[^&]+/, '');
                const separator = baseLink.includes("?") ? "&" : "?";
                gateLootlabsBtn.href = `${baseLink}${separator}puid=${encodeURIComponent(puid)}`;
            }

            if (gateMessageText && gate.bypassMessage) {
                gateMessageText.textContent = gate.bypassMessage;
            }
            refreshIcons();

            // เริ่มระบบตรวจจับอัตโนมัติเบื้องหลังทันที
            startGatePolling(false);
            verifyLootlabsSession(true);
        }
    }

    // เมื่อคลิกปุ่มเปิด LootLabs ให้เปิดกล่องสถานะและเริ่มตรวจจับแบบถี่สูงทันที
    if (gateLootlabsBtn) {
        gateLootlabsBtn.addEventListener("click", () => {
            if (gateAutoDetectBox) {
                gateAutoDetectBox.style.display = "flex";
                if (gateAutoDetectText) {
                    gateAutoDetectText.textContent = "กำลังรอคุณทำ LootLabs... (ระบบจะปลดล็อคให้อัตโนมัติทันทีที่เสร็จ)";
                }
            }
            startGatePolling(true);
        });
    }

    if (gateTokenSubmitBtn && gateTokenInput) {
        const verifyManualToken = async () => {
            const inputVal = gateTokenInput.value.trim().toLowerCase();
            if (!inputVal) return;

            const gate = SITE_CONFIG.lootlabsGate || {};
            const required = (gate.token || "blacklist_vip").trim().toLowerCase();
            const durationHours = Number(gate.expiryHours || 24);

            // 1. ตรวจสอบกับ token ในหน่วยความจำทันที (เร็วที่สุด)
            if (inputVal === required) {
                const expiryTimestamp = Date.now() + (durationHours * 60 * 60 * 1000);
                localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
                sessionStorage.setItem("blacklist_lootlabs_auth", "true");
                hideGateOverlay(true);
                return;
            }

            // 2. หากไม่ตรง ให้ลองดึงคีย์ล่าสุดจาก Firebase / Server มาตรวจสอบทันที (ป้องกันกรณีแอดมินเพิ่งแก้ หรือเครื่องยังไม่ได้ซิงก์)
            const originalBtnHtml = gateTokenSubmitBtn.innerHTML;
            gateTokenSubmitBtn.disabled = true;
            gateTokenSubmitBtn.innerHTML = `<span>กำลังตรวจสอบ...</span>`;

            try {
                let latestConfig = null;
                if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
                    latestConfig = await window.FirebaseDB.getConfig().catch(() => null);
                }
                if (!latestConfig) {
                    const res = await fetch("/api/config").catch(() => null);
                    if (res && res.ok) latestConfig = await res.json().catch(() => null);
                }

                if (latestConfig) {
                    if (window.mergeSiteConfig) window.mergeSiteConfig(latestConfig);
                    else Object.assign(SITE_CONFIG, latestConfig);
                    localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));

                    const refreshedGate = SITE_CONFIG.lootlabsGate || {};
                    const refreshedRequired = (refreshedGate.token || "blacklist_vip").trim().toLowerCase();
                    const refreshedHours = Number(refreshedGate.expiryHours || 24);

                    if (inputVal === refreshedRequired) {
                        const expiryTimestamp = Date.now() + (refreshedHours * 60 * 60 * 1000);
                        localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
                        sessionStorage.setItem("blacklist_lootlabs_auth", "true");
                        hideGateOverlay(true);
                        return;
                    }
                }
            } catch (liveErr) {
                console.warn("Live token verification notice:", liveErr);
            } finally {
                gateTokenSubmitBtn.disabled = false;
                gateTokenSubmitBtn.innerHTML = originalBtnHtml;
                if (window.lucide && lucide.createIcons) lucide.createIcons();
            }

            // 3. แสดงข้อความแจ้งเตือนเมื่อไม่ถูกต้องจริงๆ
            if (gateErrorMsg) {
                gateErrorMsg.style.display = "block";
                setTimeout(() => { if (gateErrorMsg) gateErrorMsg.style.display = "none"; }, 3000);
            }
        };

        gateTokenSubmitBtn.addEventListener("click", verifyManualToken);
        gateTokenInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") verifyManualToken();
        });
    }

    // ปุ่มกดตรวจสถานะการทำภารกิจ LootLabs ด้วยตนเอง
    if (gateCheckStatusBtn) {
        gateCheckStatusBtn.addEventListener("click", () => {
            const icon = gateCheckStatusBtn.querySelector("i");
            if (icon) icon.style.animation = "spin 0.8s linear infinite";
            verifyLootlabsSession(false).finally(() => {
                if (icon) icon.style.animation = "";
            });
        });
    }

    // ตรวจสอบอัตโนมัติเมื่อผู้ใช้สลับแท็บกลับมาจากหน้า LootLabs
    window.addEventListener("focus", () => {
        if (lootlabsGateOverlay && lootlabsGateOverlay.style.display !== "none") {
            verifyLootlabsSession(true);
        }
    });

    // ซิงก์การปลดล็อคข้ามแท็บอัตโนมัติ (ถ้าแท็บอื่นปลดล็อคแล้ว แท็บนี้จะหายไปทันที)
    window.addEventListener("storage", (e) => {
        if (e.key === "blacklist_lootlabs_auth_expiry" || e.key === "blacklist_lootlabs_unlocked_event") {
            hideGateOverlay(false);
        }
    });

    // Global Helper สำหรับทดสอบระบบ: ล้างการจำเครื่องและล็อคหน้าเว็บใหม่ทันที
    window.resetDeviceLock = async function() {
        localStorage.removeItem("blacklist_lootlabs_auth_expiry");
        localStorage.removeItem("blacklist_lootlabs_puid");
        localStorage.removeItem("blacklist_lootlabs_unlocked_event");
        sessionStorage.removeItem("blacklist_lootlabs_auth");
        await fetch("/api/reset-device-test").catch(() => null);
        window.location.href = window.location.origin + window.location.pathname + "?lock=1";
    };

    // ป้องกันการแอบ Inspect Element / DevTools ปิด Modal หน้าเว็บ
    if (window.MutationObserver) {
        if (lootlabsGateOverlay) {
            const tamperObserver = new MutationObserver(() => {
                if (!pageReadyForTamperCheck || isInternalGateChange || !isGateActivelyEnforced) return;
                if (isGateAuthorized() || isCurrentlyBanned) return;

                const style = window.getComputedStyle(lootlabsGateOverlay);
                const isHidden = lootlabsGateOverlay.style.display === "none" ||
                                 style.display === "none" ||
                                 style.visibility === "hidden" ||
                                 lootlabsGateOverlay.hidden;

                if (isHidden || lootlabsGateOverlay.style.opacity === "0") {
                    isInternalGateChange = true;
                    lootlabsGateOverlay.style.display = "flex";
                    lootlabsGateOverlay.style.visibility = "visible";
                    lootlabsGateOverlay.style.opacity = "1";
                    lootlabsGateOverlay.hidden = false;
                    setTimeout(() => { isInternalGateChange = false; }, 300);

                    reportBypassAttempt("พยายามลบ/ซ่อนกล่อง LootLabs Gate ผ่าน DevTools", "ตรวจพบการซ่อน #lootlabsGateOverlay");
                    showToast("⚠️ ตรวจพบการพยายามบายพาส! ระบบทำการล็อคหน้าเว็บและส่งบันทึก");
                }
            });
            tamperObserver.observe(lootlabsGateOverlay, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
        }

        if (bannedScreenOverlay) {
            const banTamperObserver = new MutationObserver(() => {
                if (!pageReadyForTamperCheck || isInternalGateChange || !isCurrentlyBanned) return;

                const style = window.getComputedStyle(bannedScreenOverlay);
                const isHidden = bannedScreenOverlay.style.display === "none" ||
                                 style.display === "none" ||
                                 style.visibility === "hidden" ||
                                 bannedScreenOverlay.hidden;

                if (isHidden || bannedScreenOverlay.style.opacity === "0") {
                    isInternalGateChange = true;
                    bannedScreenOverlay.style.display = "flex";
                    bannedScreenOverlay.style.visibility = "visible";
                    bannedScreenOverlay.style.opacity = "1";
                    bannedScreenOverlay.hidden = false;
                    setTimeout(() => { isInternalGateChange = false; }, 300);

                    reportBypassAttempt("พยายามลบ/ซ่อนหน้าต่าง Banned Screen ผ่าน DevTools", "ตรวจพบการซ่อน #bannedScreenOverlay");
                }
            });
            banTamperObserver.observe(bannedScreenOverlay, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
        }
    }

    function updateCategoryBadges() {
        if (totalCount) totalCount.textContent = scripts.length;
        if (!gameMenu) return;
        gameMenu.querySelectorAll(".menu-item[data-game]").forEach(item => {
            const cat = item.dataset.game;
            const count = scripts.filter(s => s.category === cat).length;
            const badge = item.querySelector(".menu-badge");
            if (badge) {
                badge.textContent = count;
            }
        });
    }

    async function syncDataFromServer() {
        try {
            // 1. Top Priority: Firebase Cloud Firestore (50,000 Reads/วัน ฟรีตลอดชีพ)
            if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
                try {
                    const [fbScripts, fbConfig] = await Promise.all([
                        window.FirebaseDB.getScripts(),
                        window.FirebaseDB.getConfig().catch(() => null)
                    ]);
                    if (fbConfig) {
                        if (window.mergeSiteConfig) window.mergeSiteConfig(fbConfig);
                        else Object.assign(SITE_CONFIG, fbConfig);
                        localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));
                        applySiteConfig();
                        checkLootlabsGate();
                    }
                    if (Array.isArray(fbScripts) && fbScripts.length > 0) {
                        scripts = fbScripts;
                        renderHomeRecent();
                        if (currentView === "feed") renderFeed();
                        updateCategoryBadges();
                        return;
                    }
                } catch (fbErr) {
                    console.warn("Firebase fetch notice:", fbErr);
                }
            }

            // 2. Secondary Priority: JSONBin.io Cloud Database with Smart Caching (ประหยัดโควตา Request ไม่ให้หมดไว)
            if (SITE_CONFIG.cloudDb && SITE_CONFIG.cloudDb.enabled && SITE_CONFIG.cloudDb.binId) {
                const CACHE_KEY = "nova_scripts_db";
                const TIME_KEY = "nova_scripts_cache_time";
                const CACHE_DURATION_MS = 60 * 1000; // แคชไว้ 60 วินาทีต่อผู้ใช้
                const cachedTime = parseInt(sessionStorage.getItem(TIME_KEY) || "0", 10);
                const hasCache = localStorage.getItem(CACHE_KEY);

                if (hasCache && (Date.now() - cachedTime < CACHE_DURATION_MS)) {
                    try {
                        const parsed = JSON.parse(hasCache);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            scripts = parsed;
                            renderHomeRecent();
                            if (currentView === "feed") renderFeed();
                            updateCategoryBadges();
                            return;
                        }
                    } catch (e) {}
                }

                try {
                    const binRes = await fetch(`https://api.jsonbin.io/v3/b/${SITE_CONFIG.cloudDb.binId}/latest?meta=false`);
                    if (binRes.ok) {
                        const binData = await binRes.json();
                        const remoteScripts = Array.isArray(binData) ? binData : (binData.scripts || []);
                        scripts = remoteScripts;
                        localStorage.setItem(CACHE_KEY, JSON.stringify(scripts));
                        sessionStorage.setItem(TIME_KEY, Date.now().toString());
                        renderHomeRecent();
                        if (currentView === "feed") renderFeed();
                        updateCategoryBadges();
                        return;
                    }
                } catch (cloudErr) {
                    console.warn("Cloud DB fetch notice:", cloudErr);
                }
            }

            // 2. Fallback to local server / static file
            let [cfgRes, scpRes] = await Promise.all([
                fetch('/api/config').catch(() => null),
                fetch('/api/scripts').catch(() => null)
            ]);

            // Fallback for static hosting (e.g. GitHub Pages or Vercel)
            if (!cfgRes || !cfgRes.ok) {
                cfgRes = await fetch('data/config.json').catch(() => null);
            }
            if (!scpRes || !scpRes.ok) {
                if (localStorage.getItem("nova_scripts_db") === null) {
                    scpRes = await fetch('data/scripts.json').catch(() => null);
                }
            }

            if (cfgRes && cfgRes.ok) {
                const cfg = await cfgRes.json();
                if (window.mergeSiteConfig) window.mergeSiteConfig(cfg);
                else Object.assign(SITE_CONFIG, cfg);
                localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));
                applySiteConfig();
                checkLootlabsGate();
            }

            if (scpRes && scpRes.ok) {
                const scp = await scpRes.json();
                if (Array.isArray(scp)) {
                    const isFromApi = scpRes.url && scpRes.url.includes('/api/scripts');
                    if (isFromApi || localStorage.getItem("nova_scripts_db") === null) {
                        scripts = scp;
                        localStorage.setItem("nova_scripts_db", JSON.stringify(scripts));
                        renderHomeRecent();
                        if (currentView === "feed") renderFeed();
                        updateCategoryBadges();
                    }
                }
            }
        } catch (err) {
            console.warn("Server sync notice:", err);
        }
    }

    // Listen for storage events (e.g. from admin tab)
    window.addEventListener("storage", (e) => {
        if (e.key === "nova_site_config") {
            try {
                const parsedConfig = JSON.parse(e.newValue);
                if (window.mergeSiteConfig) window.mergeSiteConfig(parsedConfig);
                else Object.assign(SITE_CONFIG, parsedConfig);
                applySiteConfig();
                checkLootlabsGate();
            } catch (err) {}
        }
        if (e.key === "nova_scripts_db") {
            try {
                scripts = JSON.parse(e.newValue);
                renderHomeRecent();
                if (currentView === "feed") renderFeed();
                updateCategoryBadges();
            } catch (err) {}
        }
    });

    // =========================================================================
    // View Switcher
    // =========================================================================
    function switchView(viewName) {
        currentView = viewName;

        if (viewName === "home") {
            homeView.style.display = "flex";
            feedView.style.display = "none";
            if (exploitsView) exploitsView.style.display = "none";
            highlightSidebarItem("home");
            renderHomeRecent();
            renderHomeExecutors();
        } else if (viewName === "exploits") {
            homeView.style.display = "none";
            feedView.style.display = "none";
            if (exploitsView) exploitsView.style.display = "block";
            highlightSidebarItem("exploits");
            renderExploits();
        } else {
            homeView.style.display = "none";
            feedView.style.display = "block";
            if (exploitsView) exploitsView.style.display = "none";
            renderFeed();
        }

        if (mobileBottomNav) {
            mobileBottomNav.querySelectorAll(".bottom-nav-item").forEach(btn => {
                btn.classList.remove("active");
                if (btn.dataset.nav === viewName) {
                    btn.classList.add("active");
                }
            });
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        refreshIcons();
    }

    function highlightSidebarItem(type, val = null) {
        mainMenu.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
        gameMenu.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));

        if (type === "home") {
            const homeItem = mainMenu.querySelector('[data-nav="home"]');
            if (homeItem) homeItem.classList.add("active");
        } else if (type === "exploits") {
            const expItem = mainMenu.querySelector('[data-nav="exploits"]');
            if (expItem) expItem.classList.add("active");
        } else if (type === "filter") {
            const filterItem = mainMenu.querySelector(`[data-filter="${val}"]`);
            if (filterItem) filterItem.classList.add("active");
        } else if (type === "game") {
            const gameItem = gameMenu.querySelector(`[data-game="${val}"]`);
            if (gameItem) gameItem.classList.add("active");
        }
    }

    // =========================================================================
    // Scripts Feed Rendering
    // =========================================================================
    function createScriptRow(item) {
        const isLiked = localStorage.getItem("liked_script_" + item.id) === "true";
        return `
            <div class="script-row" data-script-id="${escapeHtml(item.id)}">
                <div class="row-left">
                    <img class="row-thumb" src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)}">
                    <div class="row-meta">
                        <div class="row-game-badge">
                            <i data-lucide="gamepad-2"></i> ${escapeHtml(item.game)} • ${escapeHtml(item.version || 'v1.0')}
                        </div>
                        <div class="row-title">${escapeHtml(item.title)}</div>
                        <div class="row-features">${escapeHtml(item.description)}</div>
                        <div class="row-tags">
                            <span class="tag-badge ${item.isKeyless ? 'green' : ''}">
                                ${item.isKeyless ? 'ไร้คีย์' : 'มีคีย์'}
                            </span>
                            <span class="tag-badge">รองรับมือถือ / PC</span>
                            <span class="tag-badge" style="color: #4ade80;">สถานะ: ปกติ</span>
                        </div>
                    </div>
                </div>

                <div class="row-right">
                    <div class="row-stats">
                        <div class="stat-views-badge" data-view-id="${escapeHtml(item.id)}" title="จำนวนการเข้าชม">
                            <i data-lucide="eye"></i> <span>${formatNumber(item.views || 0)} ครั้ง</span>
                        </div>
                        <div class="stat-likes-badge ${isLiked ? 'liked' : ''}" data-like-id="${escapeHtml(item.id)}" onclick="toggleScriptLike(event, '${escapeHtml(item.id)}')" title="${isLiked ? 'ยกเลิกการถูกใจ' : 'กดถูกใจสคริปต์นี้'}">
                            <i data-lucide="thumbs-up"></i> <span>${formatNumber(item.likes || 0)} ถูกใจ</span>
                        </div>
                    </div>
                    <button class="btn-get" onclick="openLocker('${escapeHtml(item.id)}')">
                        <span>รับสคริปต์</span>
                        <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function formatNumber(n) {
        const num = Number(n) || 0;
        return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : String(num);
    }

    // ฟังก์ชันเพิ่มยอดเข้าชมสคริปต์แบบเรียลไทม์ (Real-time View Counter)
    function incrementScriptView(id) {
        const item = scripts.find(s => String(s.id) === String(id));
        if (!item) return;

        item.views = (Number(item.views) || 0) + 1;

        // อัปเดตตัวเลขบนหน้าจอทันทีทุกจุดที่แสดง
        document.querySelectorAll(`[data-view-id="${id}"]`).forEach(el => {
            const span = el.querySelector("span");
            if (span) span.textContent = `${formatNumber(item.views)} ครั้ง`;
        });

        // บันทึกเก็บลงแคชเครื่อง
        saveScriptsData(scripts);

        // ซิงค์ยอดการดูขึ้น Firebase Cloud
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            window.FirebaseDB.incrementView(id);
        }

        // ซิงค์ยอดการดูไปที่ Server SQLite (กรณีรันบน Node.js)
        fetch('/api/scripts/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        }).catch(() => {});
    }

    // ฟังก์ชันกดถูกใจสคริปต์แบบเรียลไทม์ (Interactive Like Button)
    window.toggleScriptLike = function(event, id) {
        if (event) event.stopPropagation();
        const item = scripts.find(s => String(s.id) === String(id));
        if (!item) return;

        const isLiked = localStorage.getItem("liked_script_" + id) === "true";
        let delta = 1;

        if (isLiked) {
            localStorage.removeItem("liked_script_" + id);
            item.likes = Math.max(0, (Number(item.likes) || 1) - 1);
            delta = -1;
            showToast("ยกเลิกการถูกใจแล้ว");
        } else {
            localStorage.setItem("liked_script_" + id, "true");
            item.likes = (Number(item.likes) || 0) + 1;
            delta = 1;
            showToast("ขอบคุณที่กดถูกใจสคริปต์นี้!");
        }

        // อัปเดตไอคอนและตัวเลขถูกใจในหน้าจอทันที
        document.querySelectorAll(`[data-like-id="${id}"]`).forEach(el => {
            if (!isLiked) {
                el.classList.add("liked");
                el.setAttribute("title", "ยกเลิกการถูกใจ");
            } else {
                el.classList.remove("liked");
                el.setAttribute("title", "กดถูกใจสคริปต์นี้");
            }
            const span = el.querySelector("span");
            if (span) span.textContent = `${formatNumber(item.likes)} ถูกใจ`;
        });

        // บันทึกเก็บลงแคชเครื่อง
        saveScriptsData(scripts);

        // ซิงค์ยอดถูกใจขึ้น Firebase Cloud
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            window.FirebaseDB.incrementLike(id, delta);
        }

        // ซิงค์ยอดถูกใจไปที่ Server SQLite
        fetch('/api/scripts/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, delta })
        }).catch(() => {});

        refreshIcons();
    };

    function renderHomeRecent() {
        const homeSpotlight = document.querySelector(".home-spotlight");
        const spotlightTitle = document.querySelector(".spotlight-title");
        const spotlightDesc = document.querySelector(".spotlight-desc");
        const btnSpotlight = document.querySelector(".btn-spotlight");

        if (scripts.length === 0) {
            if (homeSpotlight) homeSpotlight.style.display = "none";
            if (homeRecentScripts) {
                homeRecentScripts.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border);">
                        <i data-lucide="inbox" style="width: 32px; height: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
                        <p style="font-size: 14px; font-weight: 500;">ยังไม่มีสคริปต์ในระบบ</p>
                        <p style="font-size: 12px; margin-top: 4px;">แอดมินสามารถเพิ่มสคริปต์ใหม่ได้ที่หน้าหลังบ้าน (Admin Panel)</p>
                    </div>
                `;
            }
            refreshIcons();
            return;
        }

        if (homeSpotlight) {
            homeSpotlight.style.display = "block";
            const top = scripts[0];
            if (spotlightTitle) spotlightTitle.textContent = top.title;
            if (spotlightDesc) spotlightDesc.textContent = top.description || "";
            if (btnSpotlight) {
                btnSpotlight.onclick = () => openLocker(top.id);
            }
        }

        const top3 = scripts.slice(0, 3);
        if (homeRecentScripts) {
            homeRecentScripts.innerHTML = top3.map(createScriptRow).join("");
        }
        refreshIcons();
    }

    function renderFeed() {
        const filtered = scripts.filter(item => {
            if (activeGame && item.category !== activeGame) return false;
            if (activeFilter === "keyless" && !item.isKeyless) return false;
            if (activeFilter === "mobile" && !item.isMobile) return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const mTitle = (item.title || "").toLowerCase().includes(q);
                const mGame = (item.game || "").toLowerCase().includes(q);
                const mDesc = (item.description || "").toLowerCase().includes(q);
                if (!mTitle && !mGame && !mDesc) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            scriptsFeed.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: 10px;">
                    ไม่พบสคริปต์ที่ค้นหา ลองเลือกหมวดหมู่อื่นดูนะครับ
                </div>
            `;
            return;
        }

        scriptsFeed.innerHTML = filtered.map(createScriptRow).join("");
        refreshIcons();
    }

    // =========================================================================
    // WEAO Exploits & sUNC Data API Integration
    // =========================================================================
    async function fetchExploits() {
        try {
            let res = await fetch("/api/exploits").catch(() => null);
            if (!res || !res.ok) {
                res = await fetch("https://weao.xyz/api/status/exploits").catch(() => null);
            }
            if (!res || !res.ok) throw new Error("Status: " + (res ? res.status : "failed"));
            const data = await res.json();
            if (Array.isArray(data)) {
                allExploits = data;
                renderHomeExecutors();
                if (currentView === "exploits") {
                    renderExploits();
                }
            }
        } catch (err) {
            console.error("Failed to load WEAO exploits:", err);
            if (homeExecutorsGrid) {
                homeExecutorsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-muted);">
                        ไม่สามารถเชื่อมต่อ WEAO API ได้ในขณะนี้
                    </div>
                `;
            }
            if (exploitsGrid) {
                exploitsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                        ไม่สามารถดึงข้อมูลตัวรันจาก WEAO API ได้
                    </div>
                `;
            }
        }
    }

    // Render 4 top executors on Homepage
    function renderHomeExecutors() {
        if (!homeExecutorsGrid) return;
        if (allExploits.length === 0) return;

        const top4 = allExploits.slice(0, 4);
        homeExecutorsGrid.innerHTML = top4.map(exp => {
            const isOnline = !!exp.updateStatus;
            const statusClass = isOnline ? "status-working" : "status-outdated";
            const statusText = isOnline ? "พร้อมใช้งาน" : "รออัปเดต";
            const suncScore = typeof exp.suncPercentage === "number" ? `${exp.suncPercentage}%` : (typeof exp.uncPercentage === "number" ? `${exp.uncPercentage}%` : "N/A");
            const platform = exp.platform || "Multi";
            const price = exp.free ? "ฟรี" : (exp.cost || "มีค่าบริการ");

            return `
                <div class="executor-card" style="cursor: pointer;" onclick="openExploitsView()">
                    <div class="executor-info">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h4>${escapeHtml(exp.title)}</h4>
                            <span class="exploit-status-badge ${statusClass}" style="font-size: 10px; padding: 1px 6px;">${statusText}</span>
                        </div>
                        <p style="margin-top: 4px; display: flex; gap: 8px; font-size: 11px;">
                            <span><i data-lucide="monitor" style="width: 12px; height: 12px;"></i> ${escapeHtml(platform)}</span>
                            <span><i data-lucide="tag" style="width: 12px; height: 12px;"></i> ${escapeHtml(price)}</span>
                            <span>sUNC: <strong style="color: #38bdf8;">${suncScore}</strong></span>
                        </p>
                    </div>
                    <div style="color: var(--text-muted);">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </div>
            `;
        }).join("");
        refreshIcons();
    }

    // Render full list in Exploits View
    function renderExploits() {
        if (!exploitsGrid) return;
        if (allExploits.length === 0) {
            exploitsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <i data-lucide="loader-2" class="spin"></i> กำลังโหลดข้อมูลสถานะตัวรัน...
                </div>
            `;
            refreshIcons();
            return;
        }

        const filtered = allExploits.filter(exp => {
            if (activeExploitPlatform !== "all" && exp.platform && exp.platform.toLowerCase() !== activeExploitPlatform.toLowerCase()) {
                return false;
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const mTitle = (exp.title || "").toLowerCase().includes(q);
                const mPlat = (exp.platform || "").toLowerCase().includes(q);
                const mVer = (exp.version || "").toLowerCase().includes(q);
                if (!mTitle && !mPlat && !mVer) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            exploitsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    ไม่พบตัวรันตามเงื่อนไขที่เลือก
                </div>
            `;
            return;
        }

        exploitsGrid.innerHTML = filtered.map(exp => {
            const isOnline = !!exp.updateStatus;
            const statusClass = isOnline ? "status-working" : "status-outdated";
            const statusText = isOnline ? "พร้อมใช้งาน" : "รออัปเดต";
            const isDetected = !!exp.detected;
            const suncScore = typeof exp.suncPercentage === "number" ? exp.suncPercentage : (typeof exp.uncPercentage === "number" ? exp.uncPercentage : null);
            const suncFillClass = suncScore !== null && suncScore < 70 ? "low" : (suncScore !== null && suncScore < 90 ? "medium" : "");
            const price = exp.free ? "ฟรี" : (exp.cost || "มีค่าบริการ");
            const hasSuncData = exp.sunc && exp.sunc.suncScrap && exp.sunc.suncKey;

            return `
                <div class="exploit-card">
                    <div>
                        <div class="exploit-head">
                            <div>
                                <div class="exploit-name">${escapeHtml(exp.title)}</div>
                                <div class="exploit-platform">
                                    <i data-lucide="monitor" style="width: 12px; height: 12px;"></i> ${escapeHtml(exp.platform || 'Multi')} • v${escapeHtml(exp.version || 'ล่าสุด')}
                                </div>
                            </div>
                            <span class="exploit-status-badge ${statusClass}">
                                <i data-lucide="${isOnline ? 'check-circle-2' : 'alert-circle'}" style="width: 12px; height: 12px;"></i> ${statusText}
                            </span>
                        </div>

                        <!-- sUNC Progress Bar -->
                        <div class="sunc-score-wrap">
                            <div class="sunc-label-row">
                                <span>sUNC Benchmark Score</span>
                                <span class="sunc-score-val">${suncScore !== null ? suncScore + '%' : 'ไม่มีข้อมูล'}</span>
                            </div>
                            <div class="sunc-bar-bg">
                                <div class="sunc-bar-fill ${suncFillClass}" style="width: ${suncScore !== null ? suncScore : 0}%;"></div>
                            </div>
                        </div>

                        <!-- Details Rows -->
                        <div class="exploit-details-row">
                            <span>ประเภท / ราคา</span>
                            <span style="color: #fff; font-weight: 500;">${escapeHtml(price)}</span>
                        </div>
                        <div class="exploit-details-row">
                            <span>สถานะความปลอดภัย</span>
                            <span style="color: ${isDetected ? '#f87171' : '#4ade80'};">
                                ${isDetected ? 'ตรวจพบ (Detected)' : 'ปลอดภัย (Undetected)'}
                            </span>
                        </div>
                        ${exp.updatedDate ? `
                        <div class="exploit-details-row">
                            <span>อัปเดตล่าสุด</span>
                            <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(exp.updatedDate)}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${hasSuncData ? `
                            <button class="btn-view-sunc" onclick="openSuncDetails('${escapeHtml(exp.title)}', '${escapeHtml(exp.version || '')}', '${escapeHtml(exp.sunc.suncScrap)}', '${escapeHtml(exp.sunc.suncKey)}')">
                                <i data-lucide="bar-chart-2"></i> ดูผลทดสอบ sUNC
                            </button>
                        ` : `
                            <button class="btn-view-sunc" disabled style="opacity: 0.45; cursor: not-allowed;">
                                <i data-lucide="info"></i> ไม่มีผลทดสอบ sUNC
                            </button>
                        `}
                        ${exp.websitelink ? `
                            <a href="${escapeHtml(exp.websitelink)}" target="_blank" rel="noopener" class="btn-view-sunc" style="text-decoration: none; font-size: 11px; padding: 6px;">
                                <i data-lucide="external-link"></i> เว็บไซต์หลัก
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join("");
        refreshIcons();
    }

    // Open sUNC Benchmark Details Modal
    window.openSuncDetails = async function(title, version, scrap, key) {
        if (!suncModal) return;
        suncModalTitle.textContent = `${title} - ข้อมูลผลทดสอบ sUNC`;
        suncVersion.textContent = version || "-";
        suncTime.textContent = "...";
        suncPassedCount.textContent = "0";
        suncFailedCount.textContent = "0";
        if (searchSuncFunc) searchSuncFunc.value = "";
        currentSuncFilter = "";
        currentSuncData = null;

        suncTestList.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                <i data-lucide="loader-2" class="spin"></i> กำลังดาวน์โหลดข้อมูล sUNC จาก WEAO API...
            </div>
        `;
        refreshIcons();
        suncModal.classList.add("active");

        try {
            let res = await fetch(`/api/sunc?scrap=${encodeURIComponent(scrap)}&key=${encodeURIComponent(key)}`).catch(() => null);
            if (!res || !res.ok) {
                res = await fetch(`https://weao.xyz/api/sunc?scrap=${encodeURIComponent(scrap)}&key=${encodeURIComponent(key)}`).catch(() => null);
            }
            if (!res || !res.ok) throw new Error("Failed to load sUNC: " + (res ? res.status : "failed"));
            const data = await res.json();
            currentSuncData = data;

            suncTime.textContent = (data.timeTaken ? data.timeTaken + "s" : "-");
            const passedList = (data.tests && data.tests.passed) || [];
            const failedList = (data.tests && data.tests.failed) || [];
            suncPassedCount.textContent = passedList.length;
            suncFailedCount.textContent = failedList.length;

            renderSuncTests();
        } catch (err) {
            console.error("Error loading sUNC details:", err);
            suncTestList.innerHTML = `
                <div style="text-align: center; padding: 24px; color: #f87171;">
                    ไม่สามารถโหลดข้อมูล sUNC ได้ หรือ API ไม่ตอบสนอง
                </div>
            `;
        }
    };

    function renderSuncTests() {
        if (!currentSuncData || !currentSuncData.tests) return;
        const passedList = currentSuncData.tests.passed || [];
        const failedList = currentSuncData.tests.failed || [];
        const q = currentSuncFilter.toLowerCase().trim();

        const filteredPassed = passedList.filter(t => !q || (t.name && t.name.toLowerCase().includes(q)) || (t.library && t.library.toLowerCase().includes(q)));
        const filteredFailed = failedList.filter(t => !q || (t.name && t.name.toLowerCase().includes(q)) || (t.library && t.library.toLowerCase().includes(q)));

        if (filteredPassed.length === 0 && filteredFailed.length === 0) {
            suncTestList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    ไม่พบฟังก์ชันที่ตรงกับ "${escapeHtml(currentSuncFilter)}"
                </div>
            `;
            return;
        }

        let html = "";
        filteredFailed.forEach(t => {
            html += `
                <div class="sunc-test-item failed">
                    <div>
                        <div class="sunc-func-name" style="color: #f87171;">${escapeHtml(t.name)}</div>
                        <div class="sunc-func-lib">${escapeHtml(t.library || 'General')} • เหตุผล: ${escapeHtml(t.reason || 'Not supported')}</div>
                    </div>
                    <span class="exploit-status-badge status-outdated">
                        <i data-lucide="x" style="width: 12px; height: 12px;"></i> ไม่ผ่าน
                    </span>
                </div>
            `;
        });

        filteredPassed.forEach(t => {
            html += `
                <div class="sunc-test-item passed">
                    <div>
                        <div class="sunc-func-name">${escapeHtml(t.name)}</div>
                        <div class="sunc-func-lib">${escapeHtml(t.library || 'General')}${t.description ? ' • ' + escapeHtml(t.description) : ''}</div>
                    </div>
                    <span class="exploit-status-badge status-working">
                        <i data-lucide="check" style="width: 12px; height: 12px;"></i> ผ่าน
                    </span>
                </div>
            `;
        });

        suncTestList.innerHTML = html;
        refreshIcons();
    }

    window.openExploitsView = function() {
        switchView("exploits");
    };

    // sUNC Filter search listener
    if (searchSuncFunc) {
        searchSuncFunc.addEventListener("input", (e) => {
            currentSuncFilter = e.target.value;
            renderSuncTests();
        });
    }

    // Close sUNC modal
    if (closeSuncModalBtn) {
        closeSuncModalBtn.addEventListener("click", () => {
            suncModal.classList.remove("active");
        });
    }
    if (suncModal) {
        suncModal.addEventListener("click", (e) => {
            if (e.target === suncModal) suncModal.classList.remove("active");
        });
    }

    // Platform Filter for Exploits
    if (exploitPlatformFilter) {
        exploitPlatformFilter.addEventListener("click", (e) => {
            const chip = e.target.closest(".chip");
            if (!chip) return;
            exploitPlatformFilter.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeExploitPlatform = chip.dataset.plat || "all";
            renderExploits();
        });
    }

    if (btnSeeAllExploits) {
        btnSeeAllExploits.addEventListener("click", () => {
            switchView("exploits");
        });
    }

    // =========================================================================
    // Sub2Unlock Locker Logic (Ultra Modern Gaming Locker)
    // =========================================================================
    window.openLocker = function(id) {
        if (!isGateAuthorized()) {
            showToast("⚠️ สิทธิ์เข้าใช้งานถูกจำกัด! กรุณาผ่าน LootLabs ก่อนรับสคริปต์");
            checkLootlabsGate();
            return;
        }
        if (currentTaskTimer) {
            clearInterval(currentTaskTimer);
            currentTaskTimer = null;
        }
        selectedScript = scripts.find(s => String(s.id) === String(id));
        if (!selectedScript) return;

        // นับยอดการดูเพิ่มจริงทันทีเมื่อกดรับสคริปต์
        incrementScriptView(id);

        tasks = { t1: false, t2: false, t3: false };
        scriptCodeBox.value = selectedScript.loadstring || "";

        tasksStack.style.display = "flex";
        lockedLabel.style.display = "flex";
        unlockedView.classList.remove("show");

        resetTaskBtn(task1Btn, "01", "youtube", "กดติดตาม YouTube / Subscribe", "เปิดช่อง YouTube และรอตรวจสอบ 5 วินาที", "primary-red", true);
        resetTaskBtn(task2Btn, "02", "message-square", "เข้าร่วม Discord / Join Discord", "เปิดลิงก์และรอตรวจสอบ 5 วินาที", "", false);
        resetTaskBtn(task3Btn, "03", "thumbs-up", "กดไลค์ & คอมเมนต์ / Like & Comment", "เปิดคลิปและรอตรวจสอบ 3 วินาที", "", false);

        updateDots();
        lockerModal.classList.add("active");
        refreshIcons();
    };

    function resetTaskBtn(btn, stepNum, icon, title, hint, extraClass, isReady) {
        btn.disabled = false;
        btn.className = `btn-task ${extraClass}`.trim();
        const statusHtml = isReady 
            ? `<span class="status-pill active-pill">เริ่มทำ <i data-lucide="arrow-right"></i></span>`
            : `<span class="status-pill wait-pill"><i data-lucide="lock"></i> รอดำเนินการ</span>`;
            
        btn.innerHTML = `
            <div class="task-left">
                <div class="task-badge">${stepNum}</div>
                <div class="task-icon-box"><i data-lucide="${icon}"></i></div>
                <div class="task-meta">
                    <span class="task-name">${title}</span>
                    <span class="task-hint">${hint}</span>
                </div>
            </div>
            <div class="task-status">
                ${statusHtml}
            </div>
        `;
    }

    function setTaskDone(btn, stepNum, title) {
        btn.disabled = true;
        btn.className = "btn-task done";
        btn.innerHTML = `
            <div class="task-left">
                <div class="task-badge done"><i data-lucide="check"></i></div>
                <div class="task-icon-box done"><i data-lucide="check"></i></div>
                <div class="task-meta">
                    <span class="task-name">${title}</span>
                    <span class="task-hint done-hint">ภารกิจเสร็จสิ้นแล้ว</span>
                </div>
            </div>
            <div class="task-status">
                <span class="status-pill done-pill"><i data-lucide="check"></i> สำเร็จ</span>
            </div>
        `;
        refreshIcons();
    }

    function updateDots() {
        const line1 = document.getElementById("line1");
        const line2 = document.getElementById("line2");
        const lockedStatusText = document.getElementById("lockedStatusText");

        // Step 1
        if (tasks.t1) {
            dot1.className = "tracker-step done";
            if (line1) line1.className = "tracker-line done";
        } else {
            dot1.className = "tracker-step active";
            if (line1) line1.className = "tracker-line";
        }

        // Step 2
        if (tasks.t2) {
            dot2.className = "tracker-step done";
            if (line2) line2.className = "tracker-line done";
        } else if (tasks.t1) {
            dot2.className = "tracker-step active";
            if (line2) line2.className = "tracker-line";
        } else {
            dot2.className = "tracker-step";
            if (line2) line2.className = "tracker-line";
        }

        // Step 3
        if (tasks.t3) {
            dot3.className = "tracker-step done";
        } else if (tasks.t2) {
            dot3.className = "tracker-step active";
        } else {
            dot3.className = "tracker-step";
        }

        // Update Remaining Count
        if (lockedStatusText) {
            const completedCount = (tasks.t1 ? 1 : 0) + (tasks.t2 ? 1 : 0) + (tasks.t3 ? 1 : 0);
            const remaining = 3 - completedCount;
            if (remaining > 0) {
                lockedStatusText.textContent = `สคริปต์ถูกล็อคอยู่ • เหลืออีก ${remaining} ภารกิจเพื่อปลดล็อค`;
            } else {
                lockedStatusText.textContent = `ปลดล็อคเรียบร้อยแล้ว!`;
            }
        }
    }

    function handleTaskClick(btn, link, waitSec, taskKey, stepNum, title, nextBtnToActivate, nextStepNum, nextIcon, nextTitle, nextHint) {
        if (tasks[taskKey]) return;
        if (currentTaskTimer) {
            clearInterval(currentTaskTimer);
            currentTaskTimer = null;
        }
        window.open(link, "_blank");

        let sec = waitSec;
        btn.disabled = true;
        btn.className = "btn-task loading";
        btn.innerHTML = `
            <div class="task-left">
                <div class="task-badge loading">${stepNum}</div>
                <div class="task-icon-box loading"><i data-lucide="loader-2" class="spin"></i></div>
                <div class="task-meta">
                    <span class="task-name">${title}</span>
                    <span class="task-hint loading-hint">กำลังตรวจสอบภารกิจ... (${sec} วินาที)</span>
                </div>
            </div>
            <div class="task-status">
                <span class="status-pill loading-pill"><i data-lucide="loader-2" class="spin"></i> ${sec}s</span>
            </div>
        `;
        refreshIcons();

        currentTaskTimer = setInterval(() => {
            sec--;
            if (sec > 0) {
                const hintEl = btn.querySelector(".task-hint");
                const pillEl = btn.querySelector(".status-pill");
                if (hintEl) hintEl.textContent = `กำลังตรวจสอบภารกิจ... (${sec} วินาที)`;
                if (pillEl) pillEl.innerHTML = `<i data-lucide="loader-2" class="spin"></i> ${sec}s`;
                refreshIcons();
            } else {
                clearInterval(currentTaskTimer);
                currentTaskTimer = null;
                tasks[taskKey] = true;
                setTaskDone(btn, stepNum, title);
                updateDots();

                if (nextBtnToActivate) {
                    resetTaskBtn(nextBtnToActivate, nextStepNum, nextIcon, nextTitle, nextHint, "primary-red", true);
                    refreshIcons();
                }

                checkAllCompleted();
            }
        }, 1000);
    }

    task1Btn.addEventListener("click", () => {
        let ytUrl = (SITE_CONFIG.unlockTasks && SITE_CONFIG.unlockTasks.youtubeChannelUrl) || "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1";
        if (ytUrl.includes("YOUR_CHANNEL")) ytUrl = "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1";
        handleTaskClick(
            task1Btn, 
            ytUrl, 
            5, 
            "t1", 
            "01", 
            "กดติดตาม YouTube / Subscribe", 
            task2Btn, 
            "02", 
            "message-square",
            "เข้าร่วม Discord / Join Discord", 
            "เปิดลิงก์และรอตรวจสอบ 5 วินาที"
        );
    });

    task2Btn.addEventListener("click", () => {
        if (!tasks.t1) {
            showToast("กรุณาทำภารกิจที่ 1 ให้เสร็จก่อนครับ");
            return;
        }
        let discordUrl = (SITE_CONFIG.unlockTasks && SITE_CONFIG.unlockTasks.affiliateUrl) || "";
        if (!discordUrl || discordUrl.includes("shopee.co.th")) {
            discordUrl = (SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.discord) || "https://discord.gg/your-discord";
        }
        handleTaskClick(
            task2Btn, 
            discordUrl, 
            5, 
            "t2", 
            "02", 
            "เข้าร่วม Discord / Join Discord", 
            task3Btn, 
            "03", 
            "thumbs-up",
            "กดไลค์ & คอมเมนต์ / Like & Comment", 
            "เปิดคลิปและรอตรวจสอบ 3 วินาที"
        );
    });

    task3Btn.addEventListener("click", () => {
        if (!tasks.t2) {
            showToast("กรุณาทำภารกิจที่ 2 ให้เสร็จก่อนครับ");
            return;
        }
        handleTaskClick(
            task3Btn, 
            SITE_CONFIG.unlockTasks.latestVideoUrl, 
            3, 
            "t3", 
            "03", 
            "กดไลค์ & คอมเมนต์ / Like & Comment", 
            null, 
            null, 
            null,
            null, 
            null
        );
    });

    function checkAllCompleted() {
        if (tasks.t1 && tasks.t2 && tasks.t3) {
            showToast("ยินดีด้วย! คุณปลดล็อคสคริปต์สำเร็จแล้ว");
            setTimeout(() => {
                tasksStack.style.display = "none";
                lockedLabel.style.display = "none";
                unlockedView.classList.add("show");
                refreshIcons();
            }, 500);
        }
    }

    btnCopyScript.addEventListener("click", () => {
        scriptCodeBox.select();
        const copySuccess = () => {
            btnCopyScript.className = "btn-copy-script copied";
            btnCopyScript.innerHTML = `<i data-lucide="check"></i> <span>คัดลอกสำเร็จแล้ว!</span>`;
            refreshIcons();
            showToast("คัดลอกโค้ดสคริปต์เรียบร้อยแล้ว");
            setTimeout(() => {
                btnCopyScript.className = "btn-copy-script";
                btnCopyScript.innerHTML = `<i data-lucide="copy"></i> <span>คัดลอกสคริปต์ (Copy Code)</span>`;
                refreshIcons();
            }, 2500);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(scriptCodeBox.value).then(copySuccess).catch(() => {
                document.execCommand("copy");
                copySuccess();
            });
        } else {
            document.execCommand("copy");
            copySuccess();
        }
    });

    closeLockerBtn.addEventListener("click", () => {
        if (currentTaskTimer) {
            clearInterval(currentTaskTimer);
            currentTaskTimer = null;
        }
        lockerModal.classList.remove("active");
    });
    lockerModal.addEventListener("click", (e) => {
        if (e.target === lockerModal) {
            if (currentTaskTimer) {
                clearInterval(currentTaskTimer);
                currentTaskTimer = null;
            }
            lockerModal.classList.remove("active");
        }
    });

    // Close modals with Escape key
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (lockerModal && lockerModal.classList.contains("active")) {
                lockerModal.classList.remove("active");
            }
            if (suncModal && suncModal.classList.contains("active")) {
                suncModal.classList.remove("active");
            }
        }
    });

    // =========================================================================
    // Sidebar & Mobile Drawer Interactions
    // =========================================================================
    function openMobileSidebar() {
        if (appSidebar) appSidebar.classList.add("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.add("active");
    }

    function closeMobileSidebar() {
        if (appSidebar) appSidebar.classList.remove("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileSidebar);
    if (bottomNavMenuBtn) bottomNavMenuBtn.addEventListener("click", openMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeMobileSidebar);

    if (mobileBottomNav) {
        mobileBottomNav.addEventListener("click", (e) => {
            const btn = e.target.closest(".bottom-nav-item");
            if (!btn || btn.id === "bottomNavMenuBtn") return;
            const nav = btn.dataset.nav;
            if (nav === "home") {
                switchView("home");
            } else if (nav === "feed") {
                activeFilter = btn.dataset.filter || "all";
                activeGame = null;
                switchView("feed");
            } else if (nav === "exploits") {
                switchView("exploits");
            }
        });
    }

    brandLogo.addEventListener("click", () => {
        closeMobileSidebar();
        switchView("home");
    });

    mainMenu.addEventListener("click", (e) => {
        const item = e.target.closest(".menu-item");
        if (!item) return;

        closeMobileSidebar();
        const nav = item.dataset.nav;
        if (nav === "home") {
            switchView("home");
            return;
        }
        if (nav === "exploits") {
            switchView("exploits");
            return;
        }

        activeFilter = item.dataset.filter || "all";
        activeGame = null;
        highlightSidebarItem("filter", activeFilter);

        if (activeFilter === "all") {
            currentViewTitle.textContent = "สคริปต์ทั้งหมด";
            currentViewDesc.textContent = "รวมสคริปต์ Roblox อัปเดตล่าสุดทุกเกม";
        } else if (activeFilter === "keyless") {
            currentViewTitle.textContent = "สคริปต์ไร้คีย์ (Keyless)";
            currentViewDesc.textContent = "ไม่ต้องใส่คีย์ เปิดแล้วรันได้ทันที";
        } else if (activeFilter === "mobile") {
            currentViewTitle.textContent = "สคริปต์รองรับมือถือ";
            currentViewDesc.textContent = "รองรับ Delta, Codex, Hydrogen บน Android/iOS";
        }

        switchView("feed");
    });

    gameMenu.addEventListener("click", (e) => {
        const item = e.target.closest(".menu-item");
        if (!item) return;

        closeMobileSidebar();
        activeGame = item.dataset.game;
        activeFilter = "all";
        highlightSidebarItem("game", activeGame);

        const gameName = item.querySelector(".menu-left").textContent.trim();
        currentViewTitle.textContent = `สคริปต์เกม ${gameName}`;
        currentViewDesc.textContent = `รวมสคริปต์ฟาร์มออโต้สำหรับ ${gameName}`;

        switchView("feed");
    });

    // Trending Game Tiles in Home
    if (trendingGamesGrid) {
        trendingGamesGrid.addEventListener("click", (e) => {
            const tile = e.target.closest(".game-tile");
            if (!tile) return;
            const game = tile.dataset.game;
            activeGame = game;
            activeFilter = "all";
            highlightSidebarItem("game", game);

            const name = tile.querySelector(".tile-name").textContent;
            currentViewTitle.textContent = `สคริปต์เกม ${name}`;
            currentViewDesc.textContent = `รวมสคริปต์ฟาร์มออโต้สำหรับ ${name}`;

            switchView("feed");
        });
    }

    // Home Action Buttons
    if (btnGoFeedAll) btnGoFeedAll.addEventListener("click", () => {
        activeFilter = "all";
        activeGame = null;
        highlightSidebarItem("filter", "all");
        currentViewTitle.textContent = "สคริปต์ทั้งหมด";
        switchView("feed");
    });

    if (btnSeeAllGames) btnSeeAllGames.addEventListener("click", () => {
        activeFilter = "all";
        activeGame = null;
        highlightSidebarItem("filter", "all");
        switchView("feed");
    });

    if (btnSeeAllScripts) btnSeeAllScripts.addEventListener("click", () => {
        activeFilter = "all";
        activeGame = null;
        highlightSidebarItem("filter", "all");
        switchView("feed");
    });

    // Filter Chips in Feed View
    if (filterChips) {
        filterChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".chip");
            if (!chip) return;
            filterChips.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilter = chip.dataset.tag;
            renderFeed();
        });
    }

    // Global Search
    globalSearch.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim();
        if (currentView === "home" && searchQuery) {
            switchView("feed");
        } else if (currentView === "exploits") {
            renderExploits();
        } else if (currentView === "feed") {
            renderFeed();
        }
    });

    function showToast(msg) {
        toastBar.textContent = msg;
        toastBar.classList.add("active");
        setTimeout(() => toastBar.classList.remove("active"), 2500);
    }

    // =========================================================================
    // Discord Support & Notice Popup (popup.png Modal with 24h dismissal)
    // =========================================================================
    function initSiteNoticePopup() {
        const popup = document.getElementById("siteNoticePopup");
        const closeBtn = document.getElementById("sitePopupCloseBtn");
        const closeNowBtn = document.getElementById("sitePopupCloseNowBtn");
        const dismiss24hBtn = document.getElementById("sitePopupDismiss24hBtn");
        const popupLink = document.getElementById("sitePopupLink");

        if (!popup) return;

        // Set Discord link dynamically from config if available
        if (popupLink) {
            const dcLink = (SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.discord) ||
                           (SITE_CONFIG.unlockTasks && SITE_CONFIG.unlockTasks.affiliateUrl) ||
                           "https://discord.gg/6x67MrtfbX";
            popupLink.href = dcLink;
        }

        // ตรวจสอบ URL query: หากใส่ ?reset_popup=1 หรือ ?reset=1 หรือ ?relock=1 ให้ล้างการจำ 24 ชม. ของป๊อปอัปด้วย
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("reset_popup") || urlParams.has("reset") || urlParams.has("relock")) {
            localStorage.removeItem("blacklist_popup_dismissed_until");
        }

        // ตรวจสอบว่าผู้ใช้เคยกด "ไม่ต้องแสดงอีก 24 ชั่วโมง" หรือไม่
        const dismissedUntil = localStorage.getItem("blacklist_popup_dismissed_until");
        if (dismissedUntil) {
            const exp = Number(dismissedUntil);
            if (!isNaN(exp) && Date.now() < exp) {
                // ยังอยู่ในช่วงเวลา 24 ชั่วโมงที่ไม่ต้องแสดง
                return;
            } else {
                localStorage.removeItem("blacklist_popup_dismissed_until");
            }
        }

        function showPopup() {
            if (isCurrentlyBanned) return;
            popup.style.display = "flex";
            requestAnimationFrame(() => {
                popup.classList.add("active");
            });
            refreshIcons();
        }

        function hidePopup(is24h = false) {
            popup.classList.remove("active");
            setTimeout(() => {
                popup.style.display = "none";
            }, 250);

            if (is24h) {
                const next24h = Date.now() + (24 * 60 * 60 * 1000);
                localStorage.setItem("blacklist_popup_dismissed_until", String(next24h));
                showToast("บันทึกแล้ว: จะไม่แสดงป๊อปอัปนี้อีกใน 24 ชั่วโมง");
            }
        }

        // ถ้าหน้าเว็บติดหน้าต่างล็อค LootLabs อยู่ ให้รอจนกว่าจะปลดล็อคก่อนจึงค่อยเด้งขึ้นมา
        const gateOverlay = document.getElementById("lootlabsGateOverlay");
        if (gateOverlay && gateOverlay.style.display !== "none" && !isGateAuthorized()) {
            const gateObserver = new MutationObserver(() => {
                if (gateOverlay.style.display === "none") {
                    gateObserver.disconnect();
                    setTimeout(showPopup, 600);
                }
            });
            gateObserver.observe(gateOverlay, { attributes: true, attributeFilter: ["style"] });
        } else {
            // หน่วงเวลาเล็กน้อยให้หน้าเว็บโหลดสมูท 700ms แล้วแสดง
            setTimeout(showPopup, 700);
        }

        if (closeBtn) {
            closeBtn.addEventListener("click", () => hidePopup(false));
        }

        if (closeNowBtn) {
            closeNowBtn.addEventListener("click", () => hidePopup(false));
        }

        if (dismiss24hBtn) {
            dismiss24hBtn.addEventListener("click", () => hidePopup(true));
        }

        // คลิกพื้นที่ว่างภายนอกกล่องเพื่อปิด
        popup.addEventListener("click", (e) => {
            if (e.target === popup) {
                hidePopup(false);
            }
        });
    }

    // Initialize App
    applySiteConfig();
    checkBanStatus();
    checkLootlabsGate();
    updateCategoryBadges();
    switchView("home");
    fetchExploits();
    syncDataFromServer();
    initSiteNoticePopup();
    refreshIcons();

    // Check ban status periodically (every 45s)
    setInterval(checkBanStatus, 45000);
});
