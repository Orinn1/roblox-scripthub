/**
 * BlacklistScriptx - Blox Fruits Live Server Tracker (Pro Edition)
 * Real-time Server Hop & Event Teleport Engine
 * Calibrated strictly according to Blox Fruits Lore & Mechanics:
 * - Sea 1: 0 (No world raid / hopping events)
 * - Sea 2: 24 (Legendary Sword Dealer [17], Master of Auras [4], Sea 2 Bosses: Darkbeard & Cursed Captain [3])
 * - Sea 3: 66 (Mirage Island [12], Full Moon [13], Prehistoric Island [15], Sea 3 Bosses: Dough King, rip_Indra, Soul Reaper [17], Master of Auras [9])
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
        location: 'ทะเลลึก Danger 4-6 (หา Blue Gear)',
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
        location: 'วิหารกาลเวลา (Temple of Time) & Kitsune',
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
        location: 'โซนลาวา Danger 6 (ฟาร์มแมกม่า)',
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
        location: 'Colosseum / Green Zone / Graveyard',
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
        location: 'Master of Auras (ใช้ 1,500 Frags)',
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
                location: 'Dark Arena (ใช้ Fist of Darkness)',
                image: 'assets/tracker/darkbeard.png',
                details: 'เรดบอสหนวดดำ (Darkbeard Lv. 1000) เกิดที่ลานประลองมืด (Dark Arena, โลก 2) ต้องใช้ Fist of Darkness ในการอัญเชิญ ดรอปผ้าคลุมหนวดดำ Dark Coat และ Dark Fragment'
            },
            {
                name: 'Cursed Captain',
                location: 'Cursed Ship ชั้น 2 (สุ่มเกิดตอนกลางคืน)',
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
                name: 'Dough King',
                location: 'Cake Island (Mirror Fractal / Dough V2)',
                image: 'assets/tracker/dough_king.png',
                details: 'ราชาน้ำตาลดึกดำบรรพ์/บอสโมจิ (Dough King Lv. 2300, โลก 3) เกิดที่เกาะเค้ก ดรอป Mirror Fractal สำหรับเปิดประตูดันเจี้ยน V4 และชิปตื่นผลโมจิ'
            },
            {
                name: 'rip_Indra True Form',
                location: 'Castle on the Sea (God\'s Chalice & 3 Colors)',
                image: 'assets/tracker/rip_indra.png',
                details: 'เรดบอสอินดราร่างแท้ (rip_Indra Lv. 5000, โลก 3) ปรากฏตัวที่ปราสาทกลางทะเล (Castle on the Sea) ใช้ถ้วย Chalice อัญเชิญ ดรอปหมวก Valkyrie Helm'
            },
            {
                name: 'Soul Reaper',
                location: 'Haunted Castle (Hallow Essence / เควส CDK)',
                image: 'assets/tracker/soul_reaper.png',
                details: 'เรดบอสเก็บวิญญาณ (Soul Reaper Lv. 2100, โลก 3) เกิดที่ปราสาทผีสิง (Haunted Castle) ใช้คบเพลิง Hallow Essence ดรอปเคียว Holy Scythe และเควสดาบคู่ CDK'
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
function createServerItem(idNumber, type, forcedSea = null) {
    let category = '';
    let categoryName = '';
    let tagClass = '';
    let title = '';
    let subtitle = '';
    let location = '';
    let sea = forcedSea;
    let image = '';
    let details = '';

    if (type === 'mirage') {
        const def = DEFINITIONS.mirage;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        location = def.location;
        sea = 3;
        image = def.image;
        details = def.details;
    } else if (type === 'fullmoon') {
        const def = DEFINITIONS.fullmoon;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        location = def.location;
        sea = 3;
        image = def.image;
        details = def.details;
    } else if (type === 'prehistoric') {
        const def = DEFINITIONS.prehistoric;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        location = def.location;
        sea = 3;
        image = def.image;
        details = def.details;
    } else if (type === 'sword') {
        const def = DEFINITIONS.sword;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        location = def.location;
        sea = 2; // Sword dealer is Sea 2 only
        image = def.image;
        details = def.details;
    } else if (type === 'haki') {
        const def = DEFINITIONS.haki;
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = def.subtitles[Math.floor(Math.random() * def.subtitles.length)];
        location = def.location;
        sea = forcedSea || (Math.random() > 0.6 ? 2 : 3);
        image = def.image;
        details = def.details;
    } else if (type === 'boss_sea2') {
        const def = DEFINITIONS.boss_sea2;
        const b = def.bosses[Math.floor(Math.random() * def.bosses.length)];
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = b.name;
        location = b.location;
        sea = 2; // Sea 2 Bosses: Darkbeard or Cursed Captain
        image = b.image;
        details = b.details;
    } else if (type === 'boss_sea3') {
        const def = DEFINITIONS.boss_sea3;
        const b = def.bosses[Math.floor(Math.random() * def.bosses.length)];
        category = def.category;
        categoryName = def.categoryName;
        tagClass = def.tagClass;
        title = def.title;
        subtitle = b.name;
        location = b.location;
        sea = 3; // Sea 3 Bosses: Dough King, rip_Indra, Soul Reaper
        image = b.image;
        details = b.details;
    }

    const maxPlayers = 12;
    const players = Math.floor(Math.random() * 6) + 7; // 7 to 12
    const expiresInSeconds = Math.floor(Math.random() * 900) + 20; // 20s to 15m

    return {
        id: `srv-${idNumber}`,
        type: type,
        category: category,
        categoryName: categoryName,
        tagClass: tagClass,
        title: title,
        subtitle: subtitle,
        location: location,
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
 * สร้างชุดข้อมูลเซิร์ฟเวอร์ 90 ห้องตามการกระจายแท้จริง:
 * - Mirage Island: 12 ห้อง (Sea 3)
 * - Full Moon: 13 ห้อง (Sea 3)
 * - Prehistoric Island: 15 ห้อง (Sea 3)
 * - Boss: 20 ห้อง (Sea 2: 3 ห้อง [Darkbeard, Cursed Captain], Sea 3: 17 ห้อง [Dough King, rip_Indra, Soul Reaper])
 * - Haki Color: 13 ห้อง (Sea 2: 4 ห้อง, Sea 3: 9 ห้อง)
 * - Sword: 17 ห้อง (Sea 2 ทั้งหมด)
 * รวม: Sea 1 = 0, Sea 2 = 24, Sea 3 = 66 (ทั้งหมด 90 ห้องตรงเป๊ะ)
 */
function initServers() {
    servers = [];
    let counter = 1;

    // 1. Mirage Island: 12 (Sea 3)
    for (let i = 0; i < 12; i++) {
        servers.push(createServerItem(counter++, 'mirage'));
    }

    // 2. Full Moon: 13 (Sea 3)
    for (let i = 0; i < 13; i++) {
        servers.push(createServerItem(counter++, 'fullmoon'));
    }

    // 3. Prehistoric Island: 15 (Sea 3)
    for (let i = 0; i < 15; i++) {
        servers.push(createServerItem(counter++, 'prehistoric'));
    }

    // 4. Bosses: 20
    // Sea 2 Bosses: 3 (Darkbeard, Cursed Captain)
    for (let i = 0; i < 3; i++) {
        servers.push(createServerItem(counter++, 'boss_sea2'));
    }
    // Sea 3 Bosses: 17 (Dough King, rip_Indra True Form, Soul Reaper)
    for (let i = 0; i < 17; i++) {
        servers.push(createServerItem(counter++, 'boss_sea3'));
    }

    // 5. Haki Color: 13
    // Sea 2: 4
    for (let i = 0; i < 4; i++) {
        servers.push(createServerItem(counter++, 'haki', 2));
    }
    // Sea 3: 9
    for (let i = 0; i < 9; i++) {
        servers.push(createServerItem(counter++, 'haki', 3));
    }

    // 6. Legendary Sword: 17 (Sea 2 Only)
    for (let i = 0; i < 17; i++) {
        servers.push(createServerItem(counter++, 'sword', 2));
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
 * - ถ้าเลือก Sea 2: ตรง EVENTS จะเปลี่ยนตัวเลขตามเซิร์ฟเวอร์ใน Sea 2 เท่านั้น (เช่น บอส = 3, ดาบ = 17, มิราจ = 0)
 * - ถ้าเลือก Sea 3: ตรง EVENTS จะเปลี่ยนตัวเลขตามเซิร์ฟเวอร์ใน Sea 3 (เช่น บอส = 17, มิราจ = 12, ดาบ = 0)
 * - ถ้าเลือก All: แสดงผลรวมทั้งหมด
 */
function updateSidebarCounts() {
    // เซิร์ฟเวอร์ใน Sea ที่กำลังเลือกอยู่
    const visibleInSea = servers.filter(s => activeSeaFilter === 'all' || s.sea.toString() === activeSeaFilter);

    // คำนวณตัวเลขอีเวนต์ตาม Sea ที่กำลังเลือก
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

        // เพิ่ม class disabled-event หากหมวดหมู่นั้นไม่มีในโลกปัจจุบัน (count === 0)
        const navItem = document.getElementById(`nav-event-${category}`);
        if (navItem && category !== 'all') {
            if (count === 0) {
                navItem.classList.add('disabled-event');
                navItem.title = `ไม่มีอีเวนต์นี้ใน ${activeSeaFilter === '2' ? 'Sea 2 (มีเฉพาะใน Sea 3)' : activeSeaFilter === '3' ? 'Sea 3 (มีเฉพาะใน Sea 2)' : 'โลกนี้'}`;
            } else {
                navItem.classList.remove('disabled-event');
                navItem.removeAttribute('title');
            }
        }
    }

    // อัปเดตตัวเลข Badge ฝั่ง SEAS (คงจำนวนเซิร์ฟเวอร์ของแต่ละโลก)
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

    // อัปเดตป้ายแจ้งเตือนด้านบน EVENTS
    const hintEl = document.getElementById('seaEventHint');
    if (hintEl) {
        if (activeSeaFilter === 'all') {
            hintEl.textContent = 'All Seas (90)';
        } else {
            hintEl.textContent = `Filtered in Sea ${activeSeaFilter} (${visibleInSea.length})`;
        }
    }
}

// อัปเดตชิปตัวกรองด้านบนของ Grid (Filter Chips Bar)
function renderFilterChips() {
    const container = document.getElementById('filterChipsContainer');
    const statText = document.getElementById('trackerStatText');
    if (!container) return;

    const filtered = getFilteredServers();

    let html = '';

    // Chip Sea
    let seaLabel = 'ทุกโลก (All seas)';
    if (activeSeaFilter === '2') seaLabel = '🚢 Sea 2';
    if (activeSeaFilter === '3') seaLabel = '⚓ Sea 3';
    if (activeSeaFilter === '1') seaLabel = '⛵ Sea 1';

    html += `<span class="filter-chip active-chip">🌊 โลก: <strong>${seaLabel}</strong></span>`;

    // Chip Event
    if (activeEventFilter !== 'all') {
        const eventNames = {
            mirage: '🏝️ Mirage Island',
            fullmoon: '🌕 Full Moon',
            prehistoric: '🌋 Prehistoric Island',
            boss: '👹 Raid Boss',
            haki: '🎨 Haki Color',
            sword: '⚔️ Legendary Sword'
        };
        html += `<span class="filter-chip active-chip">🎯 อีเวนต์: <strong>${eventNames[activeEventFilter] || activeEventFilter}</strong></span>`;
    }

    // Chip Search
    if (searchQuery) {
        html += `<span class="filter-chip active-chip">🔍 ค้นหา: <strong>"${searchQuery}"</strong></span>`;
    }

    // Chip Total Count
    html += `<span class="filter-chip">ห้องที่พบ: <strong>${filtered.length}</strong></span>`;

    // ปุ่ม Reset หากมีการกรอง
    if (activeSeaFilter !== 'all' || activeEventFilter !== 'all' || searchQuery) {
        html += `<button class="btn-reset-filters" onclick="resetAllFilters()">✕ ล้างตัวกรองทั้งหมด</button>`;
    }

    container.innerHTML = html;

    if (statText) {
        statText.textContent = `${filtered.length} SERVERS MATCHED`;
    }
}

// รีเซ็ตตัวกรองทั้งหมดเป็นค่าเริ่มต้น
function resetAllFilters() {
    activeSeaFilter = 'all';
    activeEventFilter = 'all';
    searchQuery = '';

    const searchInput = document.getElementById('trackerSearch');
    if (searchInput) searchInput.value = '';

    const clearBtn = document.getElementById('searchClearBtn');
    if (clearBtn) clearBtn.style.display = 'none';

    // อัปเดต active บน UI
    document.querySelectorAll('.nav-item[data-event]').forEach(i => i.classList.remove('active'));
    const defEvent = document.getElementById('nav-event-all');
    if (defEvent) defEvent.classList.add('active');

    document.querySelectorAll('.nav-item[data-sea]').forEach(i => i.classList.remove('active'));
    const defSea = document.getElementById('nav-sea-all');
    if (defSea) defSea.classList.add('active');

    updateSidebarCounts();
    renderFilterChips();
    renderServerCards();
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
            const matchLocation = (server.location || '').toLowerCase().includes(q);
            const matchSea = `sea ${server.sea}`.includes(q);
            if (!matchTitle && !matchSubtitle && !matchLocation && !matchSea) return false;
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

    renderFilterChips();

    const filtered = getFilteredServers();

    if (filtered.length === 0) {
        // Smart Empty State ป้องกันหน้าเว็บว่างเปล่าและให้คำแนะนำผู้ใช้
        let emptyTitle = 'ไม่พบห้องเซิร์ฟเวอร์ที่ตรงกับเงื่อนไข';
        let emptyDesc = 'ลองเปลี่ยนหมวดหมู่อีเวนต์ หรือสลับไปยังโลก (Sea) อื่นที่มีอีเวนต์นี้';
        let switchButton = '';

        if (activeSeaFilter === '2' && ['mirage', 'fullmoon', 'prehistoric'].includes(activeEventFilter)) {
            const eventTh = activeEventFilter === 'mirage' ? 'เกาะมิราจ (Mirage Island)' :
                            activeEventFilter === 'fullmoon' ? 'พระจันทร์เต็มดวง (Full Moon)' : 'เกาะดึกดำบรรพ์ (Prehistoric Island)';
            emptyTitle = `${eventTh} มีเฉพาะใน Sea 3`;
            emptyDesc = `ในเกม Blox Fruits อีเวนต์ ${eventTh} จะไม่เกิดในโลกที่ 2 เลย คุณสามารถสลับไปดูใน Sea 3 ได้ทันทีครับ`;
            switchButton = `<button class="btn-empty-switch" onclick="switchSea('3')">⚓ สลับไปดูใน Sea 3 ทันที</button>`;
        } else if (activeSeaFilter === '3' && activeEventFilter === 'sword') {
            emptyTitle = 'คนขาย 3 ดาบ (Sword Dealer) มีเฉพาะใน Sea 2';
            emptyDesc = 'ในเกม Blox Fruits คนขาย 3 ดาบในตำนาน (Shisui, Wando, Saddi) จะเกิดเฉพาะในโลกที่ 2 เท่านั้น';
            switchButton = `<button class="btn-empty-switch" onclick="switchSea('2')">🚢 สลับไปดูใน Sea 2 ทันที (17 ห้อง)</button>`;
        } else if (searchQuery) {
            emptyTitle = `ไม่พบข้อมูลสำหรับ "${searchQuery}"`;
            emptyDesc = 'ลองพิมพ์ค้นหาด้วยชื่อบอส เช่น Darkbeard, Dough King, Shisui หรือเคลียร์คำค้นหาดูครับ';
        }

        grid.innerHTML = `
            <div class="empty-state-card">
                <div class="empty-icon-radar">📡</div>
                <h3 class="empty-title">${emptyTitle}</h3>
                <p class="empty-desc">${emptyDesc}</p>
                <div class="empty-actions">
                    ${switchButton}
                    <button class="btn-empty-reset" onclick="resetAllFilters()">🔄 ดูห้องทั้งหมด (Show All)</button>
                </div>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(server => {
        const timerClass = getTimerColorClass(server.expiresInSeconds);
        const timeStr = formatTime(server.expiresInSeconds);
        const isFull = server.players >= server.maxPlayers;
        
        // เปอร์เซ็นต์ผู้เล่นในห้อง
        const occupancyPercent = Math.min(100, Math.round((server.players / server.maxPlayers) * 100));
        const fillClass = server.players >= 12 ? 'fill-high' : server.players >= 10 ? 'fill-medium' : 'fill-low';
        const playerText = isFull ? `${server.players}/${server.maxPlayers} FULL` : `${server.players}/${server.maxPlayers}`;

        const seaChipClass = server.sea === 2 ? 'sea-2' : 'sea-3';
        const seaLabel = server.sea === 2 ? '🚢 Sea 2' : '⚓ Sea 3';

        return `
            <div class="server-card" data-id="${server.id}">
                <!-- Top Ribbon -->
                <div class="card-header">
                    <button class="card-details-btn" onclick="openDetailsModal('${server.id}')">
                        <span>ℹ️</span> Details
                    </button>
                    <div class="card-timer-badge ${timerClass}">
                        <span class="timer-dot"></span>
                        <span class="timer-text">${timeStr}</span>
                    </div>
                </div>
                
                <!-- Media / Banner with vignette -->
                <div class="card-media">
                    <img src="${server.image}" alt="${server.title}" loading="lazy">
                    <div class="card-media-fade"></div>
                    <span class="card-category-tag ${server.tagClass}">${server.categoryName}</span>
                    <span class="card-sea-chip ${seaChipClass}">${seaLabel}</span>
                </div>

                <!-- Body Content -->
                <div class="card-body">
                    <div class="card-title-row">
                        <span class="card-category-label">${server.title}</span>
                    </div>
                    <div class="card-subtitle">${server.subtitle}</div>
                    <div class="card-location-snippet">📍 ${server.location || 'กำลังสปอว์น'}</div>
                    
                    <!-- Occupancy Bar -->
                    <div class="card-occupancy-row">
                        <div class="occupancy-track">
                            <div class="occupancy-fill ${fillClass}" style="width: ${occupancyPercent}%;"></div>
                        </div>
                        <span class="player-count-text ${isFull ? 'is-full' : ''}">${playerText}</span>
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

// สลับโลกอย่างรวดเร็ว (สำหรับ Empty State Action)
function switchSea(targetSea) {
    activeSeaFilter = targetSea;
    
    document.querySelectorAll('.nav-item[data-sea]').forEach(i => i.classList.remove('active'));
    const targetEl = document.getElementById(`nav-sea-${targetSea}`);
    if (targetEl) targetEl.classList.add('active');

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
            buttonEl.innerHTML = '<span>✅</span> COPIED TO CLIPBOARD!';
            setTimeout(() => {
                buttonEl.classList.remove('copied');
                buttonEl.innerHTML = originalText;
            }, 2000);
        }
    }).catch(() => {
        // Fallback copy Job ID
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
                server.location = fresh.location;
                server.image = fresh.image;
                server.details = fresh.details;
                server.jobId = fresh.jobId;
                server.players = Math.floor(Math.random() * 6) + 7;
                server.expiresInSeconds = Math.floor(Math.random() * 900) + 60;
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
            
            // ตรวจสอบว่าในโลกปัจจุบันมีอีเวนต์นี้หรือไม่
            const visibleInSea = servers.filter(s => activeSeaFilter === 'all' || s.sea.toString() === activeSeaFilter);
            const countInSea = eventKey === 'all' ? visibleInSea.length : visibleInSea.filter(s => s.category === eventKey).length;

            if (countInSea === 0 && eventKey !== 'all') {
                // มี 0 ห้องใน Sea นี้ -> แนะนำหรือสลับโลกให้อัตโนมัติ
                if (activeSeaFilter === '2') {
                    showToast(`💡 ${item.querySelector('.nav-item-left span:last-child').textContent} มีเฉพาะใน Sea 3 (โลก 3) เท่านั้น`);
                } else if (activeSeaFilter === '3') {
                    showToast(`💡 ${item.querySelector('.nav-item-left span:last-child').textContent} มีเฉพาะใน Sea 2 (โลก 2) เท่านั้น`);
                }
            }

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
            
            // Sea 1 ไม่มีบอสหรืออีเวนต์ฟาร์ม
            if (selectedSea === '1') {
                showToast('⛵ Sea 1 ไม่มีบอสโลกหรืออีเวนต์สำหรับฮ็อปเซิร์ฟเวอร์ครับ');
                return;
            }

            document.querySelectorAll('.nav-item[data-sea]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            activeSeaFilter = selectedSea;

            // SMART SWITCH: หากอีเวนต์เดิมที่เลือกไว้ ไม่มีใน Sea ใหม่ (เช่น กำลังเลือก Mirage แล้วกดเลือก Sea 2)
            // ให้สลับ activeEventFilter เป็น 'all' โดยอัตโนมัติ เพื่อไม่ให้ผู้ใช้เจอกริดว่างเปล่า!
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

            // อัปเดตตัวเลขใน EVENTS ให้ตรงตาม Sea ที่กดเลือกทันที!
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
