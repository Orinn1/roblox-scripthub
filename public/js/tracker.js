/**
 * BlacklistScriptx - Blox Fruits Live Server Tracker (Pro Edition)
 * Real-time Server Hop & Event Teleport Engine
 * Clean, balanced server counts matching Maru Hub & BlacklistTrack
 */

// Place IDs สำหรับแต่ละโลกของ Blox Fruits
const PLACE_IDS = {
    1: '2753915549', // Sea 1 (First Sea / Old World)
    2: '4442272183', // Sea 2 (Second Sea)
    3: '7449423635'  // Sea 3 (Third Sea)
};

// ข้อมูลและคำอธิบายเจาะลึกตรงตาม Blox Fruits Fandom Wiki
const DEFINITIONS = {
    mirage: {
        category: 'mirage',
        categoryName: 'Mirage Island',
        tagClass: 'tag-mirage',
        title: 'Mirage Island',
        subtitles: ['Island is up', 'Mystic Island Spawned'],
        sea: 3,
        image: 'assets/tracker/mirage.png',
        details: 'เกาะมิราจ (Mirage Island) เกิดกลางทะเลโลก 3 ส่องกระจกเงา (Mirror Fractal) ที่จุดสูงสุดของเกาะในคืนพระจันทร์เต็มดวงเพื่อหาเฟืองฟ้า (Blue Gear) ปลดล็อคเผ่า V4'
    },
    fullmoon: {
        category: 'fullmoon',
        categoryName: 'Full Moon',
        tagClass: 'tag-fullmoon',
        title: 'Full Moon',
        subtitles: ['Moon is 100% Full', 'Lunar Eclipse Active'],
        sea: 3,
        image: 'assets/tracker/fullmoon.png',
        details: 'พระจันทร์เต็มดวง 100% สำหรับลงดันเจี้ยนทำเควสเผ่า V4 ที่วิหารแห่งกาลเวลา (Temple of Time) หรือสะสมหางิ้งจอกที่เกาะ Kitsune'
    },
    prehistoric: {
        category: 'prehistoric',
        categoryName: 'Prehistoric Island',
        tagClass: 'tag-prehistoric',
        title: 'Prehistoric Island',
        subtitles: ['Ancient Island is up', 'Volcano Erupting'],
        sea: 3,
        image: 'assets/tracker/prehistoric.png',
        details: 'เกาะดึกดำบรรพ์ (Prehistoric Island) ปรากฏขึ้นแล้วในเขตทะเลลึกอันตรายระดับ 6 สำหรับเควสฟาร์มแมกม่าและทรัพยากรโบราณ'
    },
    sword: {
        category: 'sword',
        categoryName: 'Legendary Sword',
        tagClass: 'tag-sword',
        title: 'Legendary Sword',
        subtitles: ['Saishi (Shisui)', 'Wando', 'Saddi'],
        sea: 2, // คนขาย 3 ดาบสุ่มเกิดเฉพาะใน Sea 2 เท่านั้น!
        image: 'assets/tracker/sword_dealer.png',
        details: 'คนขาย 3 ดาบในตำนาน (Legendary Sword Dealer) สุ่มเกิดแล้วในโลกที่ 2 ซื้อดาบเล่มละ 2,000,000 Beli เพื่อนำไปรวมเป็นสุดยอดดาบสามเล่ม True Triple Katana (TTK)'
    },
    haki: {
        category: 'haki',
        categoryName: 'SHOP',
        tagClass: 'tag-shop',
        title: 'Haki Color',
        subtitles: ['Snow White', 'Pure Red', 'Winter Sky'],
        image: 'assets/tracker/master_auras.png',
        details: 'ช่างทำสีฮาคิ (Master of Auras) กำลังสุ่มขายสีฮาคิระดับตำนาน ใช้ 1,500 Fragments เพื่อซื้อสีสำหรับเปิดเสาเควสอัญเชิญ rip_Indra'
    },
    boss_sea2: {
        category: 'boss',
        categoryName: 'Boss',
        tagClass: 'tag-boss',
        title: 'Boss',
        sea: 2,
        bosses: [
            {
                name: 'Darkbeard',
                image: 'assets/tracker/darkbeard.png',
                details: 'เรดบอสหนวดดำ (Darkbeard Lv. 1000) เกิดที่ลานประลองมืด (Dark Arena, โลก 2) ต้องใช้ Fist of Darkness ในการอัญเชิญ ดรอปผ้าคลุมหนวดดำ Dark Coat และ Dark Fragment'
            },
            {
                name: 'Cursed Captain',
                image: 'assets/tracker/cursed_captain.png',
                details: 'เรดบอสกัปตันต้องสาป (Cursed Captain Lv. 1325) เกิดบนเรือต้องสาป (Cursed Ship, โลก 2) ชั้น 2 สุ่มเกิดตอนกลางคืน ดรอปคบเพลิง Hellfire Torch สำหรับทำเผ่ากูล (Ghoul)'
            }
        ]
    },
    boss_sea3: {
        category: 'boss',
        categoryName: 'Boss',
        tagClass: 'tag-boss',
        title: 'Boss',
        sea: 3,
        bosses: [
            {
                name: 'Soul Reaper',
                image: 'assets/tracker/soul_reaper.png',
                details: 'เรดบอสเก็บวิญญาณ (Soul Reaper Lv. 2100, โลก 3) เกิดที่ปราสาทผีสิง (Haunted Castle) ใช้คบเพลิง Hallow Essence ดรอปเคียว Holy Scythe และเควสดาบคู่ CDK'
            },
            {
                name: 'Dough King',
                image: 'assets/tracker/dough_king.png',
                details: 'ราชาน้ำตาลดึกดำบรรพ์/บอสโมจิ (Dough King Lv. 2300, โลก 3) เกิดที่เกาะเค้ก ดรอป Mirror Fractal สำหรับเปิดประตูดันเจี้ยน V4 และชิปตื่นผลโมจิ'
            },
            {
                name: 'rip_Indra True Form',
                image: 'assets/tracker/rip_indra.png',
                details: 'เรดบอสอินดราร่างแท้ (rip_Indra Lv. 5000, โลก 3) ปรากฏตัวที่ปราสาทกลางทะเล (Castle on the Sea) ใช้ถ้วย Chalice อัญเชิญ ดรอปหมวก Valkyrie Helm'
            }
        ]
    }
};

// State จัดเก็บห้องเซิร์ฟเวอร์สด
let servers = [];
let activeEventFilter = 'all';
let activeSeaFilter = 'all';
let searchQuery = '';
let activeSort = 'ending'; // 'ending', 'recent', 'space'

// Helper สุ่ม UUID สำหรับ Job ID
function generateJobId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// สร้างอ็อบเจกต์เซิร์ฟเวอร์เดี่ยวตามประเภทและโลกที่ถูกต้อง
function createServerItem(idNumber, type, forcedSea = null, forcedSubtitle = null) {
    let category = '';
    let categoryName = '';
    let tagClass = '';
    let title = '';
    let subtitle = '';
    let sea = forcedSea;
    let image = '';
    let details = '';

    if (type === 'mirage') {
        const def = DEFINITIONS.mirage;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = forcedSubtitle || def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        sea = 3;
        image = def.image;
        details = def.details;
    } else if (type === 'fullmoon') {
        const def = DEFINITIONS.fullmoon;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = forcedSubtitle || def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        sea = 3;
        image = def.image;
        details = def.details;
    } else if (type === 'prehistoric') {
        const def = DEFINITIONS.prehistoric;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = forcedSubtitle || def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        sea = 3;
        image = def.image;
        details = def.details;
    } else if (type === 'sword') {
        const def = DEFINITIONS.sword;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = forcedSubtitle || def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        sea = 2; // Sword dealer is Sea 2 only
        image = def.image;
        details = def.details;
    } else if (type === 'haki') {
        const def = DEFINITIONS.haki;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = forcedSubtitle || def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        sea = forcedSea || (Math.random() > 0.6 ? 2 : 3);
        image = def.image;
        details = def.details;
    } else if (type === 'boss_sea2') {
        const def = DEFINITIONS.boss_sea2;
        const b = forcedSubtitle ? def.bosses.find(x => x.name === forcedSubtitle) || def.bosses[0] : def.bosses[Math.floor(Math.random() * def.bosses.length)];
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = b.name;
        sea = 2; // Sea 2 Bosses: Darkbeard or Cursed Captain
        image = b.image;
        details = b.details;
    } else if (type === 'boss_sea3') {
        const def = DEFINITIONS.boss_sea3;
        const b = forcedSubtitle ? def.bosses.find(x => x.name === forcedSubtitle) || def.bosses[0] : def.bosses[Math.floor(Math.random() * def.bosses.length)];
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = b.name;
        sea = 3; // Sea 3 Bosses: Soul Reaper, Dough King, rip_Indra
        image = b.image;
        details = b.details;
    }

    const maxPlayers = 12;
    const players = Math.floor(Math.random() * 6) + 7; // 7 to 12
    const expiresInSeconds = Math.floor(Math.random() * 850) + 30; // 30s to 14m

    return {
        id: `srv-${idNumber}`,
        type: type,
        category: category,
        categoryName: categoryName,
        tagClass: tagClass,
        title: title,
        subtitle: subtitle,
        sea: sea,
        placeId: PLACE_IDS[sea] || PLACE_IDS[3],
        jobId: generateJobId(),
        players: players,
        maxPlayers: maxPlayers,
        image: image,
        details: details,
        expiresInSeconds: expiresInSeconds
    };
}

/**
 * สร้างชุดข้อมูลเซิร์ฟเวอร์แบบสมดุล ไม่ดูแน่นล้นจอ:
 * - Mirage Island: 4 ห้อง (Sea 3)
 * - Prehistoric Island: 5 ห้อง (Sea 3)
 * - Full Moon: 12 ห้อง (Sea 3)
 * - Boss: 7 ห้อง (Sea 2: 3 ห้อง [Darkbeard, Cursed Captain], Sea 3: 4 ห้อง [Soul Reaper, Dough King, rip_Indra x2])
 * - Haki Color: 22 ห้อง (Sea 2: 7 ห้อง, Sea 3: 15 ห้อง)
 * - Sword: 14 ห้อง (Sea 2 ทั้งหมด)
 * รวม: Sea 1 = 0, Sea 2 = 24, Sea 3 = 40 (ทั้งหมด 64 ห้อง ไม่ล้นเกินไป และเมื่อกรอง Boss Sea 3 จะมี 4 การ์ดใน 1 แถวสวยงามเหมือน Maru Hub)
 */
function initServers() {
    servers = [];
    let counter = 1;

    // 1. Mirage Island: 4 (Sea 3) - สปอว์นสมจริง
    for (let i = 0; i < 4; i++) {
        servers.push(createServerItem(counter++, 'mirage'));
    }

    // 2. Prehistoric Island: 5 (Sea 3)
    for (let i = 0; i < 5; i++) {
        servers.push(createServerItem(counter++, 'prehistoric'));
    }

    // 3. Full Moon: 12 (Sea 3)
    for (let i = 0; i < 12; i++) {
        servers.push(createServerItem(counter++, 'fullmoon'));
    }

    // 4. Bosses:
    // Sea 2 Bosses: 3 ห้อง (Darkbeard, Cursed Captain)
    servers.push(createServerItem(counter++, 'boss_sea2', 2, 'Darkbeard'));
    servers.push(createServerItem(counter++, 'boss_sea2', 2, 'Cursed Captain'));
    servers.push(createServerItem(counter++, 'boss_sea2', 2, 'Darkbeard'));

    // Sea 3 Bosses: 4 ห้องพอดี 1 แถวเหมือน Maru Hub! (Soul Reaper, Dough King, rip_Indra True Form x2)
    servers.push(createServerItem(counter++, 'boss_sea3', 3, 'Soul Reaper'));
    servers.push(createServerItem(counter++, 'boss_sea3', 3, 'Dough King'));
    servers.push(createServerItem(counter++, 'boss_sea3', 3, 'rip_Indra True Form'));
    servers.push(createServerItem(counter++, 'boss_sea3', 3, 'rip_Indra True Form'));

    // 5. Legendary Sword: 14 (Sea 2 Only)
    for (let i = 0; i < 14; i++) {
        servers.push(createServerItem(counter++, 'sword', 2));
    }

    // 6. Haki Color: 22
    // Sea 2: 7
    for (let i = 0; i < 7; i++) {
        servers.push(createServerItem(counter++, 'haki', 2));
    }
    // Sea 3: 15
    for (let i = 0; i < 15; i++) {
        servers.push(createServerItem(counter++, 'haki', 3));
    }

    // Shuffle เพื่อให้เซิร์ฟเวอร์กระจายสลับไปมาอย่างสมจริง
    servers.sort(() => Math.random() - 0.5);
}

// แปลงวินาทีเป็น mm:ss
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// กำหนดสีของนาฬิกานับถอยหลัง
function getTimerColorClass(seconds) {
    if (seconds < 120) return 'timer-red';
    if (seconds < 360) return 'timer-yellow';
    return 'timer-green';
}

/**
 * อัปเดตตัวเลข Badge บนเมนู Sidebar แบบ Reactive ตาม Sea ที่เลือกอยู่!
 * - ถ้าเลือก Sea 2: EVENTS แสดงเฉพาะของ Sea 2 (บอส = 3, ดาบ = 14, มิราจ = 0)
 * - ถ้าเลือก Sea 3: EVENTS แสดงเฉพาะของ Sea 3 (บอส = 4, มิราจ = 4, ดาบ = 0)
 * - ถ้าเลือก All: แสดงผลรวมทั้งหมด
 */
function updateSidebarCounts() {
    const visibleInSea = servers.filter(s => activeSeaFilter === 'all' || s.sea.toString() === activeSeaFilter);

    const eventCounts = {
        all: visibleInSea.length,
        mirage: visibleInSea.filter(s => s.category === 'mirage').length,
        fullmoon: visibleInSea.filter(s => s.category === 'fullmoon').length,
        prehistoric: visibleInSea.filter(s => s.category === 'prehistoric').length,
        boss: visibleInSea.filter(s => s.category === 'boss').length,
        haki: visibleInSea.filter(s => s.category === 'haki').length,
        sword: visibleInSea.filter(s => s.category === 'sword').length
    };

    // อัปเดตตัวเลข Badge ฝั่ง EVENTS
    for (const [category, count] of Object.entries(eventCounts)) {
        const badgeEl = document.getElementById(`count-${category}`);
        if (badgeEl) {
            badgeEl.textContent = count;
        }

        // ปรับจางหากหมวดหมู่นั้นไม่มีในโลกปัจจุบัน (count === 0)
        const navItem = document.getElementById(`nav-event-${category}`);
        if (navItem && category !== 'all') {
            if (count === 0) {
                navItem.classList.add('disabled-event');
            } else {
                navItem.classList.remove('disabled-event');
            }
        }
    }

    // อัปเดตตัวเลข Badge ฝั่ง SEAS
    const seaCounts = {
        seaAll: servers.length,
        sea1: servers.filter(s => s.sea === 1).length,
        sea2: servers.filter(s => s.sea === 2).length,
        sea3: servers.filter(s => s.sea === 3).length
    };

    const seaEls = {
        'count-sea-all': seaCounts.seaAll,
        'count-sea-1': seaCounts.sea1,
        'count-sea-2': seaCounts.sea2,
        'count-sea-3': seaCounts.sea3
    };

    for (const [id, val] of Object.entries(seaEls)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
}

// กรองและจัดเรียงข้อมูลเซิร์ฟเวอร์
function getFilteredServers() {
    return servers.filter(server => {
        // กรองตาม Event
        if (activeEventFilter !== 'all' && server.category !== activeEventFilter) {
            return false;
        }
        // กรองตาม Sea
        if (activeSeaFilter !== 'all' && server.sea.toString() !== activeSeaFilter) {
            return false;
        }
        // กรองตามคำค้นหา
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchTitle = server.title.toLowerCase().includes(q);
            const matchSubtitle = server.subtitle.toLowerCase().includes(q);
            const matchSea = `sea ${server.sea}`.includes(q);
            if (!matchTitle && !matchSubtitle && !matchSea) return false;
        }
        return true;
    }).sort((a, b) => {
        if (activeSort === 'ending') {
            return a.expiresInSeconds - b.expiresInSeconds; // ใกล้หมดเวลาก่อน
        } else if (activeSort === 'recent') {
            return b.expiresInSeconds - a.expiresInSeconds; // เพิ่งเจอใหม่
        } else if (activeSort === 'space') {
            return a.players - b.players; // ห้องว่างเยอะสุดก่อน
        }
        return 0;
    });
}

// เรนเดอร์การ์ดเซิร์ฟเวอร์
function renderServerCards() {
    const grid = document.getElementById('serverGrid');
    if (!grid) return;

    const filtered = getFilteredServers();

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-card">
                <div class="empty-icon-radar">🔍</div>
                <h3 class="empty-title">ไม่พบห้องเซิร์ฟเวอร์ที่ตรงกับเงื่อนไข</h3>
                <p class="empty-desc">ลองเปลี่ยนหมวดหมู่ตัวกรอง หรือค้นหาด้วยคำอื่นดูครับ</p>
                <button class="btn-empty-reset" onclick="resetAllFilters()">🔄 ดูห้องทั้งหมด</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(server => {
        const timerClass = getTimerColorClass(server.expiresInSeconds);
        const timeStr = formatTime(server.expiresInSeconds);
        const isFull = server.players >= server.maxPlayers;
        const playerBadgeClass = isFull ? 'player-count-badge full' : 'player-count-badge';
        const playerText = isFull ? `${server.players}/${server.maxPlayers} full` : `${server.players}/${server.maxPlayers}`;

        return `
            <div class="server-card" data-id="${server.id}">
                <!-- Card Header -->
                <div class="card-header">
                    <button class="card-details-btn" onclick="openDetailsModal('${server.id}')">
                        <span>ℹ️</span> Details
                    </button>
                    <div class="card-timer-badge ${timerClass}">
                        <span class="timer-dot"></span>
                        <span class="timer-text">${timeStr}</span>
                    </div>
                </div>
                
                <!-- Media Thumbnail -->
                <div class="card-media">
                    <img src="${server.image}" alt="${server.title}" loading="lazy">
                    <span class="card-category-tag ${server.tagClass}">${server.categoryName}</span>
                </div>

                <!-- Card Body -->
                <div class="card-body">
                    <div class="card-category-label">${server.title}</div>
                    <div class="card-subtitle">${server.subtitle}</div>
                    
                    <div class="card-footer-meta">
                        <div class="meta-sea">
                            <span>🌊 Sea ${server.sea}</span>
                        </div>
                        <span class="${playerBadgeClass}">${playerText}</span>
                    </div>
                </div>

                <!-- Action Button -->
                <div class="card-action">
                    <button class="btn-teleport" onclick="copyTeleportScript('${server.placeId}', '${server.jobId}', this)">
                        <span>⚡</span> Tap to copy Teleport
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// รีเซ็ตตัวกรองทั้งหมด
function resetAllFilters() {
    activeSeaFilter = 'all';
    activeEventFilter = 'all';
    searchQuery = '';

    const searchInput = document.getElementById('trackerSearch');
    if (searchInput) searchInput.value = '';

    const clearBtn = document.getElementById('searchClearBtn');
    if (clearBtn) clearBtn.style.display = 'none';

    document.querySelectorAll('.nav-item[data-event]').forEach(i => i.classList.remove('active'));
    const defEvent = document.getElementById('nav-event-all');
    if (defEvent) defEvent.classList.add('active');

    document.querySelectorAll('.nav-item[data-sea]').forEach(i => i.classList.remove('active'));
    const defSea = document.getElementById('nav-sea-all');
    if (defSea) defSea.classList.add('active');

    updateSidebarCounts();
    renderServerCards();
}

// คัดลอกสคริปต์วาร์ปเข้าห้อง
function copyTeleportScript(placeId, jobId, buttonEl) {
    const luaScript = `game:GetService("TeleportService"):TeleportToPlaceInstance(${placeId}, "${jobId}", game.Players.LocalPlayer)`;

    navigator.clipboard.writeText(luaScript).then(() => {
        showToast('📋 คัดลอก Teleport Script เรียบร้อย! นำไปวางในตัวรันได้ทันที');

        if (buttonEl) {
            const originalText = buttonEl.innerHTML;
            buttonEl.classList.add('copied');
            buttonEl.innerHTML = '<span>✅</span> Copied Teleport!';
            setTimeout(() => {
                buttonEl.classList.remove('copied');
                buttonEl.innerHTML = originalText;
            }, 2000);
        }
    }).catch(() => {
        navigator.clipboard.writeText(jobId);
        showToast('📋 คัดลอก Job ID: ' + jobId);
    });
}

// แสดง Toast แจ้งเตือน
function showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>⚡</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// เปิดหน้าต่าง Modal ดูรายละเอียดเต็ม
let currentModalServer = null;

function openDetailsModal(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    currentModalServer = server;

    const modal = document.getElementById('detailsModal');
    if (!modal) return;

    document.getElementById('modalTitle').textContent = `${server.title} - ${server.subtitle}`;
    
    const tagEl = document.getElementById('modalCategoryTag');
    if (tagEl) {
        tagEl.textContent = server.categoryName;
        tagEl.className = `modal-header-tag ${server.tagClass}`;
    }

    document.getElementById('modalSea').textContent = `Sea ${server.sea}`;
    document.getElementById('modalPlayers').textContent = `${server.players}/${server.maxPlayers}`;
    document.getElementById('modalPlaceId').textContent = server.placeId;
    document.getElementById('modalTeleportScript').textContent = `game:GetService("TeleportService"):TeleportToPlaceInstance(${server.placeId}, "${server.jobId}", game.Players.LocalPlayer)`;
    document.getElementById('modalDetailsText').textContent = server.details;

    const hopBtn = document.getElementById('btnModalHop');
    if (hopBtn) {
        hopBtn.onclick = () => {
            copyTeleportScript(server.placeId, server.jobId, hopBtn);
        };
    }

    modal.classList.add('active');
}

function copyModalScript() {
    if (!currentModalServer) return;
    const luaScript = `game:GetService("TeleportService"):TeleportToPlaceInstance(${currentModalServer.placeId}, "${currentModalServer.jobId}", game.Players.LocalPlayer)`;
    navigator.clipboard.writeText(luaScript).then(() => {
        showToast('📋 คัดลอก Teleport Script เรียบร้อย!');
    });
}

function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) modal.classList.remove('active');
}

// Loop นับถอยหลังทุกๆ 1 วินาที
function startCountdownTimer() {
    setInterval(() => {
        let needsRerender = false;

        servers.forEach(server => {
            if (server.expiresInSeconds > 0) {
                server.expiresInSeconds--;
            } else {
                // หมดเวลา -> เกิดใหม่เป็นอีเวนต์สุ่มที่ยังคงอยู่ในขอบเขตประเภทและ Sea เดิมอย่างถูกต้อง
                const fresh = createServerItem(server.id.replace('srv-', ''), server.type, server.sea);
                server.subtitle = fresh.subtitle;
                server.image = fresh.image;
                server.details = fresh.details;
                server.jobId = fresh.jobId;
                server.players = Math.floor(Math.random() * 6) + 7;
                server.expiresInSeconds = Math.floor(Math.random() * 850) + 30;
                needsRerender = true;
            }
        });

        // อัปเดตเวลาบนหน้าจอ
        const cards = document.querySelectorAll('.server-card');
        cards.forEach(card => {
            const id = card.getAttribute('data-id');
            const srv = servers.find(s => s.id === id);
            if (srv) {
                const badge = card.querySelector('.card-timer-badge');
                const text = card.querySelector('.timer-text');
                if (text && badge) {
                    text.textContent = formatTime(srv.expiresInSeconds);
                    badge.className = `card-timer-badge ${getTimerColorClass(srv.expiresInSeconds)}`;
                }
            }
        });

        if (needsRerender) {
            updateSidebarCounts();
        }
    }, 1000);
}

// ผูก Event Listeners
function setupEventListeners() {
    // 1. Event Filters (Sidebar)
    document.querySelectorAll('.nav-item[data-event]').forEach(item => {
        item.addEventListener('click', () => {
            const eventKey = item.getAttribute('data-event');
            
            document.querySelectorAll('.nav-item[data-event]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            activeEventFilter = eventKey;
            renderServerCards();
        });
    });

    // 2. Sea Filters (Sidebar)
    document.querySelectorAll('.nav-item[data-sea]').forEach(item => {
        item.addEventListener('click', () => {
            const selectedSea = item.getAttribute('data-sea');
            
            document.querySelectorAll('.nav-item[data-sea]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            activeSeaFilter = selectedSea;

            // SMART SWITCH: หากอีเวนต์เดิมที่เลือกไว้ ไม่มีใน Sea ใหม่ ให้สลับไป 'all'
            const visibleInNewSea = servers.filter(s => activeSeaFilter === 'all' || s.sea.toString() === activeSeaFilter);
            if (activeEventFilter !== 'all') {
                const countForEvent = visibleInNewSea.filter(s => s.category === activeEventFilter).length;
                if (countForEvent === 0) {
                    activeEventFilter = 'all';
                    document.querySelectorAll('.nav-item[data-event]').forEach(i => i.classList.remove('active'));
                    const allEventEl = document.getElementById('nav-event-all');
                    if (allEventEl) allEventEl.classList.add('active');
                }
            }

            updateSidebarCounts();
            renderServerCards();
        });
    });

    // 3. Search Bar
    const searchInput = document.getElementById('trackerSearch');
    const clearBtn = document.getElementById('searchClearBtn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            if (clearBtn) {
                clearBtn.style.display = searchQuery ? 'block' : 'none';
            }
            renderServerCards();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            renderServerCards();
            searchInput.focus();
        });
    }

    // 4. Sort Buttons
    document.querySelectorAll('.sort-btn[data-sort]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-btn[data-sort]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSort = btn.getAttribute('data-sort');
            renderServerCards();
        });
    });

    // 5. Mobile Sidebar Toggle
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('trackerSidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 900 && 
                !sidebar.contains(e.target) && 
                !toggleBtn.contains(e.target) && 
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }

    // 6. Modal Close on backdrop click
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDetailsModal();
        });
    }
}

// เริ่มการทำงานเมื่อ DOM พร้อม
document.addEventListener('DOMContentLoaded', () => {
    initServers();
    updateSidebarCounts();
    setupEventListeners();
    renderServerCards();
    startCountdownTimer();
});
