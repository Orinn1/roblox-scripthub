/* ==========================================================================
   SocialWolvez / Sub2Unlock Style Gateway Logic
   - 6 Tasks Unlock: 3 YouTube (Subscribe + Like + Comment) + 3 Ad Links
   - Monetag Direct Links + 100% Monetization Yield
   - CPALead VIP FastPass Compatible
   ========================================================================== */

const TOTAL_TASKS = 6;
let destinationUrl = '';
let targetScriptCode = '';
let cachedLatestVideoUrl = '';
let currentLockerChannel = '';
const tasksDone = [false, false, false, false, false, false];
const isVerifying = [false, false, false, false, false, false];

// Multi-Network Direct Link Pool (Fresh User Zones)
const AD_DIRECT_POOL = [
  'https://uplcm.com/4/12157091',
  'https://uplcm.com/4/12157092',
  'https://uplcm.com/4/12157093',
  'https://uplcm.com/4/12157094'
];

document.addEventListener('DOMContentLoaded', () => {
  initCustomTitleAndDesc();
  initDestinationUrl();

  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.toLowerCase();
  const slug = path.startsWith('/l/') ? path.slice(3).trim() : (params.get('slug') || '');

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
      fetchLatestVideo();

      const txtUnlock = document.getElementById('txtUnlock');
      if (txtUnlock) {
        if (targetScriptCode) {
          txtUnlock.textContent = 'กดรับสคริปต์ (Get Script ➔)';
        } else {
          txtUnlock.textContent = 'Unlock (ดาวน์โหลดไฟล์ ➔)';
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

  let defaultTitle = 'ปลดล็อกลิงก์และไฟล์ฟรี';
  let defaultDesc = 'ทำภารกิจสนับสนุน 6 ขั้นตอนด้านล่างเพื่อรับไฟล์/สคริปต์ฟรี';

  if (script) {
    defaultTitle = 'แจกสคริปต์ฟรี (Script Access)';
    defaultDesc = 'ทำภารกิจ 6 ขั้นตอนด้านล่างเพื่อปลดล็อกและรับโค้ดสคริปต์';
  } else if (isAccessGate) {
    defaultTitle = 'ระบบยืนยันสิทธิ์ Security Access Gate';
    defaultDesc = 'ทำภารกิจ 6 ขั้นตอนด้านล่างเพื่อรับสิทธิ์เข้าใช้งานเว็บฟรี 24 ชั่วโมง';
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

// Helper: Get Target YouTube Channel URL (with auto-subscribe popup)
function getTargetYoutubeUrl() {
  const params = new URLSearchParams(window.location.search);
  const customYt = params.get('yt') || params.get('ch') || currentLockerChannel;
  if (customYt) {
    let url = customYt.trim();
    if (!url.startsWith('http')) {
      url = `https://www.youtube.com/${url.startsWith('@') ? url : '@' + url}`;
    }
    return url.includes('sub_confirmation') ? url : `${url}${url.includes('?') ? '&' : '?'}sub_confirmation=1`;
  }

  const fullSearch = window.location.search.toLowerCase();
  if (fullSearch.includes('ghost') || fullSearch.includes('freefire') || (currentLockerChannel && currentLockerChannel.toLowerCase().includes('ghost'))) {
    return 'https://www.youtube.com/@GhostSensix?sub_confirmation=1';
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

  const customCh = params.get('ch') || params.get('yt') || currentLockerChannel || '';
  const fullSearch = window.location.search.toLowerCase();
  const isGhost = customCh.toLowerCase().includes('ghost') || fullSearch.includes('ghost') || fullSearch.includes('freefire');
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
    cachedLatestVideoUrl = 'https://www.youtube.com/@GhostSensix/videos';
  } else {
    cachedLatestVideoUrl = 'https://www.youtube.com/watch?v=ClBmbJDIWzA';
  }
}

// Helper: Get Target YouTube Video URL (Auto resolved from YouTube channel)
function getTargetVideoUrl() {
  const params = new URLSearchParams(window.location.search);
  const customVideo = params.get('v') || params.get('video');
  if (customVideo) return customVideo;

  if (cachedLatestVideoUrl) {
    return cachedLatestVideoUrl;
  }

  const customCh = params.get('ch') || params.get('yt') || '';
  const fullSearch = window.location.search.toLowerCase();
  const isGhost = customCh.toLowerCase().includes('ghost') || fullSearch.includes('ghost') || fullSearch.includes('freefire');
  return isGhost ? 'https://www.youtube.com/@GhostSensix/videos' : 'https://www.youtube.com/watch?v=ClBmbJDIWzA';
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
  if (taskNum === 1) {
    targetUrl = getTargetYoutubeUrl();
  } else if (taskNum === 2) {
    targetUrl = getTargetVideoUrl();
  } else if (taskNum === 3) {
    targetUrl = getTargetVideoUrl();
  } else if (taskNum === 4) {
    targetUrl = AD_DIRECT_POOL[0];
  } else if (taskNum === 5) {
    targetUrl = AD_DIRECT_POOL[1];
  } else if (taskNum === 6) {
    targetUrl = AD_DIRECT_POOL[2];
  }

  // 2. Open Target URL in a new window/tab
  try {
    const win = window.open(targetUrl, '_blank');
    if (!win) {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 100);
    }
  } catch (e) {}

  // 3. Start Verification Timer (3 seconds)
  isVerifying[idx] = true;
  let secLeft = 3;

  btn.classList.add('verifying');
  txt.textContent = `กำลังตรวจสอบ... (${secLeft}s)`;

  const timer = setInterval(() => {
    secLeft--;
    if (secLeft > 0) {
      txt.textContent = `กำลังตรวจสอบ... (${secLeft}s)`;
    } else {
      clearInterval(timer);
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
        'Sponsor Link #3 Verified ✅'
      ];
      txt.textContent = labels[idx];
      if (checkIcon) checkIcon.style.display = 'block';

      const completedCount = tasksDone.filter(Boolean).length;
      if (completedCount < TOTAL_TASKS) {
        showToast(`✅ สำเร็จ! (${completedCount}/${TOTAL_TASKS}) เหลืออีก ${TOTAL_TASKS - completedCount} ภารกิจ`, 'success', 2200);
      } else {
        showToast('🎉 ครบ 6 ภารกิจแล้ว! ปลดล็อกเรียบร้อย', 'success', 3500);
      }

      updateProgressState();
    }
  }, 1000);

  if (window.lucide) lucide.createIcons();
};

// 4. Update Progress Bar & Unlock State
function updateProgressState() {
  const completedCount = tasksDone.filter(Boolean).length;
  const progressText = document.getElementById('txtProgressVal');
  const progressBar = document.getElementById('barProgressFill');
  const btnUnlock = document.getElementById('btnUnlock');
  const txtUnlock = document.getElementById('txtUnlock');
  const iconUnlock = document.getElementById('iconUnlock');

  if (progressText) progressText.textContent = `${completedCount}/${TOTAL_TASKS}`;
  if (progressBar) progressBar.style.width = `${(completedCount / TOTAL_TASKS) * 100}%`;

  // When all 6 tasks are completed
  if (completedCount === TOTAL_TASKS) {
    if (btnUnlock) {
      btnUnlock.disabled = false;
      btnUnlock.className = 'btn-social-unlock ready';
    }
    if (txtUnlock) {
      if (targetScriptCode) {
        txtUnlock.textContent = 'กดรับสคริปต์ (Get Script ➔)';
      } else {
        const path = window.location.pathname.toLowerCase();
        const isHub = path === '/access' || path === '/hub' || path === '/gate' || window.location.search.includes('hub-access') || destinationUrl === '/' || destinationUrl.includes('blacklisthub') || destinationUrl.includes('localhost');
        txtUnlock.textContent = isHub ? 'เข้าสู่เว็บไซต์ (Enter Website ➔)' : 'Unlock (ดาวน์โหลดไฟล์ ➔)';
      }
    }
    if (iconUnlock) {
      iconUnlock.setAttribute('data-lucide', 'sparkles');
      if (window.lucide) lucide.createIcons();
    }
    showToast('🎉 ปลดล็อกเรียบร้อย! แตะปุ่มด้านล่างได้เลย', 'success', 3500);
  }
}

// 5. Handle Final Unlock Button Click
window.handleUnlockClick = function() {
  const completedCount = tasksDone.filter(Boolean).length;
  if (completedCount < TOTAL_TASKS) return;

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
    showToast('🎉 ปลดล็อกสำเร็จ! คัดลอกสคริปต์ให้เรียบร้อยแล้ว', 'success', 3500);
    return;
  }

  // Otherwise, redirect to destinationUrl (e.g. MediaFire or main website)
  const path = window.location.pathname.toLowerCase();
  const isHub = path === '/access' || path === '/hub' || path === '/gate' || window.location.search.includes('hub-access') || destinationUrl === '/' || destinationUrl.includes('blacklisthub') || destinationUrl.includes('localhost');
  const txtUnlock = document.getElementById('txtUnlock');
  if (txtUnlock) txtUnlock.textContent = isHub ? 'กำลังเข้าสู่เว็บไซต์...' : 'กำลังพาวาร์ปเข้าสู่หน้าดาวน์โหลด...';

  showToast(isHub ? '🚀 ยืนยันสิทธิ์ 24 ชม. สำเร็จ! กำลังเข้าสู่เว็บไซต์...' : '🚀 ยืนยันสิทธิ์สำเร็จ! กำลังไปที่หน้าดาวน์โหลด...', 'success', 2000);

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
    if (txt) txt.textContent = 'คัดลอกเรียบร้อยแล้ว! ✅';
    showToast('📋 คัดลอกสคริปต์แล้ว! นำไปวางใน Executor ได้เลย', 'success', 3000);
    setTimeout(() => {
      if (txt) txt.textContent = 'คัดลอกสคริปต์อีกครั้ง (Copy Again) 📋';
    }, 2500);
  }).catch(() => {
    showToast('กรุณากดค้างที่โค้ดเพื่อคัดลอก', 'info');
  });
};

// 7. Trigger Monetag Direct Link
function triggerDirectAd(preferredIndex = 0) {
  try {
    let index = parseInt(localStorage.getItem('blackpass_direct_index') || String(preferredIndex), 10);
    if (isNaN(index) || index >= AD_DIRECT_POOL.length) {
      index = preferredIndex % AD_DIRECT_POOL.length;
    }

    const targetAdUrl = AD_DIRECT_POOL[index];
    localStorage.setItem('blackpass_direct_index', String((index + 1) % AD_DIRECT_POOL.length));

    const link = document.createElement('a');
    link.href = targetAdUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => link.remove(), 100);

  } catch (e) {
    try {
      window.open(AD_DIRECT_POOL[0], '_blank');
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
    showToast('💡 เปิดในแอป? แนะนำกด ⋯ มุมขวาแล้วเลือก "เปิดในเบราว์เซอร์หลัก"', 'info', 5000);
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

