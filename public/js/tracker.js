/**
 * BlacklistScriptx - Blox Fruits Live Server Tracker
 * Real-time Server Hop & Event Teleport Engine
 */

// Place IDs สำหรับแต่ละโลกของ Blox Fruits
const PLACE_IDS = {
    1: '2753915549', // Sea 1
    2: '4442272183', // Sea 2
    3: '7449423635'  // Sea 3
};

// ภาพประกอบและข้อมูลอีเวนต์ Blox Fruits
const EVENT_PRESETS = [
    // Mirage Island
    {
        category: 'mirage',
        categoryName: 'Mirage Island',
        tagClass: 'tag-mirage',
        title: 'Mirage Island',
        subtitles: ['Island is up', 'Mystic Island Spawned', 'Active in Deep Sea'],
        sea: 3,
        image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&auto=format&fit=crop&q=80',
        details: 'เกาะมิราจปรากฏขึ้นแล้ว เหมาะสำหรับตามหาเฟือง (Blue Gear) เพื่อปลดล็อคเผ่า V4 ส่องกระจกที่จุดสูงสุดของเกาะ'
    },
    // Full Moon
    {
        category: 'fullmoon',
        categoryName: 'Full Moon',
        tagClass: 'tag-fullmoon',
        title: 'Full Moon',
        subtitles: ['Moon is 100% Full', 'Lunar Eclipse Active', 'Trials Ready'],
        sea: 3,
        image: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=600&auto=format&fit=crop&q=80',
        details: 'พระจันทร์เต็มดวง 100% สำหรับลงดันเจี้ยนทำเผ่า V4 ที่วิหารแห่งกาลเวลา (Temple of Time)'
    },
    // Prehistoric Island
    {
        category: 'prehistoric',
        categoryName: 'Prehistoric Island',
        tagClass: 'tag-prehistoric',
        title: 'Prehistoric Island',
        subtitles: ['Ancient Island is up', 'Volcano Erupting', 'Fossil Active'],
        sea: 3,
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
        details: 'เกาะดึกดำบรรพ์ปรากฏขึ้นแล้วสำหรับเควสฟาร์มแมกม่าและทรัพยากรโบราณ'
    },
    // Raid Bosses
    {
        category: 'boss',
        categoryName: 'Boss',
        tagClass: 'tag-boss',
        title: 'Boss',
        subtitles: ['Dough King', 'Soul Reaper', 'rip_Indra True Form', 'Cake Prince', 'Darkbeard'],
        sea: 3,
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        details: 'บอสระดับโลกกำลังเกิดอยู่ในเซิร์ฟเวอร์ พร้อมสำหรับลงตีดรอปไอเทมระดับ Mythical'
    },
    // Haki Colors
    {
        category: 'haki',
        categoryName: 'SHOP',
        tagClass: 'tag-shop',
        title: 'Haki Color',
        subtitles: ['Snow White', 'Pure Red', 'Winter Sky', 'Rainbow Savior'],
        sea: 3,
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
        details: 'Master of Auras กำลังเปิดขายฮาคิสีหายาก ใช้เงิน Fragments ซื้อเพื่อเปิดใช้งานเควสอินดรา'
    },
    // Legendary Swords
    {
        category: 'sword',
        categoryName: 'Legendary Sword',
        tagClass: 'tag-sword',
        title: 'Legendary Sword',
        subtitles: ['Shisui (Saishi)', 'Wando', 'Saddi'],
        sea: 2,
        image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80',
        details: 'คนขาย 3 ดาบในตำนาน (Legendary Sword Dealer) สุ่มเกิดแล้ว ซื้อเพื่อรวมเป็นดาบ True Triple Katana'
    }
];

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

// สร้างชุดข้อมูลเซิร์ฟเวอร์จำลองแบบ Real-time
function initServers(count = 80) {
    servers = [];
    for (let i = 0; i < count; i++) {
        const preset = EVENT_PRESETS[Math.floor(Math.random() * EVENT_PRESETS.length)];
        const subtitle = Array.isArray(preset.subtitles) 
            ? preset.subtitles[Math.floor(Math.random() * preset.subtitles.length)] 
            : preset.subtitles;
        
        let sea = preset.sea;
        // Boss และ Full Moon อาจกระจายอยู่ใน Sea 2 ได้
        if (preset.category === 'boss' && Math.random() > 0.7) sea = 2;
        if (preset.category === 'fullmoon' && Math.random() > 0.8) sea = 2;

        const maxPlayers = 12;
        const players = Math.floor(Math.random() * 6) + 7; // 7 to 12
        const expiresInSeconds = Math.floor(Math.random() * 900) + 15; // 15s to 15m

        servers.push({
            id: `srv-${i + 1}`,
            category: preset.category,
            categoryName: preset.categoryName,
            tagClass: preset.tagClass,
            title: preset.title,
            subtitle: subtitle,
            sea: sea,
            placeId: PLACE_IDS[sea] || PLACE_IDS[3],
            jobId: generateJobId(),
            players: players,
            maxPlayers: maxPlayers,
            image: preset.image,
            details: preset.details,
            expiresInSeconds: expiresInSeconds
        });
    }
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

// อัปเดตตัวเลข Badge บนเมนู Sidebar
function updateSidebarCounts() {
    const counts = {
        all: servers.length,
        mirage: servers.filter(s => s.category === 'mirage').length,
        fullmoon: servers.filter(s => s.category === 'fullmoon').length,
        prehistoric: servers.filter(s => s.category === 'prehistoric').length,
        boss: servers.filter(s => s.category === 'boss').length,
        haki: servers.filter(s => s.category === 'haki').length,
        sword: servers.filter(s => s.category === 'sword').length,
        seaAll: servers.length,
        sea1: servers.filter(s => s.sea === 1).length,
        sea2: servers.filter(s => s.sea === 2).length,
        sea3: servers.filter(s => s.sea === 3).length,
    };

    const countEls = {
        'count-all': counts.all,
        'count-mirage': counts.mirage,
        'count-fullmoon': counts.fullmoon,
        'count-prehistoric': counts.prehistoric,
        'count-boss': counts.boss,
        'count-haki': counts.haki,
        'count-sword': counts.sword,
        'count-sea-all': counts.seaAll,
        'count-sea-1': counts.sea1,
        'count-sea-2': counts.sea2,
        'count-sea-3': counts.sea3
    };

    for (const [id, val] of Object.entries(countEls)) {
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
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-dim);">
                <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
                <h3 style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: 8px;">ไม่พบห้องเซิร์ฟเวอร์ที่ตรงกับเงื่อนไข</h3>
                <p style="font-size: 0.9rem;">ลองเปลี่ยนหมวดหมู่ตัวกรอง หรือค้นหาด้วยคำอื่นดูครับ</p>
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
                <div class="card-header">
                    <button class="card-details-btn" onclick="openDetailsModal('${server.id}')">
                        <span>ℹ️</span> Details
                    </button>
                    <div class="card-timer-badge ${timerClass}">
                        <span class="timer-dot"></span>
                        <span class="timer-text">${timeStr}</span>
                    </div>
                </div>
                
                <div class="card-media">
                    <img src="${server.image}" alt="${server.title}" loading="lazy">
                    <span class="card-category-tag ${server.tagClass}">${server.categoryName}</span>
                </div>

                <div class="card-body">
                    <div class="card-title">${server.title}</div>
                    <div class="card-subtitle">${server.subtitle}</div>
                    
                    <div class="card-footer-meta">
                        <div class="meta-sea">
                            <span>🌊 Sea ${server.sea}</span>
                        </div>
                        <span class="${playerBadgeClass}">${playerText}</span>
                    </div>
                </div>

                <div class="card-action">
                    <button class="btn-teleport" onclick="copyTeleportScript('${server.placeId}', '${server.jobId}', this)">
                        <span>⚡</span> Tap to copy Teleport
                    </button>
                </div>
            </div>
        `;
    }).join('');
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
function openDetailsModal(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    const modal = document.getElementById('detailsModal');
    if (!modal) return;

    document.getElementById('modalTitle').textContent = `${server.title} - ${server.subtitle}`;
    document.getElementById('modalCategory').textContent = server.categoryName;
    document.getElementById('modalSea').textContent = `Sea ${server.sea}`;
    document.getElementById('modalPlayers').textContent = `${server.players}/${server.maxPlayers}`;
    document.getElementById('modalPlaceId').textContent = server.placeId;
    document.getElementById('modalJobId').textContent = server.jobId;
    document.getElementById('modalTeleportScript').textContent = `game:GetService("TeleportService"):TeleportToPlaceInstance(${server.placeId}, "${server.jobId}", game.Players.LocalPlayer)`;
    document.getElementById('modalDetailsText').textContent = server.details;

    modal.classList.add('active');
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
                // หมดเวลา -> เกิดใหม่เป็นอีเวนต์สุ่มอันใหม่
                const preset = EVENT_PRESETS[Math.floor(Math.random() * EVENT_PRESETS.length)];
                server.category = preset.category;
                server.categoryName = preset.categoryName;
                server.tagClass = preset.tagClass;
                server.title = preset.title;
                server.subtitle = Array.isArray(preset.subtitles) 
                    ? preset.subtitles[Math.floor(Math.random() * preset.subtitles.length)] 
                    : preset.subtitles;
                server.jobId = generateJobId();
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
            document.querySelectorAll('.nav-item[data-event]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            activeEventFilter = item.getAttribute('data-event');
            renderServerCards();
        });
    });

    // 2. Sea Filters (Sidebar)
    document.querySelectorAll('.nav-item[data-sea]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item[data-sea]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            activeSeaFilter = item.getAttribute('data-sea');
            renderServerCards();
        });
    });

    // 3. Search Bar
    const searchInput = document.getElementById('trackerSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderServerCards();
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

        // ปิดเมื่อคลิกนอก Sidebar บนมือถือ
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
    initServers(90);
    updateSidebarCounts();
    setupEventListeners();
    renderServerCards();
    startCountdownTimer();
});
