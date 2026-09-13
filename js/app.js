/**
 * RocketScriptz App Logic
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

    // Social Links
    const sideYtBtn = document.getElementById("sideYtBtn");
    const sideDcBtn = document.getElementById("sideDcBtn");

    // Helper: Refresh Lucide Icons
    function refreshIcons() {
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
        if (sideYtBtn && SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.youtube) {
            sideYtBtn.href = SITE_CONFIG.socialLinks.youtube;
        }
        if (sideDcBtn && SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.discord) {
            sideDcBtn.href = SITE_CONFIG.socialLinks.discord;
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
            let [cfgRes, scpRes] = await Promise.all([
                fetch('/api/config').catch(() => null),
                fetch('/api/scripts').catch(() => null)
            ]);

            // Fallback for static hosting (e.g. GitHub Pages)
            if (!cfgRes || !cfgRes.ok) {
                cfgRes = await fetch('data/config.json').catch(() => null);
            }
            if (!scpRes || !scpRes.ok) {
                scpRes = await fetch('data/scripts.json').catch(() => null);
            }

            if (cfgRes && cfgRes.ok) {
                const cfg = await cfgRes.json();
                Object.assign(SITE_CONFIG, cfg);
                localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));
                applySiteConfig();
            }

            if (scpRes && scpRes.ok) {
                const scp = await scpRes.json();
                if (Array.isArray(scp) && scp.length > 0) {
                    scripts = scp;
                    localStorage.setItem("nova_scripts_db", JSON.stringify(scripts));
                    renderHomeRecent();
                    if (currentView === "feed") renderFeed();
                    updateCategoryBadges();
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
                Object.assign(SITE_CONFIG, JSON.parse(e.newValue));
                applySiteConfig();
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
        return `
            <div class="script-row">
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
                        <div><i data-lucide="eye"></i> ${formatNumber(item.views || 0)} ครั้ง</div>
                        <div><i data-lucide="thumbs-up"></i> ${formatNumber(item.likes || 0)} ถูกใจ</div>
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
        return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;
    }

    function renderHomeRecent() {
        const top3 = scripts.slice(0, 3);
        homeRecentScripts.innerHTML = top3.map(createScriptRow).join("");
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
    // Sub2Unlock Locker Logic (Faithful to reference design)
    // =========================================================================
    window.openLocker = function(id) {
        selectedScript = scripts.find(s => s.id === id);
        if (!selectedScript) return;

        tasks = { t1: false, t2: false, t3: false };
        scriptCodeBox.value = selectedScript.loadstring;

        tasksStack.style.display = "flex";
        lockedLabel.style.display = "block";
        unlockedView.classList.remove("show");

        resetTaskBtn(task1Btn, "shopping-cart", "กดดูโฆษณา 1 / Watch ads 1", "primary-red");
        resetTaskBtn(task2Btn, "shopping-cart", "กดดูโฆษณา 2 / Watch ads 2", "");
        resetTaskBtn(task3Btn, "thumbs-up", "กดไลค์และคอมเม้นต์ / Like & Comment", "");

        updateDots();
        lockerModal.classList.add("active");
        refreshIcons();
    };

    function resetTaskBtn(btn, icon, text, extraClass) {
        btn.disabled = false;
        btn.className = `btn-task ${extraClass}`;
        btn.innerHTML = `<i data-lucide="${icon}"></i> <span>${text}</span>`;
    }

    function setTaskDone(btn, text) {
        btn.disabled = true;
        btn.className = "btn-task done";
        btn.innerHTML = `<i data-lucide="check"></i> <span>${text}</span>`;
        refreshIcons();
    }

    function updateDots() {
        dot1.className = "i-dot" + (tasks.t1 ? " done" : " active");
        dot2.className = "i-dot" + (tasks.t2 ? " done" : (tasks.t1 ? " active" : ""));
        dot3.className = "i-dot" + (tasks.t3 ? " done" : (tasks.t2 ? " active" : ""));
    }

    function handleTaskClick(btn, link, waitSec, taskKey, doneText, nextBtnToActivate, nextExtraClass) {
        if (tasks[taskKey]) return;
        window.open(link, "_blank");

        let sec = waitSec;
        btn.disabled = true;
        btn.classList.add("loading");
        btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>กำลังตรวจสอบ... (${sec}วิ)</span>`;
        refreshIcons();

        const timer = setInterval(() => {
            sec--;
            if (sec > 0) {
                btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>กำลังตรวจสอบ... (${sec}วิ)</span>`;
                refreshIcons();
            } else {
                clearInterval(timer);
                tasks[taskKey] = true;
                setTaskDone(btn, doneText);
                updateDots();

                if (nextBtnToActivate && nextExtraClass) {
                    nextBtnToActivate.classList.add(nextExtraClass);
                }

                checkAllCompleted();
            }
        }, 1000);
    }

    task1Btn.addEventListener("click", () => {
        handleTaskClick(task1Btn, SITE_CONFIG.unlockTasks.youtubeChannelUrl, 5, "t1", "สำเร็จแล้ว 1/3", task2Btn, "primary-red");
    });

    task2Btn.addEventListener("click", () => {
        if (!tasks.t1) {
            showToast("กรุณาทำภารกิจที่ 1 ให้เสร็จก่อนครับ");
            return;
        }
        handleTaskClick(task2Btn, SITE_CONFIG.unlockTasks.affiliateUrl, 5, "t2", "สำเร็จแล้ว 2/3", task3Btn, "primary-red");
    });

    task3Btn.addEventListener("click", () => {
        if (!tasks.t2) {
            showToast("กรุณาทำภารกิจที่ 2 ให้เสร็จก่อนครับ");
            return;
        }
        handleTaskClick(task3Btn, SITE_CONFIG.unlockTasks.latestVideoUrl, 3, "t3", "ปลดล็อคสำเร็จ!", null, null);
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
        navigator.clipboard.writeText(scriptCodeBox.value).then(() => {
            btnCopyScript.innerHTML = `<i data-lucide="check"></i> <span>คัดลอกสำเร็จ!</span>`;
            refreshIcons();
            showToast("คัดลอกโค้ดสคริปต์เรียบร้อยแล้ว");
            setTimeout(() => {
                btnCopyScript.innerHTML = `<i data-lucide="copy"></i> <span>คัดลอกสคริปต์</span>`;
                refreshIcons();
            }, 2500);
        });
    });

    closeLockerBtn.addEventListener("click", () => lockerModal.classList.remove("active"));
    lockerModal.addEventListener("click", (e) => {
        if (e.target === lockerModal) lockerModal.classList.remove("active");
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

    // Initialize App
    applySiteConfig();
    updateCategoryBadges();
    switchView("home");
    fetchExploits();
    syncDataFromServer();
    refreshIcons();
});
