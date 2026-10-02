/**
 * BlacklistScriptx - Admin Backend Logic
 * Features: Edit Website Name, Add/Delete Scripts, Bulk Delete, SQLite DB Tools, Configure Links
 * Icons: Lucide Vector Icons (No Emojis)
 */

document.addEventListener("DOMContentLoaded", () => {
    try {
        const DB_FRESH_VERSION = "20261003_fresh_v2";
        if (localStorage.getItem("blacklist_scripts_db_version") !== DB_FRESH_VERSION) {
            localStorage.removeItem("nova_scripts_db");
            localStorage.removeItem("nova_scripts_db_global");
            sessionStorage.removeItem("nova_scripts_cache_time");
            sessionStorage.removeItem("nova_scripts_cache_time_global");
            localStorage.setItem("blacklist_scripts_db_version", DB_FRESH_VERSION);
        }
    } catch (e) {}

    let scripts = (typeof getScriptsData === "function") ? getScriptsData() : ((typeof window !== "undefined" && typeof window.getScriptsData === "function") ? window.getScriptsData() : []);
    let selectedIds = new Set();

    // Elements
    const loginScreen = document.getElementById("loginScreen");
    const loginForm = document.getElementById("loginForm");
    const pinInput = document.getElementById("pinInput");
    const adminDashboard = document.getElementById("adminDashboard");

    const tabs = document.querySelectorAll(".admin-tab");
    const tabSite = document.getElementById("tabSite");
    const tabManage = document.getElementById("tabManage");
    const tabAdd = document.getElementById("tabAdd");
    const tabDatabase = document.getElementById("tabDatabase");
    const tabLinks = document.getElementById("tabLinks");

    // Site Settings Form Elements
    const adminSiteForm = document.getElementById("adminSiteForm");
    const siteNameInput = document.getElementById("siteNameInput");
    const brandPrefixInput = document.getElementById("brandPrefixInput");
    const brandSuffixInput = document.getElementById("brandSuffixInput");
    const previewBrandTitle = document.getElementById("previewBrandTitle");
    const siteTaglineInput = document.getElementById("siteTaglineInput");
    const adminHeaderSiteTitle = document.getElementById("adminHeaderSiteTitle");

    // Scripts Form & Table Elements
    const addScriptForm = document.getElementById("addScriptForm");
    const scriptsTableBody = document.getElementById("scriptsTableBody");
    const countBadge = document.getElementById("countBadge");
    const searchManageScripts = document.getElementById("searchManageScripts");
    const btnGoAddTab = document.getElementById("btnGoAddTab");
    const selectAllCheckbox = document.getElementById("selectAllCheckbox");
    const btnDeleteSelected = document.getElementById("btnDeleteSelected");
    const selectedCount = document.getElementById("selectedCount");
    const lblAdminPageInfo = document.getElementById("lblAdminPageInfo");
    const btnAdminPrevPage = document.getElementById("btnAdminPrevPage");
    const btnAdminNextPage = document.getElementById("btnAdminNextPage");
    let adminCurrentPage = 1;
    const ADMIN_PAGE_SIZE = 25;

    // Database Tools Elements
    const dbStatTotal = document.getElementById("dbStatTotal");
    const dbStatSize = document.getElementById("dbStatSize");
    const btnClearAllDbBtn = document.getElementById("btnClearAllDbBtn");
    const btnResetDefaultDbBtn = document.getElementById("btnResetDefaultDbBtn");
    const btnExportJsonBtn = document.getElementById("btnExportJsonBtn");

    // Links Form Elements
    const adminLinksForm = document.getElementById("adminLinksForm");
    const linkYt = document.getElementById("linkYt");
    const linkShopee = document.getElementById("linkShopee");
    const linkVideo = document.getElementById("linkVideo");
    const linkDiscord = document.getElementById("linkDiscord");
    const linkSmartlink = document.getElementById("linkSmartlink");

    // Monetization & Gate Elements (ShrinkEarn / LootLabs)
    const gateEnableCheckbox = document.getElementById("gateEnableCheckbox");
    const adminGateProvider = document.getElementById("adminGateProvider");
    const adminGateToken = document.getElementById("adminGateToken");
    const btnRandomizeToken = document.getElementById("btnRandomizeToken");
    const adminGateUrl = document.getElementById("adminGateUrl");
    const adminGateExpiryHours = document.getElementById("adminGateExpiryHours");
    const lblAdminGateUrl = document.getElementById("lblAdminGateUrl");
    const descAdminGateUrl = document.getElementById("descAdminGateUrl");
    const adminShrinkearnApiToken = document.getElementById("adminShrinkearnApiToken");
    const adminGateTutorialUrl = document.getElementById("adminGateTutorialUrl");
    const btnAutoShortenShrinkearn = document.getElementById("btnAutoShortenShrinkearn");
    const shrinkearnGuideBox = document.getElementById("shrinkearnGuideBox");
    const lootlabsGuideBox = document.getElementById("lootlabsGuideBox");
    const blackpassGuideBox = document.getElementById("blackpassGuideBox");
    const blackpassLockerUrlHelper = document.getElementById("blackpassLockerUrlHelper");
    const btnCopyBlackpassHelper = document.getElementById("btnCopyBlackpassHelper");
    const shrinkearnTargetUrlHelper = document.getElementById("shrinkearnTargetUrlHelper");
    const btnCopyShrinkearnHelper = document.getElementById("btnCopyShrinkearnHelper");
    const btnRandomizeShrinkearnUrl = document.getElementById("btnRandomizeShrinkearnUrl");
    const lootlabsTargetUrlHelper = document.getElementById("lootlabsTargetUrlHelper");
    const btnCopyLootlabsHelper = document.getElementById("btnCopyLootlabsHelper");
    const lootlabsPostbackUrlHelper = document.getElementById("lootlabsPostbackUrlHelper");
    const btnCopyPostbackHelper = document.getElementById("btnCopyPostbackHelper");

    const adminToast = document.getElementById("adminToast");

    function refreshIcons() {
        if (window.lucide && window.lucide.icons) {
            if (!window.lucide.icons.Youtube) {
                window.lucide.icons.Youtube = [
                    ["path", { "d": "M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" }],
                    ["path", { "d": "m10 15 5-3-5-3z" }]
                ];
            }
            if (!window.lucide.icons.youtube) {
                window.lucide.icons.youtube = window.lucide.icons.Youtube;
            }
        }
        if (window.lucide && typeof lucide.createIcons === "function") {
            lucide.createIcons();
        }
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // 1. ตรวจสอบรหัสผ่าน Login & ระบบจดจำรหัสผ่านบนเครื่อง
    const ADMIN_PIN = "0927945086";
    const rememberAdminCheckbox = document.getElementById("rememberAdminCheckbox");
    const btnAdminLogout = document.getElementById("btnAdminLogout");

    function unlockAdminDashboard() {
        loginScreen.style.display = "none";
        adminDashboard.style.display = "block";
        initAdmin();
    }

    // ตรวจสอบสถานะการจดจำรหัสผ่านเดิม หากเคยเข้าสู่ระบบแล้วให้ผ่านทันทีโดยไม่ต้องใส่รหัสซ้ำ
    if (localStorage.getItem("blacklist_admin_auth") === "true") {
        unlockAdminDashboard();
    }

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (pinInput.value.trim() === ADMIN_PIN) {
            // บันทึกสิทธิ์เข้าใช้งานลง localStorage เพื่อไม่ต้องใส่รหัสอีก
            if (!rememberAdminCheckbox || rememberAdminCheckbox.checked) {
                localStorage.setItem("blacklist_admin_auth", "true");
            }
            unlockAdminDashboard();
            showToast("เข้าสู่ระบบหลังบ้านสำเร็จ! (จดจำสิทธิ์บนเครื่องนี้เรียบร้อย)");
        } else {
            alert("รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง");
            pinInput.value = "";
            pinInput.focus();
        }
    });

    // ปุ่มออกจากระบบ เพื่อให้แอดมินสามารถล้างการจำรหัสได้เมื่อต้องการ
    if (btnAdminLogout) {
        btnAdminLogout.addEventListener("click", () => {
            if (confirm("คุณต้องการออกจากระบบหลังบ้านใช่หรือไม่? (ระบบจะลืมรหัสผ่านที่จำไว้)")) {
                localStorage.removeItem("blacklist_admin_auth");
                location.reload();
            }
        });
    }

    async function initAdmin() {
        const selectDbTarget = document.getElementById("selectDbTarget");
        if (selectDbTarget && window.FirebaseDB) {
            selectDbTarget.value = window.FirebaseDB.getCollectionName();
            selectDbTarget.addEventListener("change", (e) => {
                const newCol = e.target.value;
                window.FirebaseDB.setTargetCollection(newCol);
                showToast(`สลับฐานข้อมูลไปยัง: ${newCol} กำลังโหลดใหม่...`);
                setTimeout(() => location.reload(), 600);
            });
        }

        await Promise.all([loadSiteConfig(), loadScriptsFromServer(), loadDbStats()]);
        refreshIcons();
    }

    // 2. สลับแท็บ
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const tName = tab.dataset.tab;
            tabSite.style.display = tName === "site" ? "block" : "none";
            tabManage.style.display = tName === "manage" ? "block" : "none";
            tabAdd.style.display = tName === "add" ? "block" : "none";
            tabDatabase.style.display = tName === "database" ? "block" : "none";
            tabLinks.style.display = tName === "links" ? "block" : "none";

            if (tName === "database") {
                loadDbStats();
            }
            refreshIcons();
        });
    });

    if (btnGoAddTab) {
        btnGoAddTab.addEventListener("click", () => {
            const addTabBtn = document.querySelector('[data-tab="add"]');
            if (addTabBtn) addTabBtn.click();
        });
    }

    // =========================================================================
    // 3. ตั้งค่าชื่อเว็บไซต์ (Site Name & Brand Config)
    async function loadSiteConfig() {
        const storageKey = window.getSiteConfigStorageKey ? window.getSiteConfigStorageKey() : "nova_site_config";
        let loadedFromFirebase = false;
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            try {
                const fbConfig = await window.FirebaseDB.getConfig();
                if (fbConfig && Object.keys(fbConfig).length > 0) {
                    if (window.mergeSiteConfig) window.mergeSiteConfig(fbConfig);
                    else Object.assign(SITE_CONFIG, fbConfig);
                    localStorage.setItem(storageKey, JSON.stringify(SITE_CONFIG));
                    loadedFromFirebase = true;
                }
            } catch (e) {
                console.warn("Firebase config notice:", e);
            }
        }
        try {
            const res = await fetch("/api/config");
            if (res.ok) {
                const config = await res.json();
                if (!loadedFromFirebase) {
                    if (window.mergeSiteConfig) window.mergeSiteConfig(config);
                    else Object.assign(SITE_CONFIG, config);
                    localStorage.setItem(storageKey, JSON.stringify(SITE_CONFIG));
                }
            }
        } catch (e) {
            console.warn("Using local SITE_CONFIG:", e);
        }

        siteNameInput.value = SITE_CONFIG.siteName || "BlacklistScriptx";
        brandPrefixInput.value = SITE_CONFIG.brandPrefix || "Blacklist";
        brandSuffixInput.value = SITE_CONFIG.brandSuffix || "Scriptx";
        siteTaglineInput.value = SITE_CONFIG.siteTagline || "";

        updateBrandPreview();
        loadLinks();
    }

    function updateBrandPreview() {
        const p = brandPrefixInput.value.trim() || "Blacklist";
        const s = brandSuffixInput.value.trim() || "Scriptx";
        previewBrandTitle.innerHTML = `${escapeHtml(p)}<span style="color: var(--red);">${escapeHtml(s)}</span>`;
    }

    brandPrefixInput.addEventListener("input", updateBrandPreview);
    brandSuffixInput.addEventListener("input", updateBrandPreview);

    adminSiteForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const siteName = siteNameInput.value.trim();
        const brandPrefix = brandPrefixInput.value.trim();
        const brandSuffix = brandSuffixInput.value.trim();
        const siteTagline = siteTaglineInput.value.trim();

        const updates = {
            siteName,
            brandPrefix,
            brandSuffix,
            siteTagline
        };

        if (window.mergeSiteConfig) window.mergeSiteConfig(updates);
        else Object.assign(SITE_CONFIG, updates);
        const storageKey = window.getSiteConfigStorageKey ? window.getSiteConfigStorageKey() : "nova_site_config";
        localStorage.setItem(storageKey, JSON.stringify(SITE_CONFIG));

        try {
            await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
        } catch (err) {
            console.warn("Failed to persist config to server:", err);
        }

        // Persist to Firebase Firestore
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            try {
                await window.FirebaseDB.saveConfig(SITE_CONFIG);
            } catch (fbErr) {
                console.warn("Failed to persist config to Firebase:", fbErr);
            }
        }

        document.title = `${siteName} - Admin Panel`;
        adminHeaderSiteTitle.textContent = `${siteName} - ระบบจัดการหลังบ้าน & ฐานข้อมูล SQLite`;
        showToast("บันทึกชื่อเว็บไซต์และการตั้งค่าเรียบร้อยแล้ว!");
    });

    // =========================================================================
    // 4. จัดการสคริปต์ (Add, Single Delete, Bulk Delete)
    // =========================================================================
    // Cloud Database (Firebase Firestore) Realtime Sync
    async function syncToCloudDb(scriptsToSave) {
        // ทำความสะอาดข้อมูล: ลบ views และ likes ออกจากทุกสคริปต์เพื่อไม่ให้รก DB
        if (Array.isArray(scriptsToSave)) {
            scriptsToSave.forEach(s => {
                delete s.views;
                delete s.likes;
            });
        }

        let saved = false;
        // 1. Primary: Firebase Firestore (50,000 Reads/วัน ฟรีตลอดชีพ)
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            try {
                saved = await window.FirebaseDB.saveScripts(scriptsToSave);
                if (saved) {
                    console.log("[Admin] Synced scripts to Firebase Firestore successfully!");
                } else {
                    console.warn("[Admin] Failed to save scripts to Firebase Firestore (saveScripts returned false)");
                }
            } catch (err) {
                console.warn("[Admin] Failed to sync to Firebase Firestore:", err);
            }
        }

        // 2. Secondary: JSONBin.io (Backup - เฉพาะเมื่อเปิดใช้งาน)
        if (SITE_CONFIG.cloudDb && SITE_CONFIG.cloudDb.enabled && SITE_CONFIG.cloudDb.binId && SITE_CONFIG.cloudDb.masterKey) {
            try {
                await fetch(`https://api.jsonbin.io/v3/b/${SITE_CONFIG.cloudDb.binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': SITE_CONFIG.cloudDb.masterKey
                    },
                    body: JSON.stringify({ scripts: scriptsToSave })
                });
                console.log("Synced scripts to JSONBin Cloud Database successfully!");
            } catch (err) {
                console.warn("Failed to sync to JSONBin Cloud:", err);
            }
        }
        return saved;
    }

    async function loadScriptsFromServer() {
        // 1. Try Firebase Firestore first
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            try {
                const fbScripts = await window.FirebaseDB.getScripts(true);
                if (Array.isArray(fbScripts)) {
                    scripts = fbScripts;
                    saveScriptsData(scripts);
                    selectedIds.clear();
                    updateSelectedUI();
                    renderTable();
                    return;
                }
            } catch (fbErr) {
                console.warn("Admin Firebase fetch notice:", fbErr);
            }
        }

        // 2. Try Cloud DB (JSONBin)
        if (SITE_CONFIG.cloudDb && SITE_CONFIG.cloudDb.enabled && SITE_CONFIG.cloudDb.binId) {
            try {
                const binRes = await fetch(`https://api.jsonbin.io/v3/b/${SITE_CONFIG.cloudDb.binId}/latest?meta=false`);
                if (binRes.ok) {
                    const binData = await binRes.json();
                    const remoteScripts = Array.isArray(binData) ? binData : (binData.scripts || []);
                    if (Array.isArray(remoteScripts) && remoteScripts.length > 0) {
                        scripts = remoteScripts;
                        saveScriptsData(scripts);
                        selectedIds.clear();
                        updateSelectedUI();
                        renderTable();
                        return;
                    }
                }
            } catch (cloudErr) {
                console.warn("Admin Cloud DB fetch notice:", cloudErr);
            }
        }

        // 2. Try Local Server
        try {
            const res = await fetch("/api/scripts");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    scripts = data;
                    saveScriptsData(scripts);
                }
            }
        } catch (e) {
            console.warn("Loaded scripts from localStorage:", e);
        }
        selectedIds.clear();
        updateSelectedUI();
        renderTable();
    }

    function updateSelectedUI() {
        if (selectedCount) selectedCount.textContent = selectedIds.size;
        if (btnDeleteSelected) {
            btnDeleteSelected.disabled = selectedIds.size === 0;
        }
        if (selectAllCheckbox) {
            const checkboxes = document.querySelectorAll(".script-check");
            if (checkboxes.length > 0 && selectedIds.size === checkboxes.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else if (selectedIds.size > 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        }
    }

    function renderTable() {
        countBadge.textContent = scripts.length;
        const q = (searchManageScripts ? searchManageScripts.value : "").trim().toLowerCase();

        const filtered = scripts.filter(s => {
            if (!q) return true;
            return (s.title && s.title.toLowerCase().includes(q)) ||
                   (s.game && s.game.toLowerCase().includes(q)) ||
                   (s.category && s.category.toLowerCase().includes(q));
        });

        const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
        if (adminCurrentPage > totalPages) adminCurrentPage = totalPages;
        if (adminCurrentPage < 1) adminCurrentPage = 1;

        if (filtered.length === 0) {
            scriptsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color: var(--text-muted);">ไม่พบสคริปต์ในฐานข้อมูล</td></tr>`;
            if (lblAdminPageInfo) lblAdminPageInfo.textContent = `หน้า 1 / 1 (0 รายการ)`;
            if (btnAdminPrevPage) btnAdminPrevPage.disabled = true;
            if (btnAdminNextPage) btnAdminNextPage.disabled = true;
            updateSelectedUI();
            return;
        }

        const startIndex = (adminCurrentPage - 1) * ADMIN_PAGE_SIZE;
        const pageItems = filtered.slice(startIndex, startIndex + ADMIN_PAGE_SIZE);

        scriptsTableBody.innerHTML = pageItems.map((s) => {
            const isChecked = selectedIds.has(s.id);
            return `
                <tr>
                    <td style="text-align: center;">
                        <input type="checkbox" class="script-check" data-id="${escapeHtml(s.id)}" ${isChecked ? 'checked' : ''} style="cursor: pointer;">
                    </td>
                    <td><img src="${escapeHtml(s.thumbnail)}" alt="Thumb" style="width:40px; height:40px; border-radius:6px; object-fit:cover;" onerror="this.src='https://placehold.co/80x80/1a1a24/ffffff?text=No+Img'"></td>
                    <td style="color:#fff; font-weight:600;">${escapeHtml(s.game)}</td>
                    <td style="color:var(--text-primary); font-weight:500;">
                        ${escapeHtml(s.title)}
                        ${s.title_en ? `<div style="font-size:11px; color:#38bdf8; margin-top:2px;">🇺🇸 ${escapeHtml(s.title_en)}</div>` : ''}
                        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                            ${escapeHtml(s.version || 'v1.0')}
                            ${s.thumbnail_en ? ' • <span style="color:#a855f7;">🖼 มีปก EN</span>' : ''}
                        </div>
                    </td>
                    <td><span class="tag-badge" style="font-size:11px;">${escapeHtml(s.category || 'all')}</span></td>
                    <td>${s.isKeyless ? '<span style="color:#4ade80; font-weight:500;">ไร้คีย์</span>' : '<span style="color:#9ca3af;">มีคีย์</span>'}</td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-edit" data-id="${escapeHtml(s.id)}" onclick="openEditModal('${escapeHtml(s.id)}')">
                            <i data-lucide="edit-3" style="width: 13px; height: 13px; pointer-events: none;"></i>
                            <span style="pointer-events: none;">แก้ไข</span>
                        </button>
                        <button type="button" class="btn-del" onclick="deleteScript('${escapeHtml(s.id)}', '${escapeHtml(s.title)}')">
                            <i data-lucide="trash-2" style="width: 13px; height: 13px; pointer-events: none;"></i>
                            <span style="pointer-events: none;">ลบ</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        // Update pagination UI
        if (lblAdminPageInfo) {
            lblAdminPageInfo.textContent = `หน้า ${adminCurrentPage} / ${totalPages} (แสดง ${pageItems.length} จาก ${filtered.length} รายการ)`;
        }
        if (btnAdminPrevPage) {
            btnAdminPrevPage.disabled = adminCurrentPage <= 1;
        }
        if (btnAdminNextPage) {
            btnAdminNextPage.disabled = adminCurrentPage >= totalPages;
        }

        // Attach checkbox event listeners
        scriptsTableBody.querySelectorAll(".script-check").forEach(cb => {
            cb.addEventListener("change", (e) => {
                const id = e.target.dataset.id;
                if (e.target.checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
                updateSelectedUI();
            });
        });

        updateSelectedUI();
        refreshIcons();
    }

    if (btnAdminPrevPage) {
        btnAdminPrevPage.addEventListener("click", () => {
            if (adminCurrentPage > 1) {
                adminCurrentPage--;
                renderTable();
            }
        });
    }

    if (btnAdminNextPage) {
        btnAdminNextPage.addEventListener("click", () => {
            adminCurrentPage++;
            renderTable();
        });
    }

    if (searchManageScripts) {
        searchManageScripts.addEventListener("input", () => {
            adminCurrentPage = 1;
            renderTable();
        });
    }

    // Select All Checkbox
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", (e) => {
            const checked = e.target.checked;
            const checkboxes = scriptsTableBody.querySelectorAll(".script-check");
            checkboxes.forEach(cb => {
                cb.checked = checked;
                const id = cb.dataset.id;
                if (checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
            });
            updateSelectedUI();
        });
    }

    // Bulk Delete Selected
    if (btnDeleteSelected) {
        btnDeleteSelected.addEventListener("click", async () => {
            const ids = Array.from(selectedIds);
            if (ids.length === 0) return;

            if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${ids.length} สคริปต์ที่เลือกออกจากฐานข้อมูล?\n\nการลบนี้จะมีผลทันทีและไม่สามารถกู้คืนได้`)) {
                return;
            }

            // Always update state & save
            scripts = scripts.filter(s => !selectedIds.has(s.id));
            saveScriptsData(scripts);
            selectedIds.clear();
            renderTable();
            loadDbStats();
            await syncToCloudDb(scripts);
            showToast(`ลบ ${ids.length} สคริปต์ออกจากฐานข้อมูลเรียบร้อยแล้ว!`);

            try {
                await fetch("/api/scripts/delete-multiple", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids })
                });
            } catch (err) {
                console.warn("Local server bulk delete notice:", err);
            }
        });
    }

    // ฟังก์ชันจัดการและบีบอัดรูปภาพจากเครื่อง (HTML5 Canvas Compression)
    function processImageFile(file, onReady) {
        if (!file || !file.type.startsWith("image/")) {
            showToast("กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP, GIF)", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // ปรับขนาดรูปไม่ให้เกิน 240px และบีบอัดให้อยู่ในขนาด ~5-8 KB เพื่อไม่ให้ฐานข้อมูล Firestore เต็มเร็ว
                let maxDim = 240;
                let w = img.width;
                let h = img.height;

                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);

                // บีบอัดเป็น WebP คุณภาพ 0.55 (ถ้าเบราว์เซอร์ไม่รองรับจะ fallback เป็น JPEG)
                let dataUrl = canvas.toDataURL("image/webp", 0.55);
                if (!dataUrl.startsWith("data:image/webp")) {
                    dataUrl = canvas.toDataURL("image/jpeg", 0.55);
                }

                // หากยังใหญ่เกิน 15KB ให้ย่อลงอีกรอบ
                if (dataUrl.length > 20000) {
                    const c2 = document.createElement("canvas");
                    c2.width = Math.round(w * 0.75);
                    c2.height = Math.round(h * 0.75);
                    c2.getContext("2d").drawImage(canvas, 0, 0, c2.width, c2.height);
                    dataUrl = c2.toDataURL("image/webp", 0.45);
                }

                const approxSizeKb = (dataUrl.length * 0.75 / 1024).toFixed(1);
                onReady(dataUrl, file.name, `${approxSizeKb} KB`);
            };
            img.onerror = function() {
                showToast("ไม่สามารถอ่านไฟล์รูปภาพนี้ได้", "error");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // จัดการอัปโหลดรูปภาพปกจากเครื่อง (Add Script Form)
    const sThumbFile = document.getElementById("sThumbFile");
    const sThumb = document.getElementById("sThumb");
    const sThumbPreviewBox = document.getElementById("sThumbPreviewBox");
    const sThumbPreviewImg = document.getElementById("sThumbPreviewImg");
    const sThumbFileName = document.getElementById("sThumbFileName");
    const sThumbFileSize = document.getElementById("sThumbFileSize");
    const btnRemoveThumb = document.getElementById("btnRemoveThumb");

    if (sThumbFile) {
        sThumbFile.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            processImageFile(file, (dataUrl, name, size) => {
                if (sThumb) sThumb.value = dataUrl;
                if (sThumbPreviewImg) sThumbPreviewImg.src = dataUrl;
                if (sThumbFileName) sThumbFileName.textContent = name;
                if (sThumbFileSize) sThumbFileSize.textContent = `✓ อัปโหลดสำเร็จ (${size})`;
                if (sThumbPreviewBox) sThumbPreviewBox.style.display = "flex";
                refreshIcons();
            });
        });
    }

    if (sThumb) {
        sThumb.addEventListener("input", () => {
            const val = sThumb.value.trim();
            if (val) {
                if (sThumbPreviewImg) sThumbPreviewImg.src = val;
                if (sThumbFileName) sThumbFileName.textContent = "ลิงก์รูปภาพออนไลน์";
                if (sThumbFileSize) sThumbFileSize.textContent = "✓ ตรวจพบ URL";
                if (sThumbPreviewBox) sThumbPreviewBox.style.display = "flex";
            } else {
                if (sThumbPreviewBox) sThumbPreviewBox.style.display = "none";
            }
        });
    }

    if (btnRemoveThumb) {
        btnRemoveThumb.addEventListener("click", () => {
            if (sThumb) sThumb.value = "";
            if (sThumbFile) sThumbFile.value = "";
            if (sThumbPreviewBox) sThumbPreviewBox.style.display = "none";
        });
    }

    // =========================================================================
    // Roblox Game Auto-Fetch Helper (Add & Edit Script Forms)
    // =========================================================================
    const robloxPlaceInput = document.getElementById("robloxPlaceInput");
    const btnFetchRobloxGame = document.getElementById("btnFetchRobloxGame");
    const robloxFetchStatus = document.getElementById("robloxFetchStatus");

    async function handleRobloxAutoFetch(inputEl, btnEl, statusEl, targets) {
        const rawVal = inputEl ? inputEl.value.trim() : "";
        if (!rawVal) {
            if (statusEl) {
                statusEl.style.display = "block";
                statusEl.style.background = "rgba(239, 68, 68, 0.12)";
                statusEl.style.border = "1px solid rgba(239, 68, 68, 0.3)";
                statusEl.style.color = "#f87171";
                statusEl.innerHTML = "⚠️ กรุณากรอก Place ID หรือวางลิงก์เกม Roblox ก่อนกดดึงข้อมูล";
            }
            if (inputEl) inputEl.focus();
            return;
        }

        const originalBtnHtml = btnEl ? btnEl.innerHTML : "";
        if (btnEl) {
            btnEl.disabled = true;
            btnEl.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px;"></i> <span>กำลังดึงข้อมูล...</span>`;
            refreshIcons();
        }
        if (statusEl) {
            statusEl.style.display = "block";
            statusEl.style.background = "rgba(14, 165, 233, 0.1)";
            statusEl.style.border = "1px solid rgba(14, 165, 233, 0.25)";
            statusEl.style.color = "#38bdf8";
            statusEl.innerHTML = `<span style="display: flex; align-items: center; gap: 6px;"><i data-lucide="loader-2" class="spin" style="width: 13px; height: 13px;"></i> กำลังเชื่อมต่อเซิร์ฟเวอร์ Roblox เพื่อดึงข้อมูล...</span>`;
            refreshIcons();
        }

        try {
            const resp = await fetch(`/api/roblox-game?input=${encodeURIComponent(rawVal)}`);
            const data = await resp.json();

            if (!resp.ok || !data.success) {
                throw new Error(data.error || "ไม่สามารถดึงข้อมูลเกมจาก Roblox ได้");
            }

            // Auto-fill target fields
            if (targets.gameInput) {
                targets.gameInput.value = data.cleanName || data.name;
            }
            if (targets.categoryInput && (!targets.categoryInput.value.trim() || targets.categoryInput.value === "all")) {
                targets.categoryInput.value = data.category || "";
            }
            if (targets.titleInput && !targets.titleInput.value.trim()) {
                targets.titleInput.value = `${data.cleanName || data.name} - Script`;
            }
            if (targets.titleEnInput && !targets.titleEnInput.value.trim()) {
                targets.titleEnInput.value = `${data.cleanName || data.name} Script - Auto Farm & Hub`;
            }
            if (targets.thumbInput) {
                targets.thumbInput.value = data.thumbnail || data.iconUrl || "";
                targets.thumbInput.dispatchEvent(new Event("input"));
            }
            if (targets.descInput && !targets.descInput.value.trim()) {
                const playingFmt = Number(data.playing).toLocaleString();
                targets.descInput.value = `สคริปต์ ${data.cleanName || data.name} (คนเล่นปัจจุบัน ~${playingFmt} คน) อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี`;
            }

            // Show Success Status
            const playingCount = Number(data.playing).toLocaleString();
            if (statusEl) {
                statusEl.style.display = "block";
                statusEl.style.background = "rgba(34, 197, 94, 0.12)";
                statusEl.style.border = "1px solid rgba(34, 197, 94, 0.3)";
                statusEl.style.color = "#4ade80";
                statusEl.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                        <span>✓ ดึงข้อมูลสำเร็จ: <b>${escapeHtml(data.name)}</b> (ผู้เล่นสด: <b>${playingCount}</b> คน)</span>
                        <span style="font-size: 11px; opacity: 0.85;">โดย ${escapeHtml(data.creator.name)}</span>
                    </div>
                `;
            }
            showToast(`ดึงข้อมูลเกม "${data.cleanName || data.name}" สำเร็จ!`);
        } catch (err) {
            console.error("Roblox auto-fetch failed:", err);
            if (statusEl) {
                statusEl.style.display = "block";
                statusEl.style.background = "rgba(239, 68, 68, 0.12)";
                statusEl.style.border = "1px solid rgba(239, 68, 68, 0.3)";
                statusEl.style.color = "#f87171";
                statusEl.innerHTML = `❌ ไม่สามารถดึงข้อมูลได้: ${escapeHtml(err.message)}`;
            }
            showToast(err.message, "error");
        } finally {
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.innerHTML = originalBtnHtml;
                refreshIcons();
            }
        }
    }

    if (btnFetchRobloxGame) {
        btnFetchRobloxGame.addEventListener("click", () => {
            handleRobloxAutoFetch(
                robloxPlaceInput,
                btnFetchRobloxGame,
                robloxFetchStatus,
                {
                    gameInput: document.getElementById("sGame"),
                    categoryInput: document.getElementById("sCategory"),
                    titleInput: document.getElementById("sTitle"),
                    titleEnInput: document.getElementById("sTitleEn"),
                    thumbInput: document.getElementById("sThumb"),
                    descInput: document.getElementById("sDesc")
                }
            );
        });
    }

    if (robloxPlaceInput) {
        robloxPlaceInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (btnFetchRobloxGame) btnFetchRobloxGame.click();
            }
        });
    }

    // เพิ่มสคริปต์ใหม่
    addScriptForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("sTitle").value.trim();
        const titleEn = document.getElementById("sTitleEn") ? document.getElementById("sTitleEn").value.trim() : title;
        const game = document.getElementById("sGame").value.trim();
        let category = document.getElementById("sCategory") ? document.getElementById("sCategory").value.trim().toLowerCase() : "";
        if (!category) {
            category = game.toLowerCase().replace(/[^a-z0-9]/g, "") || "all";
        }
        const version = (document.getElementById("sVersion") && document.getElementById("sVersion").value.trim()) || "v1.0";
        const desc = (document.getElementById("sDesc") && document.getElementById("sDesc").value.trim()) || `สคริปต์ ${game} อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี`;
        const descEn = document.getElementById("sDescEn") ? document.getElementById("sDescEn").value.trim() : "";
        const thumb = (document.getElementById("sThumb") && document.getElementById("sThumb").value.trim()) || "Logo.ico";
        const thumbEn = document.getElementById("sThumbEn") ? document.getElementById("sThumbEn").value.trim() : thumb;
        const code = document.getElementById("sCode") ? document.getElementById("sCode").value.trim() : "";

        const isKeyless = document.getElementById("sKeyless") ? document.getElementById("sKeyless").checked : true;
        const isMobile = document.getElementById("sMobile") ? document.getElementById("sMobile").checked : true;
        const isPC = document.getElementById("sPC") ? document.getElementById("sPC").checked : true;

        const sViewsInput = document.getElementById("sViews");
        const sLikesInput = document.getElementById("sLikes");
        const initialViews = sViewsInput ? (parseInt(sViewsInput.value, 10) || 0) : 1250;
        const newScript = {
            id: "script-" + Date.now(),
            title: title,
            title_en: titleEn,
            game: game,
            category: category,
            version: version,
            updated: "วันนี้",
            isKeyless: isKeyless,
            isMobile: isMobile,
            isPC: isPC,
            status: "working",
            badge: "มาใหม่",
            thumbnail: thumb,
            thumbnail_en: thumbEn,
            description: desc,
            description_en: descEn,
            loadstring: code
        };

        const submitBtn = addScriptForm.querySelector('button[type="submit"]');
        const origSubmitHtml = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px;"></i> กำลังบันทึกข้อมูล...`;
        }

        scripts.unshift(newScript);
        saveScriptsData(scripts);
        const cloudSaved = await syncToCloudDb(scripts);

        try {
            await fetch("/api/scripts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newScript)
            });
        } catch (err) {
            console.warn("Local server add notice:", err);
        }

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origSubmitHtml;
        }

        addScriptForm.reset();
        if (document.getElementById("sTitleEn")) document.getElementById("sTitleEn").value = "";
        if (document.getElementById("sDescEn")) document.getElementById("sDescEn").value = "";
        if (document.getElementById("sThumbEn")) document.getElementById("sThumbEn").value = "";
        if (robloxPlaceInput) robloxPlaceInput.value = "";
        if (robloxFetchStatus) robloxFetchStatus.style.display = "none";
        if (sThumbPreviewBox) sThumbPreviewBox.style.display = "none";
        if (sThumbFile) sThumbFile.value = "";
        renderTable();
        loadDbStats();
        
        if (cloudSaved) {
            showToast(`เพิ่มสคริปต์ "${title}" และบันทึกลง Cloud สำเร็จ!`);
        } else {
            showToast(`เพิ่มสคริปต์ "${title}" ในเครื่องสำเร็จ (แต่บันทึกลง Cloud ไม่ผ่าน)`, "error");
        }

        // สลับไปแท็บจัดการสคริปต์
        const manageTab = document.querySelector('[data-tab="manage"]');
        if (manageTab) manageTab.click();
    });

    // ลบสคริปต์เดี่ยว
    window.deleteScript = async function(id, title) {
        if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสคริปต์:\n"${title}"?\n\nการลบนี้จะมีผลทันทีและไม่สามารถกู้คืนได้`)) {
            return;
        }

        scripts = scripts.filter(s => s.id !== id);
        selectedIds.delete(id);
        saveScriptsData(scripts);
        await syncToCloudDb(scripts);
        renderTable();

        try {
            await fetch("/api/scripts/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
        } catch (err) {
            console.warn("Failed to delete from server:", err);
        }

        loadDbStats();
        showToast(`ลบสคริปต์ "${title}" เรียบร้อยแล้ว`);
    };

    // จัดการ Event Delegation สำหรับปุ่มแก้ไขในตาราง
    if (scriptsTableBody) {
        scriptsTableBody.addEventListener("click", (e) => {
            const editBtn = e.target.closest(".btn-edit");
            if (editBtn) {
                const id = editBtn.getAttribute("data-id");
                if (id) {
                    openEditModal(id);
                }
            }
        });
    }

    // แก้ไขสคริปต์ (Edit Script Modal Logic)
    window.openEditModal = function(id) {
        if (!scripts || scripts.length === 0) {
            scripts = getScriptsData();
        }
        const item = scripts.find(s => String(s.id) === String(id));
        if (!item) {
            console.warn("Script not found for ID:", id, "Available:", scripts);
            alert(`ไม่พบข้อมูลสคริปต์ (ID: ${id})`);
            return;
        }

        const editScriptId = document.getElementById("editScriptId");
        const editTitle = document.getElementById("editTitle");
        const editTitleEn = document.getElementById("editTitleEn");
        const editGame = document.getElementById("editGame");
        const editCategory = document.getElementById("editCategory");
        const editVersion = document.getElementById("editVersion");
        const editDesc = document.getElementById("editDesc");
        const editDescEn = document.getElementById("editDescEn");
        const editThumb = document.getElementById("editThumb");
        const editThumbEn = document.getElementById("editThumbEn");
        const editCode = document.getElementById("editCode");

        if (editScriptId) editScriptId.value = item.id;
        if (editTitle) editTitle.value = item.title || "";
        if (editTitleEn) editTitleEn.value = item.title_en || "";
        if (editGame) editGame.value = item.game || "";
        if (editCategory) editCategory.value = item.category || "";
        if (editVersion) editVersion.value = item.version || "v1.0";
        if (editDesc) editDesc.value = item.description || "";
        if (editDescEn) editDescEn.value = item.description_en || "";
        if (editThumb) editThumb.value = item.thumbnail || "";
        if (editThumbEn) editThumbEn.value = item.thumbnail_en || "";
        if (editCode) editCode.value = item.loadstring || "";

        const editViews = document.getElementById("editViews");
        const editLikes = document.getElementById("editLikes");
        if (editViews) editViews.value = item.views !== undefined ? item.views : 0;
        if (editLikes) editLikes.value = item.likes !== undefined ? item.likes : 0;

        const editKeyless = document.getElementById("editKeyless");
        const editMobile = document.getElementById("editMobile");
        const editPC = document.getElementById("editPC");

        if (editKeyless) editKeyless.checked = item.isKeyless !== false && item.isKeyless !== 0;
        if (editMobile) editMobile.checked = item.isMobile !== false && item.isMobile !== 0;
        if (editPC) editPC.checked = item.isPC !== false && item.isPC !== 0;

        // แสดงตัวอย่างรูปปกใน Modal แก้ไข
        const editThumbPreviewBox = document.getElementById("editThumbPreviewBox");
        const editThumbPreviewImg = document.getElementById("editThumbPreviewImg");
        const editThumbFileName = document.getElementById("editThumbFileName");
        const editThumbFileSize = document.getElementById("editThumbFileSize");
        const editThumbFile = document.getElementById("editThumbFile");
        if (editThumbFile) editThumbFile.value = "";

        if (item.thumbnail) {
            if (editThumbPreviewImg) editThumbPreviewImg.src = item.thumbnail;
            if (editThumbFileName) editThumbFileName.textContent = item.thumbnail.startsWith("data:") ? "รูปภาพปกอัปโหลดแล้ว" : "รูปภาพปกลิงก์ออนไลน์";
            if (editThumbFileSize) editThumbFileSize.textContent = "✓ มีรูปภาพปก";
            if (editThumbPreviewBox) editThumbPreviewBox.style.display = "flex";
        } else {
            if (editThumbPreviewBox) editThumbPreviewBox.style.display = "none";
        }

        const editModal = document.getElementById("editScriptModal");
        if (editModal) {
            editModal.classList.add("active");
            editModal.style.display = "flex";
            editModal.style.opacity = "1";
            editModal.style.visibility = "visible";
            refreshIcons();
        }
    };

    function closeEditModal() {
        const editModal = document.getElementById("editScriptModal");
        if (editModal) {
            editModal.classList.remove("active");
            editModal.style.display = "none";
            editModal.style.opacity = "0";
            editModal.style.visibility = "hidden";
        }
        const editThumbFile = document.getElementById("editThumbFile");
        if (editThumbFile) editThumbFile.value = "";
        const editThumbEn = document.getElementById("editThumbEn");
        if (editThumbEn) editThumbEn.value = "";
        const editTitleEn = document.getElementById("editTitleEn");
        if (editTitleEn) editTitleEn.value = "";
        const editDescEn = document.getElementById("editDescEn");
        if (editDescEn) editDescEn.value = "";
        const editRobloxPlaceInput = document.getElementById("editRobloxPlaceInput");
        if (editRobloxPlaceInput) editRobloxPlaceInput.value = "";
        const editRobloxFetchStatus = document.getElementById("editRobloxFetchStatus");
        if (editRobloxFetchStatus) editRobloxFetchStatus.style.display = "none";
    }

    const closeEditModalBtn = document.getElementById("closeEditModalBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const editScriptForm = document.getElementById("editScriptForm");

    if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);

    const editScriptModal = document.getElementById("editScriptModal");
    if (editScriptModal) {
        editScriptModal.addEventListener("click", (e) => {
            if (e.target === editScriptModal) closeEditModal();
        });
    }

    // จัดการอัปโหลดรูปภาพปกจากเครื่อง (Edit Script Modal)
    const editThumbFile = document.getElementById("editThumbFile");
    const editThumb = document.getElementById("editThumb");
    const editThumbPreviewBox = document.getElementById("editThumbPreviewBox");
    const editThumbPreviewImg = document.getElementById("editThumbPreviewImg");
    const editThumbFileName = document.getElementById("editThumbFileName");
    const editThumbFileSize = document.getElementById("editThumbFileSize");
    const btnRemoveEditThumb = document.getElementById("btnRemoveEditThumb");

    if (editThumbFile) {
        editThumbFile.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            processImageFile(file, (dataUrl, name, size) => {
                if (editThumb) editThumb.value = dataUrl;
                if (editThumbPreviewImg) editThumbPreviewImg.src = dataUrl;
                if (editThumbFileName) editThumbFileName.textContent = name;
                if (editThumbFileSize) editThumbFileSize.textContent = `✓ อัปโหลดสำเร็จ (${size})`;
                if (editThumbPreviewBox) editThumbPreviewBox.style.display = "flex";
                refreshIcons();
            });
        });
    }

    if (editThumb) {
        editThumb.addEventListener("input", () => {
            const val = editThumb.value.trim();
            if (val) {
                if (editThumbPreviewImg) editThumbPreviewImg.src = val;
                if (editThumbFileName) editThumbFileName.textContent = "ลิงก์รูปภาพออนไลน์";
                if (editThumbFileSize) editThumbFileSize.textContent = "✓ ตรวจพบ URL";
                if (editThumbPreviewBox) editThumbPreviewBox.style.display = "flex";
            } else {
                if (editThumbPreviewBox) editThumbPreviewBox.style.display = "none";
            }
        });
    }

    if (btnRemoveEditThumb) {
        btnRemoveEditThumb.addEventListener("click", () => {
            if (editThumb) editThumb.value = "";
            if (editThumbFile) editThumbFile.value = "";
            if (editThumbPreviewBox) editThumbPreviewBox.style.display = "none";
        });
    }

    // Roblox Game Auto-Fetch for Edit Modal
    const editRobloxPlaceInput = document.getElementById("editRobloxPlaceInput");
    const btnEditFetchRobloxGame = document.getElementById("btnEditFetchRobloxGame");
    const editRobloxFetchStatus = document.getElementById("editRobloxFetchStatus");

    if (btnEditFetchRobloxGame) {
        btnEditFetchRobloxGame.addEventListener("click", () => {
            handleRobloxAutoFetch(
                editRobloxPlaceInput,
                btnEditFetchRobloxGame,
                editRobloxFetchStatus,
                {
                    gameInput: document.getElementById("editGame"),
                    categoryInput: document.getElementById("editCategory"),
                    titleInput: null,
                    titleEnInput: document.getElementById("editTitleEn"),
                    thumbInput: document.getElementById("editThumb"),
                    descInput: null
                }
            );
        });
    }

    if (editRobloxPlaceInput) {
        editRobloxPlaceInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (btnEditFetchRobloxGame) btnEditFetchRobloxGame.click();
            }
        });
    }

    if (editScriptForm) {
        editScriptForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("editScriptId").value;
            const index = scripts.findIndex(s => String(s.id) === String(id));
            if (index === -1) {
                alert("ไม่พบสคริปต์ที่ต้องการแก้ไข");
                return;
            }

            const title = document.getElementById("editTitle").value.trim();
            const titleEn = document.getElementById("editTitleEn") ? document.getElementById("editTitleEn").value.trim() : "";
            const game = document.getElementById("editGame").value.trim();
            let category = document.getElementById("editCategory").value.trim().toLowerCase();
            if (!category) {
                category = game.toLowerCase().replace(/[^a-z0-9]/g, "") || "all";
            }
            const version = (document.getElementById("editVersion") && document.getElementById("editVersion").value.trim()) || scripts[index].version || "v1.0";
            const description = (document.getElementById("editDesc") && document.getElementById("editDesc").value.trim()) || scripts[index].description || `สคริปต์ ${game} อัปเดตล่าสุด ฟังก์ชันครบ ใช้งานง่าย ปลอดภัย`;
            const descriptionEn = document.getElementById("editDescEn") ? document.getElementById("editDescEn").value.trim() : (scripts[index].description_en || "");
            const thumbnail = (document.getElementById("editThumb") && document.getElementById("editThumb").value.trim()) || scripts[index].thumbnail || "Logo.ico";
            const thumbnailEn = document.getElementById("editThumbEn") ? document.getElementById("editThumbEn").value.trim() : (scripts[index].thumbnail_en || thumbnail);
            const loadstring = document.getElementById("editCode") ? document.getElementById("editCode").value.trim() : (scripts[index].loadstring || "");
            const isKeyless = document.getElementById("editKeyless") ? document.getElementById("editKeyless").checked : (scripts[index].isKeyless !== false);
            const isMobile = document.getElementById("editMobile") ? document.getElementById("editMobile").checked : (scripts[index].isMobile !== false);
            const isPC = document.getElementById("editPC") ? document.getElementById("editPC").checked : (scripts[index].isPC !== false);

            scripts[index] = {
                ...scripts[index],
                title,
                title_en: titleEn,
                game,
                category,
                version,
                description,
                description_en: descriptionEn,
                thumbnail,
                thumbnail_en: thumbnailEn,
                loadstring,
                isKeyless,
                isMobile,
                isPC,
                updated: "วันนี้"
            };
            delete scripts[index].views;
            delete scripts[index].likes;

            saveScriptsData(scripts);
            renderTable();
            closeEditModal();
            showToast(`แก้ไขสคริปต์ "${title}" เรียบร้อยแล้ว!`);

            // Sync to Firebase
            await syncToCloudDb(scripts);

            // Sync to local SQLite server if available
            try {
                await fetch("/api/scripts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(scripts[index])
                });
            } catch (err) {
                console.warn("Failed to sync edit to local server:", err);
            }

            loadDbStats();
        });
    }

    // =========================================================================
    // 5. จัดการฐานข้อมูล SQLite (Clear All, Reset Default, Export)
    // =========================================================================
    async function loadDbStats() {
        try {
            const res = await fetch("/api/db/stats");
            if (res.ok) {
                const data = await res.json();
                if (dbStatTotal) dbStatTotal.textContent = `${data.totalScripts} รายการ`;
                if (dbStatSize) dbStatSize.textContent = data.sizeFormatted || "-";
                return;
            }
        } catch (e) {}

        // Fallback: คำนวณขนาดจริงของข้อมูลสคริปต์เทียบกับโควต้า 1MB ของ Firestore
        const serialized = JSON.stringify(scripts || []);
        const sizeBytes = new Blob([serialized]).size;
        const sizeKb = (sizeBytes / 1024).toFixed(1);
        const pct = Math.min(100, Math.round((sizeBytes / 1048576) * 100));

        if (dbStatTotal) dbStatTotal.textContent = `${scripts.length} รายการ`;
        if (dbStatSize) {
            dbStatSize.textContent = `${sizeKb} KB / 1,024 KB (${pct}%)`;
            if (sizeBytes > 850000) {
                dbStatSize.style.color = "#ef4444";
                dbStatSize.title = "คำเตือน: ขนาดใกล้เต็มโควต้า 1MB ของ Firestore แล้ว กรุณาใช้ URL รูปภาพแทนการอัปโหลดไฟล์ตรง";
            } else if (sizeBytes > 500000) {
                dbStatSize.style.color = "#f59e0b";
                dbStatSize.title = "การใช้งานปานกลาง";
            } else {
                dbStatSize.style.color = "#10b981";
                dbStatSize.title = "สถานะปลอดภัย พื้นที่เพียงพอ";
            }
        }
    }

    // ล้างข้อมูลสคริปต์ทั้งหมดออกจาก Database
    if (btnClearAllDbBtn) {
        btnClearAllDbBtn.addEventListener("click", async () => {
            const confirmMsg = "คำเตือน: คุณต้องการลบสคริปต์ 'ทั้งหมด' ออกจากฐานข้อมูล ใช่หรือไม่?\n\nการกระทำนี้จะล้างข้อมูลสคริปต์ทุกตัวในระบบทันที!";
            if (!confirm(confirmMsg)) return;

            scripts = [];
            selectedIds.clear();
            saveScriptsData(scripts);
            renderTable();
            loadDbStats();
            syncToCloudDb(scripts);
            showToast("ล้างข้อมูลสคริปต์ทั้งหมดออกจากระบบเรียบร้อยแล้ว");

            try {
                await fetch("/api/db/clear", { method: "POST" });
            } catch (err) {
                console.warn("Local server clear notice:", err);
            }
        });
    }

    // รีเซ็ตฐานข้อมูลเป็นค่าเริ่มต้น
    if (btnResetDefaultDbBtn) {
        btnResetDefaultDbBtn.addEventListener("click", async () => {
            if (!confirm("ต้องการรีเซ็ตฐานข้อมูลและกู้คืนสคริปต์ตัวอย่างทั้งหมดกลับมาใช่หรือไม่?")) {
                return;
            }

            try {
                const res = await fetch("/api/db/reset", { method: "POST" });
                if (res.ok) {
                    await loadScriptsFromServer();
                } else {
                    scripts = (typeof INITIAL_SCRIPTS !== "undefined" && INITIAL_SCRIPTS.length > 0) ? INITIAL_SCRIPTS : [];
                    saveScriptsData(scripts);
                    syncToCloudDb(scripts);
                    renderTable();
                }
            } catch (err) {
                scripts = (typeof INITIAL_SCRIPTS !== "undefined" && INITIAL_SCRIPTS.length > 0) ? INITIAL_SCRIPTS : [];
                saveScriptsData(scripts);
                syncToCloudDb(scripts);
                renderTable();
            }
            loadDbStats();
            showToast("รีเซ็ตสคริปต์กลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว!");
        });
    }

    // ส่งออกไฟล์สำรอง JSON
    if (btnExportJsonBtn) {
        btnExportJsonBtn.addEventListener("click", () => {
            const jsonStr = JSON.stringify(scripts, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `scripts_db_backup_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("ดาวน์โหลดไฟล์สำรองเรียบร้อยแล้ว");
        });
    }

    // =========================================================================
    // 6. ลิงก์ Sub2Unlock
    // =========================================================================
    // =========================================================================
    // 6. ลิงก์สร้างรายได้ & ป้องกัน Bypass (ShrinkEarn / LootLabs)
    // =========================================================================
    const btnRandomizeTargetUrl = document.getElementById("btnRandomizeTargetUrl");
    let currentRandomParam = "";
    let currentShrinkearnRandomParam = "";

    function updateGateHelperUrl() {
        const origin = window.location.origin || "https://th.blacklisthub.workers.dev";
        const token = (adminGateToken && adminGateToken.value.trim()) ? adminGateToken.value.trim() : "blacklist_vip";

        // ลิงก์สำหรับ BlackPass Content Locker
        if (blackpassLockerUrlHelper) {
            blackpassLockerUrlHelper.value = `${origin}/gateflow/locker.html?slug=hub-access`;
        }

        // ลิงก์ปลายทางสำหรับ ShrinkEarn (มี Token + พารามิเตอร์กันซ้ำ)
        if (shrinkearnTargetUrlHelper) {
            shrinkearnTargetUrlHelper.value = `${origin}/?token=${encodeURIComponent(token)}${currentShrinkearnRandomParam}`;
        }

        // ลิงก์สำหรับ LootLabs
        if (lootlabsTargetUrlHelper) {
            lootlabsTargetUrlHelper.value = `${origin}/${currentRandomParam}`;
        }
        if (lootlabsPostbackUrlHelper) {
            lootlabsPostbackUrlHelper.value = `${origin}/api/lootlabs-postback?click_id={CLICK_ID}&ip={IP}&unique_id={UNIQUE_ID}`;
        }
    }

    // คัดลอกลิงก์ BlackPass Locker
    if (btnCopyBlackpassHelper) {
        btnCopyBlackpassHelper.addEventListener("click", () => {
            if (!blackpassLockerUrlHelper) return;
            blackpassLockerUrlHelper.select();
            navigator.clipboard.writeText(blackpassLockerUrlHelper.value).then(() => {
                showToast("📋 คัดลอกลิงก์ BlackPass Locker เรียบร้อยแล้ว!");
            }).catch(() => {
                document.execCommand("copy");
                showToast("📋 คัดลอกลิงก์เรียบร้อยแล้ว!");
            });
        });
    }

    // สลับหน้าจอแนะนำเมื่อเลือก Provider ต่างกัน
    function handleGateProviderChange() {
        const origin = window.location.origin || "https://th.blacklisthub.workers.dev";
        const provider = adminGateProvider ? adminGateProvider.value : "blackpass";

        if (provider === "shrinkme") {
            if (blackpassGuideBox) blackpassGuideBox.style.display = "none";
            if (shrinkearnGuideBox) shrinkearnGuideBox.style.display = "flex";
            if (lootlabsGuideBox) lootlabsGuideBox.style.display = "none";
            if (lblAdminGateUrl) lblAdminGateUrl.textContent = "ลิงก์สำหรับให้ผู้ใช้กด (Shortened Link จาก ShrinkMe.io)";
            if (descAdminGateUrl) descAdminGateUrl.textContent = "นำลิงก์ย่อที่ได้จาก ShrinkMe.io มาใส่ในช่องนี้";
            if (adminGateUrl) {
                adminGateUrl.placeholder = "https://shrinkme.click/xxxx";
                adminGateUrl.value = (SITE_CONFIG.lootlabsGate && (SITE_CONFIG.lootlabsGate.shrinkmeUrl || (SITE_CONFIG.lootlabsGate.provider === "shrinkme" ? (SITE_CONFIG.lootlabsGate.shrinkearnUrl || SITE_CONFIG.lootlabsGate.lootlabsUrl) : ""))) || "https://shrinkme.click/cBGgRn";
            }
        } else if (provider === "blackpass") {
            if (blackpassGuideBox) blackpassGuideBox.style.display = "flex";
            if (shrinkearnGuideBox) shrinkearnGuideBox.style.display = "none";
            if (lootlabsGuideBox) lootlabsGuideBox.style.display = "none";
            if (lblAdminGateUrl) lblAdminGateUrl.textContent = "ลิงก์สำหรับให้ผู้ใช้กด (BlackPass Content Locker)";
            if (descAdminGateUrl) descAdminGateUrl.textContent = "ลิงก์หน้า BlackPass Locker สำหรับทำภารกิจ 3 ด่าน (เช่น /gateflow/locker.html?slug=hub-access)";
            if (adminGateUrl) {
                adminGateUrl.placeholder = `${origin}/gateflow/locker.html?slug=hub-access`;
                const saved = SITE_CONFIG.lootlabsGate?.blackpassLockerUrl || (SITE_CONFIG.lootlabsGate?.provider === "blackpass" ? SITE_CONFIG.lootlabsGate?.shrinkearnUrl : "");
                adminGateUrl.value = saved || `${origin}/gateflow/locker.html?slug=hub-access`;
            }
        } else if (provider === "shrinkearn") {
            if (blackpassGuideBox) blackpassGuideBox.style.display = "none";
            if (shrinkearnGuideBox) shrinkearnGuideBox.style.display = "flex";
            if (lootlabsGuideBox) lootlabsGuideBox.style.display = "none";
            if (lblAdminGateUrl) lblAdminGateUrl.textContent = "ลิงก์สำหรับให้ผู้ใช้กด (Shortened Link จาก ShrinkEarn)";
            if (descAdminGateUrl) descAdminGateUrl.textContent = "นำลิงก์ย่อที่ได้จาก ShrinkEarn มาใส่ในช่องนี้";
            if (adminGateUrl) {
                adminGateUrl.placeholder = "https://shrinkearn.com/xxxx";
                adminGateUrl.value = (SITE_CONFIG.lootlabsGate && (SITE_CONFIG.lootlabsGate.shrinkearnUrl || (SITE_CONFIG.lootlabsGate.provider === "shrinkearn" ? SITE_CONFIG.lootlabsGate.lootlabsUrl : ""))) || "https://srnky.com/aehfqq0";
            }
        } else if (provider === "lootlabs") {
            if (blackpassGuideBox) blackpassGuideBox.style.display = "none";
            if (shrinkearnGuideBox) shrinkearnGuideBox.style.display = "none";
            if (lootlabsGuideBox) lootlabsGuideBox.style.display = "flex";
            if (lblAdminGateUrl) lblAdminGateUrl.textContent = "ลิงก์ LootLabs Anti-Bypass (สำหรับให้ผู้ใช้กด)";
            if (descAdminGateUrl) descAdminGateUrl.textContent = "ลิงก์ที่สร้างจากช่อง Redirect Link ใน LootLabs";
            if (adminGateUrl) {
                adminGateUrl.placeholder = "https://loot-link.com/s?xxxx";
                adminGateUrl.value = (SITE_CONFIG.lootlabsGate && SITE_CONFIG.lootlabsGate.lootlabsUrl) || "";
            }
        } else {
            // custom
            if (blackpassGuideBox) blackpassGuideBox.style.display = "none";
            if (shrinkearnGuideBox) shrinkearnGuideBox.style.display = "flex";
            if (lootlabsGuideBox) lootlabsGuideBox.style.display = "none";
            if (lblAdminGateUrl) lblAdminGateUrl.textContent = "ลิงก์ย่อสำหรับให้ผู้ใช้กด (Custom Shortened Link)";
            if (descAdminGateUrl) descAdminGateUrl.textContent = "นำลิงก์ย่อที่คุณสร้างมาใส่ในช่องนี้";
        }
        updateGateHelperUrl();
    }

    if (adminGateProvider) {
        adminGateProvider.addEventListener("change", handleGateProviderChange);
    }

    if (btnRandomizeTargetUrl) {
        btnRandomizeTargetUrl.addEventListener("click", () => {
            const randomVal = Math.floor(Math.random() * 9000 + 1000);
            currentRandomParam = `?v=${randomVal}`;
            updateGateHelperUrl();
            showToast(`สุ่ม URL สำเร็จ: ?v=${randomVal} (คัดลอกไปสร้างใน LootLabs ได้เลย)`);
        });
    }

    if (btnCopyLootlabsHelper) {
        btnCopyLootlabsHelper.addEventListener("click", () => {
            if (!lootlabsTargetUrlHelper) return;
            lootlabsTargetUrlHelper.select();
            navigator.clipboard.writeText(lootlabsTargetUrlHelper.value).then(() => {
                showToast("คัดลอกลิงก์ Redirect URL เรียบร้อยแล้ว!");
            }).catch(() => {
                document.execCommand("copy");
                showToast("คัดลอกลิงก์เรียบร้อยแล้ว!");
            });
        });
    }

    if (btnCopyPostbackHelper) {
        btnCopyPostbackHelper.addEventListener("click", () => {
            if (!lootlabsPostbackUrlHelper) return;
            lootlabsPostbackUrlHelper.select();
            navigator.clipboard.writeText(lootlabsPostbackUrlHelper.value).then(() => {
                showToast("คัดลอกลิงก์ Postback Webhook เรียบร้อยแล้ว!");
            }).catch(() => {
                document.execCommand("copy");
                showToast("คัดลอกลิงก์เรียบร้อยแล้ว!");
            });
        });
    }

    // ปุ่มล้างการจำเครื่องเพื่อทดสอบระบบ
    const btnResetDeviceLock = document.getElementById("btnResetDeviceLock");
    if (btnResetDeviceLock) {
        btnResetDeviceLock.addEventListener("click", async () => {
            btnResetDeviceLock.disabled = true;
            btnResetDeviceLock.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px;"></i> <span>กำลังล้างสถานะ...</span>`;
            if (window.lucide && lucide.createIcons) lucide.createIcons();

            // 1. ลบจาก LocalStorage และ SessionStorage
            localStorage.removeItem("blacklist_lootlabs_auth_expiry");
            localStorage.removeItem("blacklist_lootlabs_puid");
            localStorage.removeItem("blacklist_lootlabs_unlocked_event");
            sessionStorage.removeItem("blacklist_lootlabs_auth");
            sessionStorage.removeItem("blacklist_gate_clicked");
            sessionStorage.removeItem("blacklist_gate_click_time");

            // 2. เรียก API ลบ IP จากฐานข้อมูล Server
            try {
                await fetch("/api/reset-device-test");
            } catch (e) {
                console.warn("Reset device API call:", e);
            }

            showToast("ล้างการจำเครื่องเรียบร้อยแล้ว! กำลังนำไปหน้าล็อค...");
            setTimeout(() => {
                window.location.href = "index.html?lock=1";
            }, 800);
        });
    }

    function loadLinks() {
        if (!SITE_CONFIG.unlockTasks) SITE_CONFIG.unlockTasks = {};
        if (!SITE_CONFIG.socialLinks) SITE_CONFIG.socialLinks = {};
        if (!SITE_CONFIG.lootlabsGate) {
            SITE_CONFIG.lootlabsGate = {
                enabled: true,
                provider: "blackpass",
                token: "blacklist_vip",
                blackpassLockerUrl: "/gateflow/locker.html?slug=hub-access",
                shrinkearnUrl: "https://srnky.com/aehfqq0",
                shrinkearnApiToken: "3ce8c70d0c1e31404164f66164ea8f9117b29b69",
                lootlabsUrl: "",
                bypassMessage: "กรุณาเข้าใช้งานผ่านระบบยืนยันตัวตน BlackPass เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์ 24 ชั่วโมง"
            };
        }

        let ytUrl = SITE_CONFIG.unlockTasks.youtubeChannelUrl || "";
        if (!ytUrl || ytUrl.includes("YOUR_CHANNEL")) {
            ytUrl = "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1";
            SITE_CONFIG.unlockTasks.youtubeChannelUrl = ytUrl;
        }

        linkYt.value = ytUrl;
        linkShopee.value = SITE_CONFIG.unlockTasks.affiliateUrl || "https://omg10.com/4/11919655";
        linkVideo.value = SITE_CONFIG.unlockTasks.latestVideoUrl || "";
        linkDiscord.value = SITE_CONFIG.socialLinks.discord || "";
        if (linkSmartlink) linkSmartlink.value = SITE_CONFIG.adsterraSmartlinkUrl || "https://omg10.com/4/11911452";
        const linkExecutorDirect = document.getElementById("linkExecutorDirect");
        if (linkExecutorDirect) linkExecutorDirect.value = SITE_CONFIG.executorDirectLinkUrl || "https://omg10.com/4/11919658";

        // Populate Monetization Gate settings
        const gate = SITE_CONFIG.lootlabsGate;
        if (gateEnableCheckbox) gateEnableCheckbox.checked = Boolean(gate.enabled);
        if (adminGateProvider) adminGateProvider.value = gate.provider || "blackpass";
        if (adminGateToken) adminGateToken.value = gate.token || "blacklist_vip";
        if (adminGateExpiryHours) adminGateExpiryHours.value = gate.expiryHours || 24;
        if (adminShrinkearnApiToken) adminShrinkearnApiToken.value = gate.shrinkearnApiToken || "3ce8c70d0c1e31404164f66164ea8f9117b29b69";
        if (adminGateTutorialUrl) adminGateTutorialUrl.value = gate.tutorialVideoUrl || "https://youtu.be/FdXsvivWhOw";

        handleGateProviderChange();
        updateGateHelperUrl();
    }

    adminLinksForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        SITE_CONFIG.unlockTasks.youtubeChannelUrl = linkYt.value.trim();
        SITE_CONFIG.unlockTasks.affiliateUrl = linkShopee.value.trim();
        SITE_CONFIG.unlockTasks.latestVideoUrl = linkVideo.value.trim();
        SITE_CONFIG.socialLinks.discord = linkDiscord.value.trim();
        if (linkSmartlink) SITE_CONFIG.adsterraSmartlinkUrl = linkSmartlink.value.trim();
        const linkExecutorDirect = document.getElementById("linkExecutorDirect");
        if (linkExecutorDirect) SITE_CONFIG.executorDirectLinkUrl = linkExecutorDirect.value.trim();

        if (gateEnableCheckbox) {
            const provider = adminGateProvider ? adminGateProvider.value : "blackpass";
            const enteredUrl = adminGateUrl ? adminGateUrl.value.trim() : "";
            const currentGate = SITE_CONFIG.lootlabsGate || {};

            SITE_CONFIG.lootlabsGate = {
                ...currentGate,
                enabled: gateEnableCheckbox.checked,
                provider: provider,
                token: (adminGateToken ? adminGateToken.value.trim() : "blacklist_vip") || "blacklist_vip",
                shrinkmeUrl: provider === "shrinkme" ? enteredUrl : (currentGate.shrinkmeUrl || enteredUrl),
                blackpassLockerUrl: provider === "blackpass" ? enteredUrl : (currentGate.blackpassLockerUrl || "/gateflow/locker.html?slug=hub-access"),
                shrinkearnUrl: provider === "shrinkearn" ? enteredUrl : (currentGate.shrinkearnUrl || enteredUrl),
                shrinkearnApiToken: (adminShrinkearnApiToken ? adminShrinkearnApiToken.value.trim() : "3ce8c70d0c1e31404164f66164ea8f9117b29b69") || "3ce8c70d0c1e31404164f66164ea8f9117b29b69",
                tutorialVideoUrl: (adminGateTutorialUrl ? adminGateTutorialUrl.value.trim() : "https://youtu.be/FdXsvivWhOw") || "https://youtu.be/FdXsvivWhOw",
                lootlabsUrl: provider === "lootlabs" ? enteredUrl : (currentGate.lootlabsUrl || enteredUrl),
                expiryHours: adminGateExpiryHours ? (Number(adminGateExpiryHours.value) || 24) : 24,
                bypassMessage: provider === "shrinkme"
                    ? "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน ShrinkMe เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์ 24 ชั่วโมง"
                    : (provider === "blackpass"
                        ? "กรุณาเข้าใช้งานผ่านระบบยืนยันตัวตน BlackPass เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์ 24 ชั่วโมง"
                        : (provider === "shrinkearn"
                            ? "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน ShrinkEarn เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
                            : "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"))
            };
        }

        const storageKey = window.getSiteConfigStorageKey ? window.getSiteConfigStorageKey() : "nova_site_config";
        localStorage.setItem(storageKey, JSON.stringify(SITE_CONFIG));

        const updates = {
            unlockTasks: SITE_CONFIG.unlockTasks,
            socialLinks: SITE_CONFIG.socialLinks,
            lootlabsGate: SITE_CONFIG.lootlabsGate
        };

        try {
            await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
        } catch (err) {
            console.warn("Failed to sync links to server:", err);
        }

        // Sync links to Firebase
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            try {
                await window.FirebaseDB.saveConfig(SITE_CONFIG);
            } catch (fbErr) {
                console.warn("Failed to sync links to Firebase:", fbErr);
            }
        }

        showToast("บันทึกการตั้งค่าลิงก์และระบบกัน Bypass สำเร็จแล้ว!");
    });

    // =========================================================================
    // Banned IPs & Anti-Bypass Management in Admin Panel
    // =========================================================================
    const bannedIpsTableBody = document.getElementById("bannedIpsTableBody");
    const btnRefreshBans = document.getElementById("btnRefreshBans");
    const manualBanForm = document.getElementById("manualBanForm");
    const manualBanIp = document.getElementById("manualBanIp");
    const manualBanHours = document.getElementById("manualBanHours");
    const manualBanReason = document.getElementById("manualBanReason");

    async function loadBannedIps() {
        if (!bannedIpsTableBody) return;
        bannedIpsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);"><span class="table-spinner"></span> กำลังโหลดข้อมูล...</td></tr>`;

        try {
            const res = await fetch("/api/banned-ips?token=blacklist_vip");
            if (!res.ok) throw new Error("Failed to load banned list");
            const data = await res.json();
            const list = data.bans || [];

            if (list.length === 0) {
                bannedIpsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);"><i data-lucide="check-circle" style="width: 18px; height: 18px; color: #22c55e; vertical-align: middle; margin-right: 6px;"></i> ไม่มี IP ที่ถูกระงับการใช้งานในขณะนี้</td></tr>`;
                refreshIcons();
                return;
            }

            bannedIpsTableBody.innerHTML = list.map(item => {
                const remainingSec = Math.max(0, Math.floor((item.remainingMs || (item.bannedUntil - Date.now())) / 1000));
                const hrs = Math.floor(remainingSec / 3600);
                const mins = Math.floor((remainingSec % 3600) / 60);
                const timeStr = `${hrs} ชม. ${mins} นาที`;

                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 12px;"><code style="background: #000; color: #f87171; padding: 3px 8px; border-radius: 6px; font-size: 12px; border: 1px solid rgba(239, 68, 68, 0.3); font-family: monospace;">${escapeHtml(item.ip)}</code></td>
                        <td style="padding: 12px;"><span style="font-weight: 600; color: #fff;">${item.durationHours || 24} ชั่วโมง</span></td>
                        <td style="padding: 12px;"><span style="color: #fbbf24; font-weight: 500;">${timeStr}</span></td>
                        <td style="padding: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-muted);">${escapeHtml(item.reason || "-")}</td>
                        <td style="padding: 12px; text-align: right;">
                            <button type="button" class="btn-unban-action" data-ip="${escapeHtml(item.ip)}" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                                🔓 ปลดแบน
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");

            // Attach unban listeners
            bannedIpsTableBody.querySelectorAll(".btn-unban-action").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const targetIp = btn.dataset.ip;
                    if (!confirm(`ยืนยันการปลดบล็อก IP: ${targetIp} หรือไม่?`)) return;

                    btn.disabled = true;
                    btn.textContent = "กำลังปลด...";

                    try {
                        const res = await fetch("/api/banned-ips", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ token: "blacklist_vip", ip: targetIp, action: "unban" })
                        });
                        const result = await res.json();
                        if (result.success) {
                            showToast(`ปลดบล็อก IP ${targetIp} เรียบร้อยแล้ว!`);
                            loadBannedIps();
                        } else {
                            showToast("เกิดข้อผิดพลาดในการปลดบล็อก");
                            btn.disabled = false;
                            btn.textContent = "🔓 ปลดแบน";
                        }
                    } catch (e) {
                        showToast("เกิดข้อผิดพลาด: " + e.message);
                        btn.disabled = false;
                        btn.textContent = "🔓 ปลดแบน";
                    }
                });
            });

            refreshIcons();
        } catch (e) {
            bannedIpsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #ef4444;">โหลดข้อมูลไม่สำเร็จ: ${escapeHtml(e.message)}</td></tr>`;
        }
    }

    if (btnRefreshBans) {
        btnRefreshBans.addEventListener("click", () => {
            const icon = btnRefreshBans.querySelector("i");
            if (icon) icon.style.animation = "spin 0.8s linear infinite";
            loadBannedIps().finally(() => {
                if (icon) icon.style.animation = "";
            });
        });
    }

    if (manualBanForm) {
        manualBanForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const ip = manualBanIp.value.trim();
            const hours = Number(manualBanHours.value || 24);
            const reason = manualBanReason.value.trim();

            if (!ip) {
                showToast("กรุณากรอก IP Address");
                return;
            }

            try {
                const res = await fetch("/api/banned-ips", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        token: "blacklist_vip",
                        ip,
                        hours,
                        reason,
                        action: "ban"
                    })
                });
                const result = await res.json();
                if (result.success) {
                    showToast(`สั่งบล็อก IP ${ip} เป็นเวลา ${hours} ชม. สำเร็จ!`);
                    manualBanIp.value = "";
                    loadBannedIps();
                } else {
                    showToast("ไม่สามารถสั่งบล็อกได้: " + (result.error || "เกิดข้อผิดพลาด"));
                }
            } catch (err) {
                showToast("เกิดข้อผิดพลาด: " + err.message);
            }
        });
    }

    function showToast(msg) {
        adminToast.textContent = msg;
        adminToast.classList.add("active");
        setTimeout(() => adminToast.classList.remove("active"), 2500);
    }

    loadBannedIps();
    refreshIcons();
});
