/* ==========================================================================
   SocialWolvez / Sub2Unlock Style Gateway Logic
   - 6 Tasks Unlock: 3 YouTube (Subscribe + Like + Comment) + 3 Ad Links
   - Monetag Direct Links + 100% Monetization Yield
   - Multi-Language Support (Thai / English Auto Detection)
   ========================================================================== */

// Multi-Language Dictionary (i18n)
const I18N = {
  th: {
    defaultTitle: 'ปลดล็อกลิงก์และไฟล์ฟรี',
    defaultDesc: 'ทำภารกิจสนับสนุน 6 ขั้นตอนด้านล่างเพื่อรับไฟล์/สคริปต์ฟรี',
    scriptTitle: 'แจกสคริปต์ฟรี (Script Access)',
    scriptDesc: 'ทำภารกิจ 6 ขั้นตอนด้านล่างเพื่อปลดล็อกและรับโค้ดสคริปต์',
    gateTitle: 'ระบบยืนยันสิทธิ์ Security Access Gate',
    gateDesc: 'ทำภารกิจ 6 ขั้นตอนด้านล่างเพื่อรับสิทธิ์เข้าใช้งานเว็บฟรี 24 ชั่วโมง',
    task1: 'Subscribe on YouTube (กดติดตาม)',
    task2: 'Like Video (กดไลค์คลิป)',
    task3: 'Comment Video (คอมเมนต์คลิป)',
    task4: 'Visit Sponsor #1 (ลิงก์โฆษณา 1)',
    task5: 'Visit Sponsor #2 (ลิงก์โฆษณา 2)',
    task6: 'Visit Sponsor #3 (ลิงก์โฆษณา 3)',
    task7: 'Visit Sponsor #4 (ลิงก์โฆษณา 4)',
    verifying: 'กำลังตรวจสอบ...',
    progress: 'Unlock progress',
    unlockBtn: 'Unlock (ดาวน์โหลดไฟล์ ➔)',
    getScriptBtn: 'กดรับสคริปต์ (Get Script ➔)',
    enterWebBtn: 'เข้าสู่เว็บไซต์ (Enter Website ➔)',
    redirecting: 'กำลังพาวาร์ปเข้าสู่หน้าดาวน์โหลด...',
    redirectingHub: 'กำลังเข้าสู่เว็บไซต์...',
    toastStepDone: (done, total) => `✅ สำเร็จ! (${done}/${total}) เหลืออีก ${total - done} ภารกิจ`,
    toastAllDone: (total) => `🎉 ครบ ${total} ภารกิจแล้ว! ปลดล็อกเรียบร้อย`,
    toastUnlocked: '🎉 ปลดล็อกเรียบร้อย! แตะปุ่มด้านล่างได้เลย',
    toastScriptCopied: '🎉 ปลดล็อกสำเร็จ! คัดลอกสคริปต์ให้เรียบร้อยแล้ว',
    toastClipboard: '📋 คัดลอกสคริปต์แล้ว! นำไปวางใน Executor ได้เลย',
    toastCopyFail: 'กรุณากดค้างที่โค้ดเพื่อคัดลอก',
    scriptStatus: 'ปลดล็อกสำเร็จแล้ว 🎉',
    btnCopy: 'คัดลอกสคริปต์ (Copy Script) 📋',
    btnCopied: 'คัดลอกเรียบร้อยแล้ว! ✅',
    btnCopyAgain: 'คัดลอกสคริปต์อีกครั้ง (Copy Again) 📋',
    inAppNotice: '💡 เปิดในแอป? แนะนำกด ⋯ มุมขวาแล้วเลือก "เปิดในเบราว์เซอร์หลัก"',
    retryTask: 'แตะเพื่อเริ่มภารกิจใหม่ ↻',
    toastTabClosedEarly: '❌ คุณปิดแท็บโฆษณาก่อนเวลา! ต้องเปิดทิ้งไว้จนกว่าเวลานับถอยหลังจะหมด',
    humanVerifyPrompt: 'ยืนยันว่าไม่ใช่บอท (Verify you are human)',
    humanVerifying: 'กำลังตรวจสอบความปลอดภัย...',
    humanVerified: 'ยืนยันตัวตนสำเร็จแล้ว ✅',
    toastNeedHumanVerify: '⚠️ กรุณากดยืนยันว่าไม่ใช่บอทด้านล่างก่อนปลดล็อก',
    pleaseVerifyHuman: 'กรุณายืนยันว่าไม่ใช่บอทด้านบน ⬆️'
  },
  en: {
    defaultTitle: 'Unlock Free Script & Download',
    defaultDesc: 'Complete the sponsor steps below to get instant access',
    scriptTitle: 'Free Script Access',
    scriptDesc: 'Complete the sponsor steps below to unlock and copy the script',
    gateTitle: 'Security Verification Gate',
    gateDesc: 'Complete the steps below to verify access for 24 hours',
    task1: 'Subscribe on YouTube',
    task2: 'Like Video',
    task3: 'Comment on Video',
    task4: 'Visit Sponsor #1',
    task5: 'Visit Sponsor #2',
    task6: 'Visit Sponsor #3',
    task7: 'Visit Sponsor #4',
    verifying: 'Verifying...',
    progress: 'Unlock progress',
    unlockBtn: 'Download File ➔',
    getScriptBtn: 'Get Script ➔',
    enterWebBtn: 'Enter Website ➔',
    redirecting: 'Redirecting to download page...',
    redirectingHub: 'Entering website...',
    toastStepDone: (done, total) => `✅ Done! (${done}/${total}) ${total - done} steps left`,
    toastAllDone: (total) => `🎉 All ${total} steps completed! Unlocked`,
    toastUnlocked: '🎉 Unlocked! Tap the button below',
    toastScriptCopied: '🎉 Script unlocked and copied to clipboard!',
    toastClipboard: '📋 Script copied! Paste into your executor',
    toastCopyFail: 'Please long-press the code to copy',
    scriptStatus: 'Unlocked Successfully 🎉',
    btnCopy: 'Copy Script 📋',
    btnCopied: 'Copied to Clipboard! ✅',
    btnCopyAgain: 'Copy Script Again 📋',
    inAppNotice: '💡 Using in-app browser? Tap ⋯ and select "Open in Browser"',
    retryTask: 'Tap to retry task ↻',
    toastTabClosedEarly: '❌ Sponsor tab was closed early! Please keep it open until countdown finishes.',
    humanVerifyPrompt: 'Verify you are human',
    humanVerifying: 'Checking security...',
    humanVerified: 'Human Verified ✅',
    toastNeedHumanVerify: '⚠️ Please verify you are human before unlocking',
    pleaseVerifyHuman: 'Please verify you are human above ⬆️'
  }
};

function getCurrentLang() {
  const p = new URLSearchParams(window.location.search);
  const lang = (p.get('lang') || '').toLowerCase();
  if (lang === 'en' || lang === 'eng') return 'en';
  if (lang === 'th') return 'th';

  const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (navLang.startsWith('th')) return 'th';
  return 'en';
}

function t(key, ...args) {
  const lang = getCurrentLang();
  const dict = I18N[lang] || I18N.en;
  const val = dict[key];
  if (typeof val === 'function') {
    return val(...args);
  }
  return val !== undefined ? val : (I18N.en[key] || key);
}

function applyStaticTranslations() {
  const lang = getCurrentLang();
  document.documentElement.lang = lang;

  const t1 = document.getElementById('txtTask1');
  const t2 = document.getElementById('txtTask2');
  const t3 = document.getElementById('txtTask3');
  const t4 = document.getElementById('txtTask4');
  const t5 = document.getElementById('txtTask5');
  const t6 = document.getElementById('txtTask6');
  const t7 = document.getElementById('txtTask7');

  if (t1) t1.textContent = t('task1');
  if (t2) t2.textContent = t('task2');
  if (t3) t3.textContent = t('task3');
  if (t4) t4.textContent = t('task4');
  if (t5) t5.textContent = t('task5');
  if (t6) t6.textContent = t('task6');
  if (t7) t7.textContent = t('task7');

  const lblProgress = document.getElementById('lblUnlockProgress');
  if (lblProgress) lblProgress.textContent = t('progress');

  const scriptStatus = document.getElementById('scriptStatusText');
  if (scriptStatus) scriptStatus.textContent = t('scriptStatus');

  const btnCopyScript = document.getElementById('txtCopyScript');
  if (btnCopyScript) btnCopyScript.textContent = t('btnCopy');

  const vTxt = document.getElementById('verifyText');
  if (vTxt && !isHumanVerified) {
    vTxt.textContent = t('humanVerifyPrompt');
  }
}

// LootLabs Dynamic Countdown Timer Engine
function getTaskDuration(taskNum) {
  const p = new URLSearchParams(window.location.search);
  if (p.get('fast') === '1') return 3; // Fast test mode (?fast=1)

  const isThai = getCurrentLang() === 'th';
  // Tasks 1-3 (YouTube sub/like/comment)
  if (taskNum <= 3) {
    return isThai ? 5 : 8;
  }

  // Sponsor Tasks 4-7:
  if (isThai) {
    // Thai users: shorter (15-20s) so they don't get bored
    return Math.floor(Math.random() * (20 - 15 + 1)) + 15;
  } else {
    // Foreign/International users: 60 - 80s randomized! (LootLabs Tier-1 monetization)
    return Math.floor(Math.random() * (80 - 60 + 1)) + 60;
  }
}

let TOTAL_TASKS = 6;
let destinationUrl = '';
let targetScriptCode = '';
let cachedLatestVideoUrl = '';
let currentLockerChannel = '';
const tasksDone = [false, false, false, false, false, false, false];
const isVerifying = [false, false, false, false, false, false, false];
const activeAdWindows = {};
const activeTimers = {};
let isHumanVerified = false;
let isVerifyingHuman = false;

// LootLabs Human Verification Checkbox Handler
window.handleHumanVerifyClick = function() {
  if (isHumanVerified || isVerifyingHuman) return;
  isVerifyingHuman = true;

  const spinner = document.getElementById('verifySpinner');
  const checkIcon = document.getElementById('verifyCheckIcon');
  const txt = document.getElementById('verifyText');
  const card = document.getElementById('humanVerifyCard');

  if (spinner) spinner.style.display = 'block';
  if (txt) txt.textContent = t('humanVerifying');

  setTimeout(() => {
    isVerifyingHuman = false;
    isHumanVerified = true;

    if (spinner) spinner.style.display = 'none';
    if (checkIcon) checkIcon.style.display = 'block';
    if (txt) txt.textContent = t('humanVerified');
    if (card) card.classList.add('verified');

    if (window.lucide) lucide.createIcons();
    showToast(`🛡️ ${t('humanVerified')}`, 'success', 2500);

    updateProgressState();
  }, 1200);
};

// Multi-Network Direct Link Pool (Fresh User Zones)
const AD_DIRECT_POOL = [
  'https://uplcm.com/4/12157091',
  'https://uplcm.com/4/12157092',
  'https://uplcm.com/4/12157093',
  'https://uplcm.com/4/12157094'
];

function getAdPool() {
  try {
    const custom = localStorage.getItem('monetag_custom_pool');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return AD_DIRECT_POOL;
}

// Dynamically configure number of ad rounds (0, 1, 2, 3, or 4 ads)
function applyAdRounds(adCount) {
  const count = (adCount !== undefined && !isNaN(adCount)) ? parseInt(adCount, 10) : 3;
  const btn4 = document.getElementById('btnTask4');
  const btn5 = document.getElementById('btnTask5');
  const btn6 = document.getElementById('btnTask6');
  const btn7 = document.getElementById('btnTask7');

  if (btn4) btn4.style.display = count >= 1 ? 'flex' : 'none';
  if (btn5) btn5.style.display = count >= 2 ? 'flex' : 'none';
  if (btn6) btn6.style.display = count >= 3 ? 'flex' : 'none';
  if (btn7) btn7.style.display = count >= 4 ? 'flex' : 'none';

  TOTAL_TASKS = 3 + Math.max(0, Math.min(4, count));
  const progressText = document.getElementById('txtProgressVal');
  if (progressText) {
    const completedCount = tasksDone.slice(0, TOTAL_TASKS).filter(Boolean).length;
    progressText.textContent = `${completedCount}/${TOTAL_TASKS}`;
  }
}

// Track GateFlow Click / Unlock Events into Firestore
function trackGateEvent(slug, eventType) {
  if (!slug) return;
  const cleanSlug = slug.toLowerCase().trim();
  const sessionKey = 'gf_tracked_' + eventType + '_' + cleanSlug;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, '1');

  fetch('/api/gate/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: cleanSlug, event: eventType })
  }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
  applyStaticTranslations();
  initCustomTitleAndDesc();
  initDestinationUrl();

  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.toLowerCase();
  const slug = path.startsWith('/l/') ? path.slice(3).trim() : (params.get('slug') || (path === '/access' || path === '/hub' || path === '/gate' ? 'hub-access' : ''));

  if (params.get('ads') !== null) {
    applyAdRounds(params.get('ads'));
  }

  if (slug) {
    trackGateEvent(slug, 'click');
  }

  if (slug && slug !== 'hub-access') {
    loadLockerBySlug(slug);
  } else {
    fetchLatestVideo();
  }

  checkInAppBrowser();
  if (window.lucide) lucide.createIcons();
});

// Load Locker configuration from Firestore / API when short slug is visited (/l/:slug)
async function loadLockerBySlug(slug) {
  if (!slug || slug === 'hub-access') return;
  try {
    const res = await fetch(`/api/locker?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) {
      fetchLatestVideo();
      return;
    }
    const data = await res.json();
    if (data && data.success && data.locker) {
      const l = data.locker;
      if (l.url) destinationUrl = l.url;
      if (l.script) targetScriptCode = l.script;

      const titleEl = document.getElementById('lockerTitle');
      const descEl = document.getElementById('lockerDesc');
      if (l.title && titleEl) titleEl.textContent = l.title;
      if (l.desc && descEl) descEl.textContent = l.desc;
      if (l.title) document.title = `${l.title} — Social Unlock Gateway`;

      if (l.ch) {
        currentLockerChannel = l.ch;
      }
      if (l.ads !== undefined) {
        applyAdRounds(l.ads);
      }
      fetchLatestVideo();

      const txtUnlock = document.getElementById('txtUnlock');
      if (txtUnlock) {
        if (targetScriptCode) {
          txtUnlock.textContent = t('getScriptBtn');
        } else {
          txtUnlock.textContent = t('unlockBtn');
        }
      }
    } else {
      fetchLatestVideo();
    }
  } catch (err) {
    console.warn('Could not load slug from API:', err);
    fetchLatestVideo();
  }
}

// 1. Initialize Custom or Default Title & Description
function initCustomTitleAndDesc() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || '';
  const returnTo = params.get('return_to') || params.get('url') || params.get('redirect') || '';
  const script = params.get('script') || '';
  const path = window.location.pathname.toLowerCase();
  const isAccessGate = path === '/access' || path === '/hub' || path === '/gate' || slug === 'hub-access' || returnTo === '/' || returnTo.includes('localhost') || returnTo.includes('blacklisthub');

  let defaultTitle = t('defaultTitle');
  let defaultDesc = t('defaultDesc');

  if (script) {
    defaultTitle = t('scriptTitle');
    defaultDesc = t('scriptDesc');
  } else if (isAccessGate) {
    defaultTitle = t('gateTitle');
    defaultDesc = t('gateDesc');
  }

  const title = params.get('title') || defaultTitle;
  const desc = params.get('desc') || defaultDesc;

  const titleEl = document.getElementById('lockerTitle');
  const descEl = document.getElementById('lockerDesc');

  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;

  // Update browser tab title dynamically
  document.title = `${title} — Social Unlock Gateway`;
}

// 2. Resolve Destination URL (MediaFire / Google Drive) or Embedded Script
function initDestinationUrl() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('return_to') || params.get('url') || params.get('redirect') || '';
  const script = params.get('script') || '';

  if (script) {
    targetScriptCode = script;
  }

  if (returnTo) {
    destinationUrl = returnTo;
  } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    destinationUrl = '/';
  } else {
    destinationUrl = `${window.location.origin}/`;
  }
}

// Helper: Check if GhostSensix channel is active for this locker
function isGhostSensixActive() {
  const params = new URLSearchParams(window.location.search);
  const ch = (params.get('ch') || params.get('yt') || currentLockerChannel || '').toLowerCase();
  const search = window.location.search.toLowerCase();
  return ch.includes('ghost') || ch.includes('freefire') || search.includes('ghost') || search.includes('freefire');
}

// Helper: Get Target YouTube Channel URL (with auto-subscribe popup)
function getTargetYoutubeUrl() {
  if (isGhostSensixActive()) {
    return 'https://www.youtube.com/@GhostSensix?sub_confirmation=1';
  }

  const params = new URLSearchParams(window.location.search);
  const customYt = params.get('yt') || params.get('ch') || currentLockerChannel;
  if (customYt && customYt !== 'Blacklistxyx') {
    let url = customYt.trim();
    if (!url.startsWith('http')) {
      url = `https://www.youtube.com/${url.startsWith('@') ? url : '@' + url}`;
    }
    return url.includes('sub_confirmation') ? url : `${url}${url.includes('?') ? '&' : '?'}sub_confirmation=1`;
  }

  return 'https://www.youtube.com/@Blacklistxyx?sub_confirmation=1';
}

// Auto-fetch latest YouTube video in the background via Worker API
async function fetchLatestVideo() {
  const params = new URLSearchParams(window.location.search);
  const customVideo = params.get('v') || params.get('video');
  if (customVideo) {
    cachedLatestVideoUrl = customVideo;
    return;
  }

  const isGhost = isGhostSensixActive();
  const customCh = params.get('ch') || params.get('yt') || currentLockerChannel || '';
  const targetCh = isGhost ? 'GhostSensix' : (customCh ? customCh : 'Blacklistxyx');

  try {
    const res = await fetch(`/api/latest-video?ch=${encodeURIComponent(targetCh)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.videoUrl) {
        cachedLatestVideoUrl = data.videoUrl;
        return;
      }
    }
  } catch (e) {}

  // Fallback if API hasn't loaded or local dev
  if (isGhost) {
    cachedLatestVideoUrl = 'https://www.youtube.com/watch?v=HVPqCzVCnQk';
  } else {
    cachedLatestVideoUrl = 'https://www.youtube.com/watch?v=ClBmbJDIWzA';
  }
}

// Helper: Get Target YouTube Video URL (Auto resolved from YouTube channel)
function getTargetVideoUrl() {
  const params = new URLSearchParams(window.location.search);
  const customVideo = params.get('v') || params.get('video');
  if (customVideo) return customVideo;

  if (isGhostSensixActive()) {
    // For GhostSensix: strictly prevent any fallback to Blacklistxyx
    if (cachedLatestVideoUrl && cachedLatestVideoUrl.includes('watch?v=')) {
      if (!cachedLatestVideoUrl.includes('ClBmbJDIWzA')) {
        return cachedLatestVideoUrl;
      }
    }
    return 'https://www.youtube.com/watch?v=HVPqCzVCnQk';
  }

  if (cachedLatestVideoUrl) {
    return cachedLatestVideoUrl;
  }

  return 'https://www.youtube.com/watch?v=ClBmbJDIWzA';
}

// 3. Handle Social Task Clicks (1-6)
window.handleTaskClick = function(taskNum) {
  const idx = taskNum - 1;
  if (idx < 0 || idx >= TOTAL_TASKS) return;
  if (tasksDone[idx] || isVerifying[idx]) return;

  const btn = document.getElementById(`btnTask${taskNum}`);
  const txt = document.getElementById(`txtTask${taskNum}`);
  const checkIcon = document.getElementById(`checkTask${taskNum}`);

  // 1. Resolve Target URL
  let targetUrl = '';
  const pool = getAdPool();
  if (taskNum === 1) {
    targetUrl = getTargetYoutubeUrl();
  } else if (taskNum === 2) {
    targetUrl = getTargetVideoUrl();
  } else if (taskNum === 3) {
    targetUrl = getTargetVideoUrl();
  } else if (taskNum === 4) {
    targetUrl = pool[0] || AD_DIRECT_POOL[0];
  } else if (taskNum === 5) {
    targetUrl = pool[1] || AD_DIRECT_POOL[1];
  } else if (taskNum === 6) {
    targetUrl = pool[2] || AD_DIRECT_POOL[2];
  } else if (taskNum === 7) {
    targetUrl = pool[3] || AD_DIRECT_POOL[3] || pool[0];
  }

  // 2. Open Target URL in a new window/tab and track window reference
  let adWin = null;
  try {
    adWin = window.open(targetUrl, '_blank');
    activeAdWindows[idx] = adWin;
  } catch (e) {}

  if (!adWin) {
    try {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 100);
    } catch (e) {}
  }

  // 3. Start Dynamic Verification Timer (LootLabs Tab Keep-Alive Anti-Cheat)
  isVerifying[idx] = true;
  let totalSec = getTaskDuration(taskNum);
  let secLeft = totalSec;

  btn.classList.add('verifying');
  btn.classList.remove('completed');
  txt.textContent = `${t('verifying')} (${secLeft}s)`;

  if (activeTimers[idx]) clearInterval(activeTimers[idx]);

  activeTimers[idx] = setInterval(() => {
    // ANTI-CHEAT TAB CHECK (LootLabs Engine):
    // If user opened the sponsor tab and closed it before countdown completes:
    if (adWin && adWin.closed && secLeft > 2) {
      clearInterval(activeTimers[idx]);
      isVerifying[idx] = false;
      tasksDone[idx] = false;
      btn.classList.remove('verifying');
      btn.classList.remove('completed');
      txt.textContent = t('retryTask');
      showToast(t('toastTabClosedEarly'), 'error', 5500);
      return;
    }

    secLeft--;
    if (secLeft > 0) {
      txt.textContent = `${t('verifying')} (${secLeft}s)`;
    } else {
      clearInterval(activeTimers[idx]);
      tasksDone[idx] = true;
      isVerifying[idx] = false;

      btn.classList.remove('verifying');
      btn.classList.add('completed');

      const labels = [
        'Subscribed on YouTube ✅',
        'Liked Video ✅',
        'Commented on Video ✅',
        'Sponsor Link #1 Verified ✅',
        'Sponsor Link #2 Verified ✅',
        'Sponsor Link #3 Verified ✅',
        'Sponsor Link #4 Verified ✅'
      ];
      txt.textContent = labels[idx];
      if (checkIcon) checkIcon.style.display = 'block';

      const completedCount = tasksDone.slice(0, TOTAL_TASKS).filter(Boolean).length;
      if (completedCount < TOTAL_TASKS) {
        showToast(t('toastStepDone', completedCount, TOTAL_TASKS), 'success', 2200);
      } else {
        showToast(t('toastAllDone', TOTAL_TASKS), 'success', 3500);
      }

      updateProgressState();
    }
  }, 1000);

  if (window.lucide) lucide.createIcons();
};

// 4. Update Progress Bar & Unlock State
function updateProgressState() {
  const completedCount = tasksDone.slice(0, TOTAL_TASKS).filter(Boolean).length;
  const progressText = document.getElementById('txtProgressVal');
  const progressBar = document.getElementById('barProgressFill');
  const btnUnlock = document.getElementById('btnUnlock');
  const txtUnlock = document.getElementById('txtUnlock');
  const iconUnlock = document.getElementById('iconUnlock');

  if (progressText) progressText.textContent = `${completedCount}/${TOTAL_TASKS}`;
  if (progressBar) progressBar.style.width = `${(completedCount / TOTAL_TASKS) * 100}%`;

  // When all required tasks are completed
  if (completedCount >= TOTAL_TASKS) {
    if (isHumanVerified) {
      if (btnUnlock) {
        btnUnlock.disabled = false;
        btnUnlock.className = 'btn-social-unlock ready';
      }
      if (txtUnlock) {
        if (targetScriptCode) {
          txtUnlock.textContent = t('getScriptBtn');
        } else {
          const path = window.location.pathname.toLowerCase();
          const isHub = path === '/access' || path === '/hub' || path === '/gate' || window.location.search.includes('hub-access') || destinationUrl === '/' || destinationUrl.includes('blacklisthub') || destinationUrl.includes('localhost');
          txtUnlock.textContent = isHub ? t('enterWebBtn') : t('unlockBtn');
        }
      }
      if (iconUnlock) {
        iconUnlock.setAttribute('data-lucide', 'sparkles');
        if (window.lucide) lucide.createIcons();
      }
      showToast(t('toastUnlocked'), 'success', 3500);
    } else {
      // Tasks done, but human verification is still pending
      if (btnUnlock) {
        btnUnlock.disabled = false;
        btnUnlock.className = 'btn-social-unlock pending-verify';
      }
      if (txtUnlock) {
        txtUnlock.textContent = t('pleaseVerifyHuman');
      }
      if (iconUnlock) {
        iconUnlock.setAttribute('data-lucide', 'shield-alert');
        if (window.lucide) lucide.createIcons();
      }
    }
  }
}

// 5. Handle Final Unlock Button Click
window.handleUnlockClick = function() {
  const completedCount = tasksDone.slice(0, TOTAL_TASKS).filter(Boolean).length;
  if (completedCount < TOTAL_TASKS) return;

  // Check Human Verification (LootLabs style)
  if (!isHumanVerified) {
    showToast(t('toastNeedHumanVerify'), 'error', 3500);
    const card = document.getElementById('humanVerifyCard');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight-pulse');
      setTimeout(() => card.classList.remove('highlight-pulse'), 1500);
    }
    return;
  }

  // Track Unlock in Firestore
  const p = new URLSearchParams(window.location.search);
  const curPath = window.location.pathname.toLowerCase();
  const activeSlug = curPath.startsWith('/l/') ? curPath.slice(3).trim() : (p.get('slug') || (curPath === '/access' || curPath === '/hub' || curPath === '/gate' ? 'hub-access' : ''));
  if (activeSlug) {
    trackGateEvent(activeSlug, 'unlock');
  }

  // 1. Open Monetag Bonus Ad
  triggerDirectAd(3);

  // 2. Grant 24-Hour Access in localStorage
  grant24HourAccess();

  // 3. If a script code is attached: REVEAL SCRIPT DIRECTLY ON THIS PAGE!
  if (targetScriptCode) {
    const tasksGroup = document.querySelector('.social-tasks-group');
    const progressBlock = document.querySelector('.social-progress-block');
    const btnUnlock = document.getElementById('btnUnlock');
    const scriptBox = document.getElementById('scriptResultBox');
    const scriptText = document.getElementById('scriptCodeText');

    if (tasksGroup) tasksGroup.style.display = 'none';
    if (progressBlock) progressBlock.style.display = 'none';
    if (btnUnlock) btnUnlock.style.display = 'none';

    if (scriptText) scriptText.textContent = targetScriptCode;
    if (scriptBox) scriptBox.style.display = 'block';

    // Auto copy script
    copyUnlockedScript();
    showToast(t('toastScriptCopied'), 'success', 3500);
    return;
  }

  // Otherwise, redirect to destinationUrl (e.g. MediaFire or main website)
  const path = window.location.pathname.toLowerCase();
  const isHub = path === '/access' || path === '/hub' || path === '/gate' || window.location.search.includes('hub-access') || destinationUrl === '/' || destinationUrl.includes('blacklisthub') || destinationUrl.includes('localhost');
  const txtUnlock = document.getElementById('txtUnlock');
  if (txtUnlock) txtUnlock.textContent = isHub ? t('redirectingHub') : t('redirecting');

  showToast(isHub ? `🚀 ${t('redirectingHub')}` : `🚀 ${t('redirecting')}`, 'success', 2000);

  setTimeout(() => {
    const separator = destinationUrl.includes('?') ? '&' : '?';
    window.location.href = isHub ? `${destinationUrl}${separator}pass_token=gateflow_24h` : destinationUrl;
  }, 600);
};

// 6. One-Click Copy Unlocked Script
window.copyUnlockedScript = function() {
  if (!targetScriptCode) return;
  navigator.clipboard.writeText(targetScriptCode).then(() => {
    const btn = document.getElementById('btnCopyScript');
    const txt = document.getElementById('txtCopyScript');
    if (txt) txt.textContent = t('btnCopied');
    showToast(t('toastClipboard'), 'success', 3000);
    setTimeout(() => {
      if (txt) txt.textContent = t('btnCopyAgain');
    }, 2500);
  }).catch(() => {
    showToast(t('toastCopyFail'), 'info');
  });
};

// 7. Trigger Monetag Direct Link
function triggerDirectAd(preferredIndex = 0) {
  try {
    const pool = getAdPool();
    let index = parseInt(localStorage.getItem('blackpass_direct_index') || String(preferredIndex), 10);
    if (isNaN(index) || index >= pool.length) {
      index = preferredIndex % pool.length;
    }

    const targetAdUrl = pool[index] || AD_DIRECT_POOL[0];
    localStorage.setItem('blackpass_direct_index', String((index + 1) % pool.length));

    const link = document.createElement('a');
    link.href = targetAdUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => link.remove(), 100);

  } catch (e) {
    try {
      const pool = getAdPool();
      window.open(pool[0] || AD_DIRECT_POOL[0], '_blank');
    } catch (err) {
      console.warn('[SocialWolvez] Ad popup blocked:', err);
    }
  }
}

// 8. Grant 24-Hour Access
function grant24HourAccess() {
  try {
    const expiry24h = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('blacklist_lootlabs_auth_expiry', String(expiry24h));
    sessionStorage.setItem('blacklist_lootlabs_auth', 'true');
    localStorage.setItem('blacklist_lootlabs_unlocked_event', String(Date.now()));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
}

// 9. In-App Browser Notice
function checkInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isDiscord = ua.includes('Discord');
  const isLine = ua.includes('Line');
  const isFB = ua.includes('FBAN') || ua.includes('FBAV');

  if (isDiscord || isLine || isFB) {
    showToast(t('inAppNotice'), 'info', 5000);
  }
}

// 10. Toast Utility
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `clean-toast toast-${type}`;

  let iconHtml = '<i data-lucide="info" style="width: 15px; height: 15px; flex-shrink: 0;"></i>';
  if (type === 'success') {
    iconHtml = '<i data-lucide="check-circle-2" style="width: 15px; height: 15px; flex-shrink: 0; color: #10B981;"></i>';
  } else if (type === 'error') {
    iconHtml = '<i data-lucide="alert-triangle" style="width: 15px; height: 15px; flex-shrink: 0; color: #EF4444;"></i>';
  }

  toast.innerHTML = `${iconHtml}<span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// 11. Native OnClick Popunder Ad Trigger (Monetag Direct Smartlinks)
let lastOnClickTime = 0;
document.addEventListener('click', function(e) {
  // If user clicks on tasks or buttons directly, allow their specific handlers to manage them
  if (e.target.closest('.btn-social-yt') || e.target.closest('.btn-social-ad') || e.target.closest('.btn-social-unlock') || e.target.closest('.btn-copy-script') || e.target.closest('a')) {
    return;
  }

  // Frequency limit: fire on background/card click, cooldown 15s
  const now = Date.now();
  if (now - lastOnClickTime > 15000) {
    lastOnClickTime = now;
    triggerDirectAd();
  }
});

