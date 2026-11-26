/* ==========================================================================
   BlacklistScriptx Redesign — Instant Catalog + Server-Side 2-Step Unlock
   ========================================================================== */

const I18N = {
  th: {
    brandSub: 'ROBLOX SCRIPT HUB',
    navScripts: 'สคริปต์ทั้งหมด',
    navExecutors: 'ตัวรัน (Executors)',
    mobScripts: 'สคริปต์',
    mobExecutors: 'ตัวรัน',
    mobSearch: 'ค้นหา',
    vipBtn: 'VIP Discord',
    heroBadge: 'เข้าใช้งานได้ทันที • สคริปต์ล็อคปลอดภัยฝั่งเซิร์ฟเวอร์',
    heroTitle: 'ศูนย์รวมสคริปต์ <span class="accent-gradient">Roblox</span> อัปเดตล่าสุด',
    heroDesc: 'เลือกดูรายชื่อสคริปต์และสถานะตัวรันได้ทันทีโดยไม่ติดหน้ากั้น เมื่อเจอสคริปต์ที่ต้องการ กดปลดล็อค 4 ขั้นตอนสั้นๆ (รอบละ 5 วิ) เพื่อรับโค้ด',
    filterAll: 'ทั้งหมด',
    filterKeyless: 'ไม่มีคีย์ (Keyless)',
    statTotal: 'สคริปต์ทั้งหมด',
    statKeyless: 'ไร้คีย์ (Keyless)',
    statGames: 'จำนวนแมพ',
    statUnlock: 'ระบบปลดล็อค',
    emptyTitle: 'ไม่พบสคริปต์ที่ค้นหา',
    emptyDesc: 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเกม',
    resetFilters: 'แสดงทั้งหมด',
    execTitle: 'สถานะตัวรัน Roblox (Live WEAO)',
    execDesc: 'เช็กสถานะอัปเดตล่าสุด ค่า sUNC และลิงก์ดาวน์โหลดแท้',
    footerNote: 'เข้าดูเว็บได้ทันที • ระบบปลดล็อคสคริปต์ฝั่งเซิร์ฟเวอร์',
    unlockHeading: 'ปลดล็อคสคริปต์',
    vipInstantUnlock: 'ปลดล็อคทันที (VIP Bypass)',
    revealedBadge: 'ปลดล็อคสำเร็จแล้ว',
    copyCode: 'คัดลอกสคริปต์ (Copy Script)',
    copiedCode: 'คัดลอกเรียบร้อยแล้ว!',
    vipModalTitle: 'Discord VIP & Bypass',
    vipModalDesc: 'เข้าสู่ระบบด้วย Discord เพื่อตรวจสอบยศ Admin / Dev / Bypass หากมียศสามารถปลดล็อคสคริปต์ได้ทันทีโดยไม่ต้องรอโฆษณา',
    vipLoginBtn: 'เข้าสู่ระบบด้วย Discord',
    vipLogout: 'ออกจากระบบ',
    searchPlaceholder: 'ค้นหาชื่อเกม หรือสคริปต์...',
    allGames: 'ทุกแมพ',
    unlockCardBtn: 'ปลดล็อคสคริปต์',
    keylessBadge: 'ไม่มีคีย์',
    keyBadge: 'มีระบบคีย์',
    lockedBadge: 'ล็อคอยู่',
    stepLabel: (cur, tot) => `ด่านที่ ${Math.min(cur + 1, tot)} จาก ${tot}`,
    stepDoneLabel: (tot) => `ผ่านครบ ${tot}/${tot} ด่านแล้ว`,
    stepPill: (n, sec) => `ด่าน ${n} (${sec}s)`,
    startBtn: (tot) => `เริ่มปลดล็อค (ด่านที่ 1/${tot})`,
    continueBtn: (cur, tot) => `ทำด่านต่อ (${cur + 1}/${tot})`,
    waitingBtn: (sec) => `รอโฆษณา ${sec} วินาที...`,
    checkingBtn: 'กำลังตรวจสอบกับเซิร์ฟเวอร์...',
    revealBtn: 'เปิดดูโค้ดสคริปต์ (Reveal Script)',
    helperText: (sec) => `กดปุ่มเพื่อเปิดแท็บสปอนเซอร์และรอ ${sec} วินาที จากนั้นระบบเซิร์ฟเวอร์จะบันทึกความคืบหน้าให้ทันที`,
    helperReady: 'ผ่านครบทุกด่านแล้ว กดปุ่มด้านล่างเพื่อรับโค้ดสคริปต์ได้เลย!',
    discordPill: 'เข้า Discord (ทำครั้งเดียว)',
    discordStepLabel: 'ขั้นตอนพิเศษ (ทำครั้งเดียว)',
    discordBtn: 'เข้าร่วม Discord เพื่อไปต่อ',
    discordHelper: (days, sec) => `กดเข้าเซิร์ฟเวอร์ Discord ของเราและรอ ${sec} วินาที — ระบบจะจำไว้ ${days} วัน รอบหน้าไม่ต้องทำซ้ำ!`,
    discordWaiting: (sec) => `กำลังตรวจสอบการเข้า Discord (${sec}s)...`,
    discordToastDone: (days) => `บันทึกการเข้า Discord แล้ว! ระบบจำไว้ ${days} วัน`,
    entryTitle: 'สนับสนุนช่องก่อนเข้าใช้งาน',
    entryDesc: 'ทำภารกิจสั้นๆ 2 ข้อ (จำให้ 24 ชม. — ไม่ต้องทำซ้ำทุกรอบ)',
    entrySubTitle: '1. กดติดตาม (Subscribe)',
    entrySubBtn: 'กดติดตาม',
    entryLikeTitle: '2. กดไลค์คลิปล่าสุด',
    entryLikeNote: 'เปิดคลิปล่าสุดแล้วกดไลค์ 5 วิ',
    entryLikeBtn: 'กดไลค์คลิป',
    entryTaskDone: 'ผ่านแล้ว',
    entryTaskWait: (sec) => `รอตรวจ ${sec}s...`,
    entryEnterLocked: 'ทำครบ 2 ข้อเพื่อเข้าสู่เว็บไซต์',
    entryEnterReady: 'เข้าสู่เว็บไซต์ทันที',
    entryVipSkip: 'สมาชิก VIP Discord (เข้าสู่ระบบเพื่อข้าม)'
  },
  en: {
    brandSub: 'ROBLOX SCRIPT HUB',
    navScripts: 'Scripts',
    navExecutors: 'Executors',
    mobScripts: 'Scripts',
    mobExecutors: 'Executors',
    mobSearch: 'Search',
    vipBtn: 'VIP Discord',
    heroBadge: 'Instant Browse • Server-Protected Script Locker',
    heroTitle: 'Updated <span class="accent-gradient">Roblox</span> Script Hub',
    heroDesc: 'Browse every game script and live executor status right away. Pick any script and finish 4 quick steps (5s each) to reveal the code.',
    filterAll: 'All',
    filterKeyless: 'Keyless',
    statTotal: 'Total Scripts',
    statKeyless: 'Keyless',
    statGames: 'Games',
    statUnlock: 'Unlock Flow',
    emptyTitle: 'No matching scripts found',
    emptyDesc: 'Try another search keyword or reset game filter.',
    resetFilters: 'Show All',
    execTitle: 'Live Roblox Executors (WEAO)',
    execDesc: 'Real-time update status, sUNC scores & official download links',
    footerNote: 'Instant Browse • Server-Side Script Locker',
    unlockHeading: 'Unlock Script',
    vipInstantUnlock: 'Instant Unlock (VIP Bypass)',
    revealedBadge: 'Unlocked Successfully',
    copyCode: 'Copy Script',
    copiedCode: 'Copied to Clipboard!',
    vipModalTitle: 'Discord VIP & Bypass',
    vipModalDesc: 'Sign in with Discord to verify Admin / Dev / Bypass roles for instant ad-free script unlocks.',
    vipLoginBtn: 'Login with Discord',
    vipLogout: 'Sign Out',
    searchPlaceholder: 'Search games or scripts...',
    allGames: 'All Games',
    unlockCardBtn: 'Unlock Script',
    keylessBadge: 'Keyless',
    keyBadge: 'Key System',
    lockedBadge: 'Locked',
    stepLabel: (cur, tot) => `Step ${Math.min(cur + 1, tot)} of ${tot}`,
    stepDoneLabel: (tot) => `Completed ${tot}/${tot} steps`,
    stepPill: (n, sec) => `Step ${n} (${sec}s)`,
    startBtn: (tot) => `Start Unlocking (Step 1/${tot})`,
    continueBtn: (cur, tot) => `Continue (Step ${cur + 1}/${tot})`,
    waitingBtn: (sec) => `Keep sponsor open ${sec}s...`,
    checkingBtn: 'Verifying with server...',
    revealBtn: 'Reveal Script Code',
    helperText: (sec) => `Click below to open the sponsor tab for ${sec} seconds. Progress is verified strictly on the server.`,
    helperReady: 'All steps completed! Click Reveal Script Code below.',
    discordPill: 'Join Discord (1-Time)',
    discordStepLabel: 'Bonus Step (Once Only)',
    discordBtn: 'Join Discord to Continue',
    discordHelper: (days, sec) => `Join our Discord server and keep it open ${sec}s — remembered for ${days} days so it will not bother you again!`,
    discordWaiting: (sec) => `Verifying Discord join (${sec}s)...`,
    discordToastDone: (days) => `Discord step saved! Remembered for ${days} days.`,
    entryTitle: 'Support Channel Before Entering',
    entryDesc: 'Quick 2-step support (remembered for 24h).',
    entrySubTitle: '1. Subscribe on YouTube',
    entrySubBtn: 'Subscribe',
    entryLikeTitle: '2. Like Latest Video',
    entryLikeNote: 'Open latest video & like (5s check)',
    entryLikeBtn: 'Like Video',
    entryTaskDone: 'Verified',
    entryTaskWait: (sec) => `Checking ${sec}s...`,
    entryEnterLocked: 'Complete 2 steps to enter website',
    entryEnterReady: 'Enter Website Now',
    entryVipSkip: 'VIP Discord Member (Sign in to skip)'
  }
};

const state = {
  lang: localStorage.getItem('bs_lang') === 'en' ? 'en' : 'th',
  view: 'scripts',
  scripts: [],
  unlockConfig: { stepsTotal: 4, waitSeconds: 5, monetagMultiTagZone: '', discordRequiredOnce: true, discordRememberDays: 30, discordInviteUrl: '' },
  entryTasks: { enabled: true, youtubeChannelUrl: 'https://www.youtube.com/@Blacklistxyx', youtubeChannelName: '@Blacklistxyx', latestVideoUrl: '', waitSeconds: 5, rememberHours: 24 },
  entrySubDone: false,
  entryLikeDone: false,
  entrySubBusy: false,
  entryLikeBusy: false,
  resolvedLatestVideoUrl: '',
  executors: [],
  execLoaded: false,
  execPlatform: 'all',
  search: '',
  filter: 'all',
  game: 'all',
  activeScript: null,
  session: null,
  countdown: null,
  timerId: null,
  isBusy: false,
  vipToken: localStorage.getItem('blacklist_vip_token') || '',
  vipUser: null,
  canBypass: false
};

const $ = (id) => document.getElementById(id);

function t(key, ...args) {
  const dict = I18N[state.lang] || I18N.th;
  const val = dict[key];
  return typeof val === 'function' ? val(...args) : (val ?? key);
}

function showToast(msg, type = 'info') {
  const root = $('toastRoot');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function applyTranslations() {
  document.documentElement.lang = state.lang;
  $('langLabel').textContent = state.lang.toUpperCase();
  $('searchInput').placeholder = t('searchPlaceholder');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key === 'heroTitle') {
      el.innerHTML = t(key);
    } else {
      el.textContent = t(key);
    }
  });

  if (state.vipUser && state.canBypass) {
    $('vipBtnText').textContent = state.vipUser.username || 'VIP';
  }
  renderGamePills();
  renderScripts();
  if (state.activeScript) renderUnlockUI();
}

function getField(item, baseKey) {
  if (state.lang === 'en') {
    const enVal = item[`${baseKey}_en`];
    if (enVal && String(enVal).trim()) return enVal;
  }
  return item[baseKey] || '';
}

function extractYouTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function injectMultiTagIfConfigured(zone) {
  const cleanZone = String(zone || '').trim();
  if (!cleanZone || window.__bsMultiTagLoaded) return;
  window.__bsMultiTagLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://quge5.com/88/tag.min.js';
  s.setAttribute('data-zone', cleanZone);
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
}

// ==========================================================================
// Data Loading
// ==========================================================================
async function loadPublicScripts() {
  const grid = $('scriptsGrid');
  grid.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton"></div>').join('');

  try {
    const res = await fetch('/api/public/scripts', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    state.scripts = Array.isArray(data.scripts) ? data.scripts : [];
    if (data.unlock) {
      state.unlockConfig = data.unlock;
      injectMultiTagIfConfigured(data.unlock.monetagMultiTagZone);
    }
    if (data.entryTasks) {
      state.entryTasks = data.entryTasks;
    }
  } catch (err) {
    showToast('โหลดรายชื่อสคริปต์ไม่สำเร็จ: ' + err.message, 'error');
    state.scripts = [];
  }

  updateStats();
  renderGamePills();
  renderScripts();
  maybeOpenEntryGate();
}

async function loadExecutors() {
  if (state.execLoaded) {
    renderExecutors();
    return;
  }
  const grid = $('executorsGrid');
  grid.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton"></div>').join('');
  try {
    const res = await fetch('/api/exploits');
    if (!res.ok) throw new Error('WEAO offline');
    const data = await res.json();
    state.executors = Array.isArray(data) ? data : [];
    state.execLoaded = true;
  } catch (e) {
    state.executors = [];
  }
  renderExecutors();
}

function updateStats() {
  $('statTotalScripts').textContent = String(state.scripts.length);
  $('statKeylessScripts').textContent = String(state.scripts.filter((s) => s.isKeyless).length);
  const games = new Set(state.scripts.map((s) => (s.game || 'Other').trim()));
  $('statGamesCount').textContent = String(games.size);
  $('statUnlockSteps').textContent = `${state.unlockConfig.stepsTotal || 4} Steps · ${state.unlockConfig.waitSeconds || 5}s`;
}

// ==========================================================================
// Render Scripts & Filters
// ==========================================================================
function renderGamePills() {
  const wrap = $('gamePills');
  if (!wrap) return;
  const counts = new Map();
  for (const s of state.scripts) {
    const g = (s.game || 'Other').trim();
    counts.set(g, (counts.get(g) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  let html = `<button type="button" class="game-pill ${state.game === 'all' ? 'active' : ''}" data-game="all">${t('allGames')} <span class="count">${state.scripts.length}</span></button>`;
  for (const [game, count] of sorted) {
    const safeGame = game.replace(/"/g, '&quot;');
    const active = state.game === game ? 'active' : '';
    html += `<button type="button" class="game-pill ${active}" data-game="${safeGame}">${escapeHtml(game)} <span class="count">${count}</span></button>`;
  }
  wrap.innerHTML = html;

  wrap.querySelectorAll('.game-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.game = btn.getAttribute('data-game') || 'all';
      renderGamePills();
      renderScripts();
    });
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getFilteredScripts() {
  const q = state.search.trim().toLowerCase();
  return state.scripts.filter((s) => {
    if (state.game !== 'all' && (s.game || 'Other').trim() !== state.game) return false;
    if (state.filter === 'keyless' && !s.isKeyless) return false;
    if (state.filter === 'mobile' && !s.isMobile) return false;
    if (state.filter === 'pc' && !s.isPC) return false;
    if (q) {
      const hay = `${s.title || ''} ${s.title_en || ''} ${s.game || ''} ${s.description || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderScripts() {
  const grid = $('scriptsGrid');
  const empty = $('emptyState');
  const list = getFilteredScripts();
  $('resultsCountText').textContent = `${list.length} scripts`;

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    refreshIcons();
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = list.map((s) => {
    const title = getField(s, 'title');
    const desc = getField(s, 'description');
    const thumb = getField(s, 'thumbnail') || '/Logo.png';
    const keyBadge = s.isKeyless
      ? `<span class="badge keyless">${t('keylessBadge')}</span>`
      : `<span class="badge">${t('keyBadge')}</span>`;
    const lockBadge = `<span class="badge locked"><i data-lucide="lock" style="width:11px;height:11px"></i> ${t('lockedBadge')}</span>`;
    const devices = [];
    if (s.isMobile) devices.push('<span class="dev-pill">Mobile</span>');
    if (s.isPC) devices.push('<span class="dev-pill">PC</span>');

    return `
      <article class="script-card" data-id="${escapeHtml(s.id)}">
        <div class="card-thumb">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.src='/Logo.png'" />
          <div class="card-top-badges">
            ${keyBadge}
            ${lockBadge}
          </div>
        </div>
        <div class="card-body">
          <span class="card-game">${escapeHtml(s.game || 'Roblox')}</span>
          <h3 class="card-title">${escapeHtml(title)}</h3>
          <p class="card-desc">${escapeHtml(desc)}</p>
          <div class="card-foot">
            <div class="device-tags">${devices.join('')}</div>
            <button type="button" class="btn-card-unlock" data-unlock-id="${escapeHtml(s.id)}">
              <i data-lucide="lock-open"></i>
              <span>${t('unlockCardBtn')}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.script-card').forEach((card) => {
    card.addEventListener('click', () => openScriptModal(card.getAttribute('data-id')));
  });
  refreshIcons();
}

function getExecutorMedia(ex) {
  const title = String(ex.title || 'EX').trim();
  const words = title.split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : title.slice(0, 2).toUpperCase();

  let hue = 258;
  for (let i = 0; i < title.length; i++) {
    hue = (hue * 31 + title.charCodeAt(i)) % 360;
  }

  let logo = ex.slug?.logo ? String(ex.slug.logo) : '';
  if (!logo && ex.websitelink) {
    try {
      const host = new URL(ex.websitelink).hostname.replace(/^www\./, '');
      if (host && !host.includes('discord.gg') && !host.includes('discord.com')) {
        logo = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
      }
    } catch (e) {}
  }

  const cover = Array.isArray(ex.slug?.screenshots) && ex.slug.screenshots.length
    ? String(ex.slug.screenshots[0])
    : '';

  return { logo, cover, initials, hue };
}

function renderExecutors() {
  const grid = $('executorsGrid');
  const q = state.search.trim().toLowerCase();
  const filtered = state.executors.filter((ex) => {
    if (state.execPlatform !== 'all' && !String(ex.platform || '').toLowerCase().includes(state.execPlatform)) {
      return false;
    }
    if (q) {
      const hay = `${ex.title || ''} ${ex.platform || ''} ${ex.version || ''} ${ex.cost || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No live executor data available right now.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map((ex) => {
    const up = ex.updateStatus === true;
    const isFree = ex.free === true;
    const priceLabel = isFree ? 'Free' : (ex.cost || 'Paid');
    const isExternal = String(ex.extype || '').includes('external');
    const link = ex.websitelink || ex.discordlink || '#';
    const hasDiscord = Boolean(ex.discordlink && ex.discordlink !== link);
    const { logo, cover, initials, hue } = getExecutorMedia(ex);

    const coverContent = cover
      ? `<img class="exec-cover-img" src="${escapeHtml(cover)}" alt="${escapeHtml(ex.title || 'Executor')} preview" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()" />`
      : (logo
          ? `<div class="exec-cover-watermark"><img src="${escapeHtml(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span>${escapeHtml(initials)}</span>'" /></div>`
          : `<div class="exec-cover-watermark"><span>${escapeHtml(initials)}</span></div>`);

    const avatarContent = logo
      ? `<img class="exec-avatar-img" src="${escapeHtml(logo)}" alt="${escapeHtml(ex.title || 'Executor')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')" /><span class="exec-avatar-fallback hidden">${escapeHtml(initials)}</span>`
      : `<span class="exec-avatar-fallback">${escapeHtml(initials)}</span>`;

    const hasSunc = ex.suncPercentage != null;
    const pct = hasSunc ? Math.max(0, Math.min(100, Number(ex.suncPercentage) || 0)) : 0;
    const uncText = ex.uncPercentage != null ? `${ex.uncPercentage}% UNC` : '';
    const meterHtml = hasSunc
      ? `
        <div class="exec-meter">
          <div class="exec-meter-head">
            <span class="exec-meter-label">${pct}% sUNC</span>
            <span class="exec-meter-sub">${escapeHtml(uncText)}</span>
          </div>
          <div class="exec-meter-bar"><div class="exec-meter-fill" style="width:${pct}%"></div></div>
        </div>`
      : `
        <div class="exec-meter is-muted">
          <div class="exec-meter-head">
            <span class="exec-meter-label">${isExternal ? 'External Utility' : 'sUNC N/A'}</span>
            <span class="exec-meter-sub">${ex.detected ? 'Detected History' : 'Clean / Info'}</span>
          </div>
        </div>`;

    return `
      <article class="exec-card" style="--exec-hue:${hue}">
        <div class="exec-cover">
          ${coverContent}
          <div class="exec-cover-badges">
            <span class="exec-price ${isFree ? 'free' : 'paid'}">${escapeHtml(priceLabel)}</span>
            <span class="exec-status ${up ? 'up' : 'down'}">
              <span class="exec-status-dot"></span>
              ${up ? 'Updated' : 'Patched'}
            </span>
          </div>
        </div>
        <div class="exec-body">
          <div class="exec-head">
            <div class="exec-avatar-wrap">${avatarContent}</div>
            <div class="exec-title-block">
              <strong class="exec-title">${escapeHtml(ex.title || 'Executor')}</strong>
              <div class="exec-meta-pills">
                <span class="exec-pill">${escapeHtml(ex.platform || 'Multi')}</span>
                <span class="exec-pill">${escapeHtml(ex.version || '-')}</span>
                ${ex.decompiler ? '<span class="exec-pill accent">Decompiler</span>' : (isExternal ? '<span class="exec-pill">External</span>' : '')}
              </div>
            </div>
          </div>
          ${meterHtml}
          <div class="exec-actions">
            <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="exec-link primary">
              <i data-lucide="external-link" style="width:14px;height:14px"></i>
              <span>Official Site</span>
            </a>
            ${hasDiscord ? `<a href="${escapeHtml(ex.discordlink)}" target="_blank" rel="noopener noreferrer" class="exec-link discord" title="Discord" aria-label="Discord"><i data-lucide="message-square" style="width:15px;height:15px"></i></a>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
  refreshIcons();
}

// ==========================================================================
// Server-Side 2-Step Unlock Modal
// ==========================================================================
function clearCountdown() {
  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }
  state.countdown = null;
}

function saveScriptSession(scriptId, sid) {
  try {
    if (sid) sessionStorage.setItem(`bs_unlock_${scriptId}`, sid);
    else sessionStorage.removeItem(`bs_unlock_${scriptId}`);
  } catch (e) {}
}

function getSavedScriptSession(scriptId) {
  try {
    return sessionStorage.getItem(`bs_unlock_${scriptId}`) || '';
  } catch (e) {
    return '';
  }
}

function syncModalScrollLock() {
  const scriptOpen = !$('scriptModal').classList.contains('hidden');
  const vipOpen = !$('vipModal').classList.contains('hidden');
  const entryEl = $('entryGateModal');
  const entryOpen = entryEl ? !entryEl.classList.contains('hidden') : false;
  document.body.classList.toggle('modal-open', scriptOpen || vipOpen || entryOpen);
}

function getYoutubeSubUrl() {
  const raw = String(state.entryTasks?.youtubeChannelUrl || 'https://www.youtube.com/@Blacklistxyx').trim();
  if (raw.includes('sub_confirmation=')) return raw;
  return raw + (raw.includes('?') ? '&' : '?') + 'sub_confirmation=1';
}

function renderEntryGateUI() {
  const subRow = $('entrySubRow');
  const likeRow = $('entryLikeRow');
  const subBtn = $('entrySubBtn');
  const likeBtn = $('entryLikeBtn');
  const enterBtn = $('entryGateEnterBtn');
  if (!subRow || !likeRow || !enterBtn) return;

  if ($('entrySubName')) {
    $('entrySubName').textContent = state.entryTasks?.youtubeChannelName || '@Blacklistxyx';
  }
  subRow.classList.toggle('done', state.entrySubDone);
  likeRow.classList.toggle('done', state.entryLikeDone);

  if (!state.entrySubBusy) {
    subBtn.disabled = state.entrySubDone;
    $('entrySubBtnText').textContent = state.entrySubDone ? t('entryTaskDone') : t('entrySubBtn');
  }
  if (!state.entryLikeBusy) {
    likeBtn.disabled = state.entryLikeDone;
    $('entryLikeBtnText').textContent = state.entryLikeDone ? t('entryTaskDone') : t('entryLikeBtn');
  }

  const allDone = state.entrySubDone && state.entryLikeDone;
  enterBtn.disabled = !allDone;
  $('entryGateEnterText').textContent = allDone ? t('entryEnterReady') : t('entryEnterLocked');
  refreshIcons();
}

async function resolveLatestVideoForEntry() {
  if (state.resolvedLatestVideoUrl) return state.resolvedLatestVideoUrl;
  const fallback = String(state.entryTasks?.latestVideoUrl || state.entryTasks?.youtubeChannelUrl || 'https://www.youtube.com/@Blacklistxyx/videos');
  try {
    const chMatch = String(state.entryTasks?.youtubeChannelUrl || '').match(/@([A-Za-z0-9_.-]+)/);
    const chParam = chMatch ? `@${chMatch[1]}` : '@Blacklistxyx';
    const res = await fetch(`/api/latest-video?ch=${encodeURIComponent(chParam)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.videoUrl) {
        state.resolvedLatestVideoUrl = data.videoUrl;
        return data.videoUrl;
      }
    }
  } catch (e) {}
  state.resolvedLatestVideoUrl = fallback;
  return fallback;
}

function maybeOpenEntryGate() {
  const modal = $('entryGateModal');
  if (!modal) return;
  if (!state.entryTasks?.enabled || state.canBypass) return;
  try {
    const entryUntil = Number(localStorage.getItem('bs_entry_yt_until') || 0);
    if (entryUntil > Date.now()) return;
    const subUntil = Number(localStorage.getItem('bs_yt_subbed_until') || 0);
    state.entrySubDone = subUntil > Date.now();
  } catch (e) {}
  resolveLatestVideoForEntry();
  modal.classList.remove('hidden');
  syncModalScrollLock();
  renderEntryGateUI();
}

async function openScriptModal(scriptId) {
  const item = state.scripts.find((s) => String(s.id) === String(scriptId));
  if (!item) return;

  clearCountdown();
  state.activeScript = item;
  state.session = null;
  state.isBusy = false;

  const title = getField(item, 'title');
  const desc = getField(item, 'description');
  const thumb = getField(item, 'thumbnail') || '/Logo.png';
  const ytId = extractYouTubeId(item.videoUrl);

  const mediaBox = $('modalMediaBox');
  mediaBox.innerHTML = `
    <img id="modalThumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" onerror="this.src='/Logo.png'" />
    <button id="modalPlayBtn" type="button" class="play-overlay ${ytId ? '' : 'hidden'}" aria-label="Play Video">
      <i data-lucide="play"></i>
    </button>
  `;
  if (ytId) {
    const playBtn = $('modalPlayBtn');
    playBtn.addEventListener('click', () => {
      mediaBox.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    });
  }

  $('modalBadges').innerHTML = `
    <span class="badge">${escapeHtml(item.game || 'Roblox')}</span>
    <span class="badge ${item.isKeyless ? 'keyless' : ''}">${item.isKeyless ? t('keylessBadge') : t('keyBadge')}</span>
    <span class="badge">${escapeHtml(item.version || 'v1.0')}</span>
  `;
  $('modalTitle').textContent = title;
  $('modalDesc').textContent = desc;

  $('revealedBox').classList.add('hidden');
  $('unlockActions').classList.remove('hidden');
  $('revealedCode').value = '';
  $('vipUnlockBtn').classList.toggle('hidden', !state.canBypass);

  $('scriptModal').classList.remove('hidden');
  syncModalScrollLock();
  renderUnlockUI();
  refreshIcons();
}

function closeScriptModal() {
  clearCountdown();
  state.activeScript = null;
  $('modalMediaBox').innerHTML = '';
  $('scriptModal').classList.add('hidden');
  syncModalScrollLock();
}

function isDiscordRemembered() {
  try {
    if (/(?:^|;\s*)bs_discord_joined=1(?:;|$)/.test(document.cookie || '')) return true;
    const until = Number(localStorage.getItem('bs_discord_joined_until') || 0);
    return until > Date.now();
  } catch (e) {
    return false;
  }
}

function markDiscordRemembered(days) {
  try {
    const validDays = Math.max(1, Number(days) || 30);
    localStorage.setItem('bs_discord_joined_until', String(Date.now() + validDays * 86400 * 1000));
    document.cookie = `bs_discord_joined=1; path=/; max-age=${validDays * 86400}; SameSite=Lax`;
  } catch (e) {}
}

function renderUnlockUI() {
  if (!state.activeScript) return;
  const total = state.session?.total || state.unlockConfig.stepsTotal || 4;
  const waitSec = state.session?.waitSeconds || state.unlockConfig.waitSeconds || 5;
  const step = state.session?.step || 0;
  const complete = Boolean(state.session?.complete);
  const rememberDays = state.unlockConfig.discordRememberDays || 30;
  const showDiscordPill = state.session
    ? Boolean(state.session.discordRequired)
    : Boolean(state.unlockConfig.discordRequiredOnce && !isDiscordRemembered());
  const discordDone = state.session
    ? Boolean(state.session.discordDone)
    : !showDiscordPill;
  const needsDiscord = showDiscordPill && !discordDone;

  const totalWithDiscord = total + (showDiscordPill ? 1 : 0);
  const doneCount = step + (showDiscordPill && discordDone ? 1 : 0);
  const pct = complete ? 100 : Math.round((doneCount / totalWithDiscord) * 100);

  $('unlockProgressBar').style.width = `${pct}%`;
  if (complete) {
    $('unlockStepLabel').textContent = t('stepDoneLabel', total);
    $('unlockHelperText').textContent = t('helperReady');
  } else if (needsDiscord) {
    $('unlockStepLabel').textContent = t('discordStepLabel');
    $('unlockHelperText').textContent = t('discordHelper', rememberDays, waitSec);
  } else {
    $('unlockStepLabel').textContent = t('stepLabel', step, total);
    $('unlockHelperText').textContent = t('helperText', waitSec);
  }

  let pillsHtml = '';
  if (showDiscordPill) {
    const dCls = discordDone ? 'done' : 'active';
    const dIcon = discordDone ? 'check-circle-2' : 'message-square';
    pillsHtml += `<div class="step-pill discord-pill ${dCls}"><i data-lucide="${dIcon}" style="width:14px;height:14px"></i><span>${t('discordPill')}</span></div>`;
  }
  for (let i = 0; i < total; i++) {
    const cls = i < step || complete ? 'done' : (!needsDiscord && i === step ? 'active' : '');
    const icon = i < step || complete ? 'check-circle-2' : 'clock';
    pillsHtml += `<div class="step-pill ${cls}"><i data-lucide="${icon}" style="width:14px;height:14px"></i><span>${t('stepPill', i + 1, waitSec)}</span></div>`;
  }
  $('unlockStepIndicators').innerHTML = pillsHtml;

  const btn = $('unlockActionBtn');
  const btnTxt = $('unlockActionText');
  btn.classList.toggle('is-discord', needsDiscord);
  if (state.isBusy) {
    btn.disabled = true;
    btnTxt.textContent = t('checkingBtn');
  } else if (state.countdown !== null) {
    btn.disabled = true;
    btnTxt.textContent = needsDiscord ? t('discordWaiting', state.countdown) : t('waitingBtn', state.countdown);
  } else if (complete) {
    btn.disabled = false;
    btnTxt.textContent = t('revealBtn');
  } else if (needsDiscord) {
    btn.disabled = false;
    btnTxt.textContent = t('discordBtn');
  } else if (step > 0) {
    btn.disabled = false;
    btnTxt.textContent = t('continueBtn', step, total);
  } else {
    btn.disabled = false;
    btnTxt.textContent = t('startBtn', total);
  }
  refreshIcons();
}

async function handleUnlockButtonClick() {
  if (!state.activeScript || state.isBusy || state.countdown !== null) return;

  if (state.session && state.session.complete) {
    await revealScriptCode(false);
    return;
  }

  // Open blank tab synchronously on user click so popup blockers allow it
  const adWin = window.open('about:blank', '_blank');
  if (adWin) adWin.opener = null;

  try {
    if (!state.session) {
      state.isBusy = true;
      renderUnlockUI();
      const res = await fetch('/api/unlock/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: state.activeScript.id, discordJoined: isDiscordRemembered() })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to start unlock');
      state.session = data.session;
      saveScriptSession(state.activeScript.id, state.session.id);
      state.isBusy = false;
    }

    const goUrl = `/api/unlock/go?session=${encodeURIComponent(state.session.id)}&d=${state.session.discordDone ? 1 : 0}&s=${state.session.step}&t=${Date.now()}`;
    if (adWin) {
      adWin.location.href = goUrl;
    } else {
      window.open(goUrl, '_blank', 'noopener');
    }

    startCountdown(state.session.waitSeconds || 5);
  } catch (err) {
    if (adWin) try { adWin.close(); } catch (e) {}
    state.isBusy = false;
    renderUnlockUI();
    showToast(err.message || 'Unlock failed', 'error');
  }
}

function startCountdown(seconds) {
  clearCountdown();
  state.countdown = seconds;
  renderUnlockUI();

  const tick = () => {
    if (state.countdown === null) return;
    if (state.countdown <= 0) {
      state.countdown = null;
      verifyUnlockStep(0);
      return;
    }
    state.timerId = setTimeout(() => {
      if (state.countdown === null) return;
      state.countdown -= 1;
      renderUnlockUI();
      tick();
    }, 1000);
  };
  tick();
}

async function verifyUnlockStep(attempt) {
  if (!state.session) return;
  state.isBusy = true;
  renderUnlockUI();
  try {
    const res = await fetch('/api/unlock/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: state.session.id })
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.code === 'too_early' && attempt < 5) {
        state.isBusy = false;
        startCountdown(Math.max(2, Number(data.secondsLeft) || 2));
        return;
      }
      if (data.code === 'session_not_found') {
        state.session = null;
      }
      throw new Error(data.error || 'Step verification failed');
    }
    state.session = data.session;
    state.isBusy = false;
    if (data.discordJustCompleted) {
      const days = state.unlockConfig.discordRememberDays || 30;
      markDiscordRemembered(days);
      showToast(t('discordToastDone', days), 'success');
    } else if (state.session.complete) {
      showToast(t('revealedBadge'), 'success');
    }
    renderUnlockUI();
  } catch (err) {
    state.isBusy = false;
    renderUnlockUI();
    showToast(err.message, 'error');
  }
}

async function revealScriptCode(useVip) {
  if (!state.activeScript || state.isBusy) return;
  state.isBusy = true;
  renderUnlockUI();
  try {
    const res = await fetch('/api/unlock/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scriptId: state.activeScript.id,
        session: state.session ? state.session.id : '',
        vipToken: useVip ? state.vipToken : ''
      })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Cannot reveal script');

    saveScriptSession(state.activeScript.id, null);
    $('unlockActions').classList.add('hidden');
    $('revealedBox').classList.remove('hidden');
    $('revealedCode').value = data.code || '';
    state.isBusy = false;
    refreshIcons();
  } catch (err) {
    state.isBusy = false;
    renderUnlockUI();
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// Discord VIP Verification
// ==========================================================================
async function checkVipSession() {
  const params = new URLSearchParams(window.location.search);
  const incomingToken = params.get('vip_token');
  if (incomingToken) {
    state.vipToken = incomingToken;
    localStorage.setItem('blacklist_vip_token', incomingToken);
    params.delete('vip_token');
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.replaceState({}, '', cleanUrl);
  }

  if (!state.vipToken) return;
  try {
    const res = await fetch(`/api/verify-vip?token=${encodeURIComponent(state.vipToken)}`);
    const data = await res.json();
    if (res.ok && data.valid) {
      state.vipUser = data.user || {};
      state.canBypass = Boolean(data.canBypass);
      updateVipUI(data);
    } else {
      localStorage.removeItem('blacklist_vip_token');
      state.vipToken = '';
    }
  } catch (e) {}
}

function updateVipUI(data) {
  const btn = $('vipOpenBtn');
  const mobBtn = $('mobVipBtn');
  if (state.canBypass) {
    btn.classList.add('is-vip');
    if (mobBtn) mobBtn.classList.add('is-vip');
    $('vipBtnText').textContent = state.vipUser?.username || 'VIP';
    const entryEl = $('entryGateModal');
    if (entryEl) {
      entryEl.classList.add('hidden');
      syncModalScrollLock();
    }
  }
  if (state.vipUser) {
    $('vipUserCard').classList.remove('hidden');
    $('vipLogoutBtn').classList.remove('hidden');
    $('vipUsername').textContent = state.vipUser.username || 'User';
    $('vipRoleBadge').textContent = data.primaryRole?.tag || (state.canBypass ? 'VIP Bypass' : 'Member');
    if (state.vipUser.avatar) {
      $('vipAvatar').src = `https://cdn.discordapp.com/avatars/${state.vipUser.userId}/${state.vipUser.avatar}.png`;
    }
  }
}

function switchView(target) {
  if (!target) return;
  state.view = target;
  document.querySelectorAll('.nav-tab').forEach((x) => {
    x.classList.toggle('active', x.getAttribute('data-view') === target);
  });
  document.querySelectorAll('.mobile-nav-btn[data-mobile-view]').forEach((x) => {
    x.classList.toggle('active', x.getAttribute('data-mobile-view') === target);
  });
  $('scriptsView').classList.toggle('hidden', target !== 'scripts');
  $('executorsView').classList.toggle('hidden', target !== 'executors');
  if (target === 'executors') loadExecutors();
  if (window.innerWidth <= 768) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ==========================================================================
// Events & Init
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();

  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.getAttribute('data-view')));
  });

  document.querySelectorAll('.mobile-nav-btn[data-mobile-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-mobile-view')));
  });

  const mobSearchBtn = $('mobSearchBtn');
  if (mobSearchBtn) {
    mobSearchBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => $('searchInput')?.focus(), 220);
    });
  }

  const mobVipBtn = $('mobVipBtn');
  if (mobVipBtn) {
    mobVipBtn.addEventListener('click', () => {
      $('vipModal').classList.remove('hidden');
      syncModalScrollLock();
    });
  }

  $('searchInput').addEventListener('input', (e) => {
    state.search = e.target.value || '';
    renderScripts();
    if (state.view === 'executors') renderExecutors();
  });

  document.querySelectorAll('.hero .chip[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.filter = chip.getAttribute('data-filter') || 'all';
      document.querySelectorAll('.hero .chip[data-filter]').forEach((c) => c.classList.toggle('active', c === chip));
      renderScripts();
    });
  });

  document.querySelectorAll('#execFilterChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.execPlatform = chip.getAttribute('data-platform') || 'all';
      document.querySelectorAll('#execFilterChips .chip').forEach((c) => c.classList.toggle('active', c === chip));
      renderExecutors();
    });
  });

  $('resetFiltersBtn').addEventListener('click', () => {
    state.search = '';
    state.filter = 'all';
    state.game = 'all';
    $('searchInput').value = '';
    document.querySelectorAll('.hero .chip[data-filter]').forEach((c) => c.classList.toggle('active', c.getAttribute('data-filter') === 'all'));
    renderGamePills();
    renderScripts();
  });

  $('langToggleBtn').addEventListener('click', () => {
    state.lang = state.lang === 'th' ? 'en' : 'th';
    localStorage.setItem('bs_lang', state.lang);
    applyTranslations();
  });

  $('closeScriptModal').addEventListener('click', closeScriptModal);
  $('scriptModal').addEventListener('click', (e) => {
    if (e.target === $('scriptModal')) closeScriptModal();
  });

  $('unlockActionBtn').addEventListener('click', handleUnlockButtonClick);
  $('vipUnlockBtn').addEventListener('click', () => revealScriptCode(true));

  $('copyCodeBtn').addEventListener('click', async () => {
    const code = $('revealedCode').value;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      $('revealedCode').select();
      document.execCommand('copy');
    }
    $('copyCodeText').textContent = t('copiedCode');
    showToast(t('copiedCode'), 'success');
    setTimeout(() => { $('copyCodeText').textContent = t('copyCode'); }, 2200);
  });

  $('vipOpenBtn').addEventListener('click', () => {
    $('vipModal').classList.remove('hidden');
    syncModalScrollLock();
  });
  $('closeVipModal').addEventListener('click', () => {
    $('vipModal').classList.add('hidden');
    syncModalScrollLock();
  });
  $('vipModal').addEventListener('click', (e) => {
    if (e.target === $('vipModal')) {
      $('vipModal').classList.add('hidden');
      syncModalScrollLock();
    }
  });
  $('vipLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem('blacklist_vip_token');
    state.vipToken = '';
    state.vipUser = null;
    state.canBypass = false;
    $('vipOpenBtn').classList.remove('is-vip');
    if ($('mobVipBtn')) $('mobVipBtn').classList.remove('is-vip');
    $('vipBtnText').textContent = t('vipBtn');
    $('vipUserCard').classList.add('hidden');
    $('vipLogoutBtn').classList.add('hidden');
    showToast('Signed out', 'info');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeScriptModal();
      $('vipModal').classList.add('hidden');
      syncModalScrollLock();
    }
  });

  const entrySubBtn = $('entrySubBtn');
  if (entrySubBtn) {
    entrySubBtn.addEventListener('click', () => {
      if (state.entrySubDone || state.entrySubBusy) return;
      window.open(getYoutubeSubUrl(), '_blank', 'noopener,noreferrer');
      state.entrySubBusy = true;
      entrySubBtn.disabled = true;
      let left = Number(state.entryTasks?.waitSeconds) || 5;
      $('entrySubBtnText').textContent = t('entryTaskWait', left);
      const iv = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          clearInterval(iv);
          state.entrySubBusy = false;
          state.entrySubDone = true;
          try {
            localStorage.setItem('bs_yt_subbed_until', String(Date.now() + 30 * 86400 * 1000));
          } catch (e) {}
          renderEntryGateUI();
        } else {
          $('entrySubBtnText').textContent = t('entryTaskWait', left);
        }
      }, 1000);
    });
  }

  const entryLikeBtn = $('entryLikeBtn');
  if (entryLikeBtn) {
    entryLikeBtn.addEventListener('click', async () => {
      if (state.entryLikeDone || state.entryLikeBusy) return;
      const vidWin = window.open('about:blank', '_blank');
      if (vidWin) vidWin.opener = null;
      const vidUrl = await resolveLatestVideoForEntry();
      if (vidWin) vidWin.location.href = vidUrl;
      else window.open(vidUrl, '_blank', 'noopener,noreferrer');

      state.entryLikeBusy = true;
      entryLikeBtn.disabled = true;
      let left = Number(state.entryTasks?.waitSeconds) || 5;
      $('entryLikeBtnText').textContent = t('entryTaskWait', left);
      const iv = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          clearInterval(iv);
          state.entryLikeBusy = false;
          state.entryLikeDone = true;
          renderEntryGateUI();
        } else {
          $('entryLikeBtnText').textContent = t('entryTaskWait', left);
        }
      }, 1000);
    });
  }

  const entryGateEnterBtn = $('entryGateEnterBtn');
  if (entryGateEnterBtn) {
    entryGateEnterBtn.addEventListener('click', () => {
      if (!state.entrySubDone || !state.entryLikeDone) return;
      const hours = Math.max(1, Number(state.entryTasks?.rememberHours) || 24);
      try {
        localStorage.setItem('bs_entry_yt_until', String(Date.now() + hours * 3600 * 1000));
      } catch (e) {}
      $('entryGateModal').classList.add('hidden');
      syncModalScrollLock();
      showToast(t('entryEnterReady'), 'success');
    });
  }

  const entryVipBtn = $('entryVipBtn');
  if (entryVipBtn) {
    entryVipBtn.addEventListener('click', () => {
      $('vipModal').classList.remove('hidden');
      syncModalScrollLock();
    });
  }

  refreshIcons();
  checkVipSession();
  loadPublicScripts();
});

