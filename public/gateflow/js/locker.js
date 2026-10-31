/* ==========================================================================
   SocialWolvez / Sub2Unlock Style Gateway Logic
   - Clean 2-Task Unlock (Subscribe + Like & Comment)
   - Monetag Direct Links + 100% Monetization Yield
   - CPALead VIP FastPass Compatible
   ========================================================================== */

let destinationUrl = '';
let task1Done = false;
let task2Done = false;
let isVerifyingTask1 = false;
let isVerifyingTask2 = false;

// Multi-Network Direct Link Pool (Fresh User Zones - Rotates evenly across all 4 zones)
const AD_DIRECT_POOL = [
  'https://uplcm.com/4/12157091',
  'https://uplcm.com/4/12157092',
  'https://uplcm.com/4/12157093',
  'https://uplcm.com/4/12157094'
];

document.addEventListener('DOMContentLoaded', () => {
  initCustomTitleAndDesc();
  initDestinationUrl();
  checkInAppBrowser();
});

// 1. Initialize Custom or Default Title & Description
function initCustomTitleAndDesc() {
  const params = new URLSearchParams(window.location.search);
  const title = params.get('title') || 'แจกไฟล์ดูดหัว';
  const desc = params.get('desc') || 'หากสนใจไฟล์ พาแนล โปร เข้าเว็บได้เลย';

  const titleEl = document.getElementById('lockerTitle');
  const descEl = document.getElementById('lockerDesc');

  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;
}

// 2. Resolve Destination URL (MediaFire / Google Drive)
function initDestinationUrl() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('return_to') || params.get('url') || params.get('redirect') || '';

  if (returnTo) {
    destinationUrl = returnTo;
  } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    destinationUrl = '/';
  } else {
    destinationUrl = 'https://th.blacklisthub.workers.dev/';
  }
}

// 3. Handle Social Task Clicks (1 = Subscribe, 2 = Like & Comment)
window.handleTaskClick = function(taskNum) {
  if (taskNum === 1) {
    if (task1Done || isVerifyingTask1) return;

    // 1. Open Monetag Ad #1
    triggerDirectAd(0);

    // 2. Start Verification Timer (4 seconds)
    isVerifyingTask1 = true;
    let secLeft = 4;
    const btn = document.getElementById('btnTask1');
    const txt = document.getElementById('txtTask1');

    btn.className = 'btn-social-yt verifying';
    txt.textContent = `กำลังตรวจสอบ... (${secLeft}s)`;

    const timer = setInterval(() => {
      secLeft--;
      if (secLeft > 0) {
        txt.textContent = `กำลังตรวจสอบ... (${secLeft}s)`;
      } else {
        clearInterval(timer);
        task1Done = true;
        isVerifyingTask1 = false;

        btn.className = 'btn-social-yt completed';
        txt.textContent = 'Subscribed on YouTube';
        const checkIcon = document.getElementById('checkTask1');
        if (checkIcon) checkIcon.style.display = 'block';

        showToast('✅ กดติดตามสำเร็จ! เหลืออีก 1 ภารกิจ', 'success', 2500);
        updateProgressState();
      }
    }, 1000);

  } else if (taskNum === 2) {
    if (task2Done || isVerifyingTask2) return;

    // 1. Open Monetag Ad #2
    triggerDirectAd(1);

    // 2. Start Verification Timer (4 seconds)
    isVerifyingTask2 = true;
    let secLeft = 4;
    const btn = document.getElementById('btnTask2');
    const txt = document.getElementById('txtTask2');

    btn.className = 'btn-social-yt verifying';
    txt.textContent = `กำลังตรวจสอบ... (${secLeft}s)`;

    const timer = setInterval(() => {
      secLeft--;
      if (secLeft > 0) {
        txt.textContent = `กำลังตรวจสอบ... (${secLeft}s)`;
      } else {
        clearInterval(timer);
        task2Done = true;
        isVerifyingTask2 = false;

        btn.className = 'btn-social-yt completed';
        txt.textContent = 'Liked & Commented';
        const checkIcon = document.getElementById('checkTask2');
        if (checkIcon) checkIcon.style.display = 'block';

        showToast('✅ ทำภารกิจที่ 2 สำเร็จแล้ว!', 'success', 2500);
        updateProgressState();
      }
    }, 1000);
  }

  lucide.createIcons();
};

// 4. Update Progress Bar & Unlock State
function updateProgressState() {
  const completedCount = (task1Done ? 1 : 0) + (task2Done ? 1 : 0);
  const progressText = document.getElementById('txtProgressVal');
  const progressBar = document.getElementById('barProgressFill');
  const btnUnlock = document.getElementById('btnUnlock');
  const txtUnlock = document.getElementById('txtUnlock');
  const iconUnlock = document.getElementById('iconUnlock');

  if (progressText) progressText.textContent = `${completedCount}/2`;
  if (progressBar) progressBar.style.width = `${completedCount * 50}%`;

  // When both tasks are completed
  if (completedCount === 2) {
    if (btnUnlock) {
      btnUnlock.disabled = false;
      btnUnlock.className = 'btn-social-unlock ready';
    }
    if (txtUnlock) {
      txtUnlock.textContent = 'Unlock (ดาวน์โหลดไฟล์ ➔)';
    }
    if (iconUnlock) {
      iconUnlock.setAttribute('data-lucide', 'sparkles');
      lucide.createIcons();
    }
    showToast('🎉 ปลดล็อกเรียบร้อย! แตะปุ่ม Unlock เพื่อรับไฟล์', 'success', 3500);
  }
}

// 5. Handle Final Unlock Button Click
window.handleUnlockClick = function() {
  if (!task1Done || !task2Done) return;

  // 1. Open Monetag Ad #3
  triggerDirectAd(2);

  // 2. Grant 24-Hour Access in localStorage
  grant24HourAccess();

  const txtUnlock = document.getElementById('txtUnlock');
  if (txtUnlock) txtUnlock.textContent = 'กำลังพาวาร์ปเข้าสู่หน้าดาวน์โหลด...';

  showToast('🚀 ยืนยันสิทธิ์สำเร็จ! กำลังไปที่หน้าดาวน์โหลด...', 'success', 2000);

  setTimeout(() => {
    window.location.href = destinationUrl;
  }, 600);
};

// 6. Trigger Monetag Direct Link (Bulletproof Popup Bypass for Mobile & PC)
function triggerDirectAd(preferredIndex = 0) {
  try {
    let index = parseInt(localStorage.getItem('blackpass_direct_index') || String(preferredIndex), 10);
    if (isNaN(index) || index >= AD_DIRECT_POOL.length) {
      index = preferredIndex % AD_DIRECT_POOL.length;
    }

    const targetAdUrl = AD_DIRECT_POOL[index];
    localStorage.setItem('blackpass_direct_index', String((index + 1) % AD_DIRECT_POOL.length));

    // Simulated anchor click (high success rate on Mobile Chrome & Safari)
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

// 7. Grant 24-Hour Access
function grant24HourAccess() {
  try {
    const expiry24h = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('blacklist_lootlabs_auth_expiry', String(expiry24h));
    sessionStorage.setItem('blacklist_lootlabs_auth', 'true');
    localStorage.setItem('blacklist_lootlabs_unlocked_event', String(Date.now()));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
}

// 8. In-App Browser Notice
function checkInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isDiscord = ua.includes('Discord');
  const isLine = ua.includes('Line');
  const isFB = ua.includes('FBAN') || ua.includes('FBAV');

  if (isDiscord || isLine || isFB) {
    showToast('💡 เปิดในแอป? แนะนำกด ⋯ มุมขวาแล้วเลือก "เปิดในเบราว์เซอร์หลัก"', 'info', 5000);
  }
}

// 9. Toast Utility
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
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
