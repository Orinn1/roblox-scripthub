/**
 * RocketScriptz - Admin Backend Logic
 * Features: Edit Website Name, Add/Delete Scripts, Bulk Delete, SQLite DB Tools, Configure Links
 * Icons: Lucide Vector Icons (No Emojis)
 */

document.addEventListener("DOMContentLoaded", () => {
    let scripts = getScriptsData();
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

    // LootLabs Gate Elements
    const gateEnableCheckbox = document.getElementById("gateEnableCheckbox");
    const adminGateToken = document.getElementById("adminGateToken");
    const adminGateUrl = document.getElementById("adminGateUrl");
    const adminGateExpiryHours = document.getElementById("adminGateExpiryHours");
    const lootlabsTargetUrlHelper = document.getElementById("lootlabsTargetUrlHelper");
    const btnCopyLootlabsHelper = document.getElementById("btnCopyLootlabsHelper");

    const adminToast = document.getElementById("adminToast");

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

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // 1. ตรวจสอบรหัสผ่าน Login
    const ADMIN_PIN = "0927945086";

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (pinInput.value.trim() === ADMIN_PIN) {
            loginScreen.style.display = "none";
            adminDashboard.style.display = "block";
            initAdmin();
            showToast("เข้าสู่ระบบหลังบ้านสำเร็จ!");
        } else {
            alert("รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง");
            pinInput.value = "";
            pinInput.focus();
        }
    });

    async function initAdmin() {
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
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            try {
                const fbConfig = await window.FirebaseDB.getConfig();
                if (fbConfig) {
                    Object.assign(SITE_CONFIG, fbConfig);
                    localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));
                }
            } catch (e) {
                console.warn("Firebase config notice:", e);
            }
        }
        try {
            const res = await fetch("/api/config");
            if (res.ok) {
                const config = await res.json();
                Object.assign(SITE_CONFIG, config);
                localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));
            }
        } catch (e) {
            console.warn("Using local SITE_CONFIG:", e);
        }

        siteNameInput.value = SITE_CONFIG.siteName || "RocketScriptz";
        brandPrefixInput.value = SITE_CONFIG.brandPrefix || "Rocket";
        brandSuffixInput.value = SITE_CONFIG.brandSuffix || "Scriptz";
        siteTaglineInput.value = SITE_CONFIG.siteTagline || "";

        updateBrandPreview();
        loadLinks();
    }

    function updateBrandPreview() {
        const p = brandPrefixInput.value.trim() || "Rocket";
        const s = brandSuffixInput.value.trim() || "Scriptz";
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

        Object.assign(SITE_CONFIG, updates);
        localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));

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
    // Cloud Database (Firebase Firestore & JSONBin) Realtime Sync
    async function syncToCloudDb(scriptsToSave) {
        // 1. Primary: Firebase Firestore (50,000 Reads/วัน ฟรีตลอดชีพ)
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            try {
                await window.FirebaseDB.saveScripts(scriptsToSave);
                console.log("[Admin] Synced scripts to Firebase Firestore successfully!");
            } catch (err) {
                console.warn("[Admin] Failed to sync to Firebase Firestore:", err);
            }
        }

        // 2. Secondary: JSONBin.io (Backup)
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
    }

    async function loadScriptsFromServer() {
        // 1. Try Firebase Firestore first
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            try {
                const fbScripts = await window.FirebaseDB.getScripts(true);
                if (Array.isArray(fbScripts) && fbScripts.length > 0) {
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
                    scripts = remoteScripts;
                    saveScriptsData(scripts);
                    selectedIds.clear();
                    updateSelectedUI();
                    renderTable();
                    return;
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

        if (filtered.length === 0) {
            scriptsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color: var(--text-muted);">ไม่พบสคริปต์ในฐานข้อมูล</td></tr>`;
            updateSelectedUI();
            return;
        }

        scriptsTableBody.innerHTML = filtered.map((s) => {
            const isChecked = selectedIds.has(s.id);
            return `
                <tr>
                    <td style="text-align: center;">
                        <input type="checkbox" class="script-check" data-id="${escapeHtml(s.id)}" ${isChecked ? 'checked' : ''} style="cursor: pointer;">
                    </td>
                    <td><img src="${escapeHtml(s.thumbnail)}" alt="Thumb" style="width:40px; height:40px; border-radius:6px; object-fit:cover;"></td>
                    <td style="color:#fff; font-weight:600;">${escapeHtml(s.game)}</td>
                    <td style="color:var(--text-primary); font-weight:500;">
                        ${escapeHtml(s.title)}
                        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                            ${escapeHtml(s.version || 'v1.0')} • 👁 ${(s.views || 0).toLocaleString()} ครั้ง • 👍 ${(s.likes || 0).toLocaleString()} ถูกใจ
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

    if (searchManageScripts) {
        searchManageScripts.addEventListener("input", renderTable);
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
            syncToCloudDb(scripts);
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

    // เพิ่มสคริปต์ใหม่
    addScriptForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("sTitle").value.trim();
        const game = document.getElementById("sGame").value.trim();
        let category = document.getElementById("sCategory").value.trim().toLowerCase();
        if (!category) {
            category = game.toLowerCase().replace(/[^a-z0-9]/g, "") || "all";
        }
        const version = document.getElementById("sVersion").value.trim() || "v1.0";
        const desc = document.getElementById("sDesc").value.trim() || "สคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี";
        const thumb = document.getElementById("sThumb").value.trim() || "Logo.png";
        const code = document.getElementById("sCode").value.trim();

        const isKeyless = document.getElementById("sKeyless").checked;
        const isMobile = document.getElementById("sMobile").checked;
        const isPC = document.getElementById("sPC").checked;

        const sViewsInput = document.getElementById("sViews");
        const sLikesInput = document.getElementById("sLikes");
        const initialViews = sViewsInput ? (parseInt(sViewsInput.value, 10) || 0) : 1250;
        const initialLikes = sLikesInput ? (parseInt(sLikesInput.value, 10) || 0) : 95;

        const newScript = {
            id: "script-" + Date.now(),
            title: title,
            game: game,
            category: category,
            version: version,
            updated: "วันนี้",
            views: initialViews,
            likes: initialLikes,
            isKeyless: isKeyless,
            isMobile: isMobile,
            isPC: isPC,
            status: "working",
            badge: "มาใหม่",
            thumbnail: thumb,
            description: desc,
            loadstring: code
        };

        scripts.unshift(newScript);
        saveScriptsData(scripts);
        syncToCloudDb(scripts);

        try {
            await fetch("/api/scripts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newScript)
            });
        } catch (err) {
            console.warn("Local server add notice:", err);
        }

        addScriptForm.reset();
        renderTable();
        loadDbStats();
        showToast(`เพิ่มสคริปต์ "${title}" ลงในฐานข้อมูลเรียบร้อยแล้ว!`);

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
        syncToCloudDb(scripts);
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
        const editGame = document.getElementById("editGame");
        const editCategory = document.getElementById("editCategory");
        const editVersion = document.getElementById("editVersion");
        const editDesc = document.getElementById("editDesc");
        const editThumb = document.getElementById("editThumb");
        const editCode = document.getElementById("editCode");

        if (editScriptId) editScriptId.value = item.id;
        if (editTitle) editTitle.value = item.title || "";
        if (editGame) editGame.value = item.game || "";
        if (editCategory) editCategory.value = item.category || "";
        if (editVersion) editVersion.value = item.version || "v1.0";
        if (editDesc) editDesc.value = item.description || "";
        if (editThumb) editThumb.value = item.thumbnail || "";
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
            const game = document.getElementById("editGame").value.trim();
            let category = document.getElementById("editCategory").value.trim().toLowerCase();
            if (!category) {
                category = game.toLowerCase().replace(/[^a-z0-9]/g, "") || "all";
            }
            const version = document.getElementById("editVersion").value.trim() || "v1.0";
            const description = document.getElementById("editDesc").value.trim() || `สคริปต์ ${game} อัปเดตล่าสุด ฟังก์ชันครบ ใช้งานง่าย ปลอดภัย`;
            const thumbnail = document.getElementById("editThumb").value.trim() || scripts[index].thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80";
            const loadstring = document.getElementById("editCode").value.trim();
            const isKeyless = document.getElementById("editKeyless") ? document.getElementById("editKeyless").checked : true;
            const isMobile = document.getElementById("editMobile") ? document.getElementById("editMobile").checked : true;
            const isPC = document.getElementById("editPC") ? document.getElementById("editPC").checked : true;

            const editViews = document.getElementById("editViews");
            const editLikes = document.getElementById("editLikes");
            const views = editViews ? (parseInt(editViews.value, 10) || 0) : (scripts[index].views || 0);
            const likes = editLikes ? (parseInt(editLikes.value, 10) || 0) : (scripts[index].likes || 0);

            scripts[index] = {
                ...scripts[index],
                title,
                game,
                category,
                version,
                description,
                thumbnail,
                loadstring,
                isKeyless,
                isMobile,
                isPC,
                views,
                likes,
                updated: "วันนี้"
            };

            saveScriptsData(scripts);
            renderTable();
            closeEditModal();
            showToast(`แก้ไขสคริปต์ "${title}" เรียบร้อยแล้ว!`);

            // Sync to Firebase & JSONBin
            syncToCloudDb(scripts);

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
            }
        } catch (e) {
            if (dbStatTotal) dbStatTotal.textContent = `${scripts.length} รายการ`;
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
    function updateGateHelperUrl() {
        if (!lootlabsTargetUrlHelper) return;
        const token = (adminGateToken && adminGateToken.value.trim()) || "blacklist_vip";
        const origin = window.location.origin || "https://yoursite.vercel.app";
        lootlabsTargetUrlHelper.value = `${origin}/?auth=${encodeURIComponent(token)}`;
    }

    if (adminGateToken) {
        adminGateToken.addEventListener("input", updateGateHelperUrl);
    }

    if (btnCopyLootlabsHelper) {
        btnCopyLootlabsHelper.addEventListener("click", () => {
            if (!lootlabsTargetUrlHelper) return;
            lootlabsTargetUrlHelper.select();
            navigator.clipboard.writeText(lootlabsTargetUrlHelper.value).then(() => {
                showToast("คัดลอกลิงก์ปลายทาง LootLabs เรียบร้อยแล้ว!");
            }).catch(() => {
                document.execCommand("copy");
                showToast("คัดลอกลิงก์เรียบร้อยแล้ว!");
            });
        });
    }

    function loadLinks() {
        if (!SITE_CONFIG.unlockTasks) SITE_CONFIG.unlockTasks = {};
        if (!SITE_CONFIG.socialLinks) SITE_CONFIG.socialLinks = {};
        if (!SITE_CONFIG.lootlabsGate) {
            SITE_CONFIG.lootlabsGate = {
                enabled: true,
                token: "blacklist_vip",
                lootlabsUrl: "",
                bypassMessage: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน LootLabs เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
            };
        }

        let ytUrl = SITE_CONFIG.unlockTasks.youtubeChannelUrl || "";
        if (!ytUrl || ytUrl.includes("YOUR_CHANNEL")) {
            ytUrl = "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1";
            SITE_CONFIG.unlockTasks.youtubeChannelUrl = ytUrl;
        }

        linkYt.value = ytUrl;
        linkShopee.value = SITE_CONFIG.unlockTasks.affiliateUrl || "";
        linkVideo.value = SITE_CONFIG.unlockTasks.latestVideoUrl || "";
        linkDiscord.value = SITE_CONFIG.socialLinks.discord || "";

        // Populate LootLabs Gate settings
        if (gateEnableCheckbox) gateEnableCheckbox.checked = Boolean(SITE_CONFIG.lootlabsGate.enabled);
        if (adminGateToken) adminGateToken.value = SITE_CONFIG.lootlabsGate.token || "blacklist_vip";
        if (adminGateUrl) adminGateUrl.value = SITE_CONFIG.lootlabsGate.lootlabsUrl || "";
        if (adminGateExpiryHours) adminGateExpiryHours.value = SITE_CONFIG.lootlabsGate.expiryHours || 24;
        updateGateHelperUrl();
    }

    adminLinksForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        SITE_CONFIG.unlockTasks.youtubeChannelUrl = linkYt.value.trim();
        SITE_CONFIG.unlockTasks.affiliateUrl = linkShopee.value.trim();
        SITE_CONFIG.unlockTasks.latestVideoUrl = linkVideo.value.trim();
        SITE_CONFIG.socialLinks.discord = linkDiscord.value.trim();

        if (gateEnableCheckbox) {
            SITE_CONFIG.lootlabsGate = {
                enabled: gateEnableCheckbox.checked,
                token: (adminGateToken ? adminGateToken.value.trim() : "blacklist_vip") || "blacklist_vip",
                lootlabsUrl: adminGateUrl ? adminGateUrl.value.trim() : "",
                expiryHours: adminGateExpiryHours ? (Number(adminGateExpiryHours.value) || 24) : 24,
                bypassMessage: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน LootLabs เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
            };
        }

        localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));

        try {
            await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unlockTasks: SITE_CONFIG.unlockTasks,
                    socialLinks: SITE_CONFIG.socialLinks,
                    lootlabsGate: SITE_CONFIG.lootlabsGate
                })
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

    function showToast(msg) {
        adminToast.textContent = msg;
        adminToast.classList.add("active");
        setTimeout(() => adminToast.classList.remove("active"), 2500);
    }

    refreshIcons();
});
