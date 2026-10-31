/* ==========================================================================
   ShrinkMe-Style Multi-Round Gateway (3 Rounds / Steps)
   Round 1 (Ad 1 -> 7s) -> Round 2 (Ad 2 -> 7s) -> Round 3 (Ad 3 -> GET LINK)
   100% Monetag Direct Links + In-Page Push Banner (Zone 12157090)
   ========================================================================== */

let currentLang = 'th';
let destinationUrl = '';

// Multi-Network Direct Link Pool (Fresh User Zones - Rotates evenly across all 4 zones)
const AD_DIRECT_POOL = [
  'https://uplcm.com/4/12157091',
  'https://uplcm.com/4/12157092',
  'https://uplcm.com/4/12157093',
  'https://uplcm.com/4/12157094'
];

const TOTAL_ROUNDS = 3;
const ROUND_DURATION = 7; // 7 seconds per round (Fast, highly satisfying)

let currentRound = 1;
let roundState = 'READY'; // 'READY' | 'COUNTING' | 'COMPLETED'
let remainingSeconds = ROUND_DURATION;
let countdownTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initLockerLang();
  initDestinationUrl();
  checkInAppBrowser();
  setRound(1);
});

// Detect & Init Language
function initLockerLang() {
  currentLang = localStorage.getItem('blackpass_lang') || 'th';
  updateLangButtons();
}

window.setLockerLang = function(lang) {
  currentLang = lang;
  localStorage.setItem('blackpass_lang', lang);
  updateLangButtons();
  updateStaticTexts();
  renderCurrentRoundUI();
};

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

// Resolve Destination URL
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

// Check In-App Browser (Discord, LINE, Facebook)
function checkInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isDiscord = ua.includes('Discord');
  const isLine = ua.includes('Line');
  const isFB = ua.includes('FBAN') || ua.includes('FBAV');

  const notice = document.getElementById('inAppBrowserNotice');
  if (notice && (isDiscord || isLine || isFB)) {
    notice.style.display = 'flex';
  }
}

// Update Static Texts
function updateStaticTexts() {
  const isTh = currentLang === 'th';

  const titleEl = document.getElementById('lockerTitle');
  const descEl = document.getElementById('lockerDesc');
  const lblProg = document.getElementById('lblProgressTitle');
  const vipSkip = document.getElementById('lblVipSkip');
  const dot1 = document.getElementById('dotLbl1');
  const dot2 = document.getElementById('dotLbl2');
  const dot3 = document.getElementById('dotLbl3');

  if (titleEl) titleEl.textContent = isTh ? 'ระบบยืนยันสิทธิ์ Security Access Gate' : 'Security Access Gate';
  if (descEl) descEl.textContent = isTh
    ? 'ทำตาม 3 ขั้นตอนด้านล่างเพื่อรับสิทธิ์เข้าใช้งานเว็บไซต์ฟรี 24 ชั่วโมง'
    : 'Complete the 3 quick steps below to unlock 24-hour website access for free.';
  if (lblProg) lblProg.textContent = isTh ? 'สถานะขั้นตอน' : 'Step Status';
  if (vipSkip) vipSkip.textContent = isTh ? 'มียศ VIP ใน Discord? ข้ามด่านทันที' : 'VIP Discord Member? Skip immediately';
  if (dot1) dot1.textContent = isTh ? 'เตรียมลิงก์' : 'Preparing';
  if (dot2) dot2.textContent = isTh ? 'ยืนยันสิทธิ์' : 'Verifying';
  if (dot3) dot3.textContent = isTh ? 'รับลิงก์' : 'Get Link';
}

// Set & Transition to a specific Round (1, 2, or 3)
function setRound(roundNum) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  currentRound = roundNum;
  roundState = (currentRound === 3) ? 'COMPLETED' : 'READY';
  remainingSeconds = ROUND_DURATION;

  // Re-trigger card fade-in animation
  const card = document.getElementById('shrinkRoundCard');
  if (card) {
    card.style.animation = 'none';
    card.offsetHeight; // trigger reflow
    card.style.animation = null;
  }

  updateStepperHeader();
  renderCurrentRoundUI();
}

// Update Top Stepper Row & Progress Bar
function updateStepperHeader() {
  const isTh = currentLang === 'th';

  const dot1 = document.getElementById('stepDot1');
  const dot2 = document.getElementById('stepDot2');
  const dot3 = document.getElementById('stepDot3');
  const circle1 = document.getElementById('dotCircle1');
  const circle2 = document.getElementById('dotCircle2');
  const circle3 = document.getElementById('dotCircle3');
  const line1 = document.getElementById('stepLine1');
  const line2 = document.getElementById('stepLine2');
  const progText = document.getElementById('shrinkProgressText');
  const progBar = document.getElementById('shrinkProgressBar');

  // Reset classes
  [dot1, dot2, dot3].forEach(d => { if (d) d.className = 'stepper-dot'; });
  [line1, line2].forEach(l => { if (l) l.className = 'stepper-line'; });

  if (currentRound === 1) {
    if (dot1) dot1.classList.add('active');
    if (circle1) circle1.innerHTML = '1';
    if (circle2) circle2.innerHTML = '2';
    if (circle3) circle3.innerHTML = '3';
    if (progText) progText.textContent = isTh ? 'ขั้นตอนที่ 1 จาก 3 (33%)' : 'Step 1 of 3 (33%)';
    if (progBar) progBar.style.width = '33%';

  } else if (currentRound === 2) {
    if (dot1) dot1.classList.add('completed');
    if (circle1) circle1.innerHTML = '<i data-lucide="check" style="width: 15px; height: 15px;"></i>';
    if (line1) line1.classList.add('completed');
    if (dot2) dot2.classList.add('active');
    if (circle2) circle2.innerHTML = '2';
    if (circle3) circle3.innerHTML = '3';
    if (progText) progText.textContent = isTh ? 'ขั้นตอนที่ 2 จาก 3 (66%)' : 'Step 2 of 3 (66%)';
    if (progBar) progBar.style.width = '66%';

  } else if (currentRound === 3) {
    if (dot1) dot1.classList.add('completed');
    if (circle1) circle1.innerHTML = '<i data-lucide="check" style="width: 15px; height: 15px;"></i>';
    if (line1) line1.classList.add('completed');
    if (dot2) dot2.classList.add('completed');
    if (circle2) circle2.innerHTML = '<i data-lucide="check" style="width: 15px; height: 15px;"></i>';
    if (line2) line2.classList.add('completed');
    if (dot3) dot3.classList.add('completed');
    if (circle3) circle3.innerHTML = '<i data-lucide="sparkles" style="width: 15px; height: 15px;"></i>';
    if (progText) progText.textContent = isTh ? 'ขั้นตอนที่ 3 จาก 3 (เสร็จสิ้น 100%)' : 'Step 3 of 3 (Ready 100%)';
    if (progBar) progBar.style.width = '100%';
  }
}

// Render Main Round Card UI
function renderCurrentRoundUI() {
  const isTh = currentLang === 'th';

  const badgePill = document.getElementById('roundBadgePill');
  const badgeText = document.getElementById('roundBadgeText');
  const mainTitle = document.getElementById('roundMainTitle');
  const subTitle = document.getElementById('roundSubTitle');
  const timerNum = document.getElementById('shrinkTimerNum');
  const timerUnit = document.getElementById('shrinkTimerUnit');
  const statusDot = document.getElementById('shrinkStatusDot');
  const statusTitle = document.getElementById('shrinkStatusTitle');
  const statusSub = document.getElementById('shrinkStatusSub');
  const bar = document.getElementById('shrinkTimerProgressBar');
  const btn = document.getElementById('btnShrinkAction');
  const btnText = document.getElementById('btnShrinkText');
  const btnIcon = document.getElementById('btnShrinkIcon');
  const btnArrow = document.getElementById('btnShrinkArrow');
  const hintText = document.getElementById('actionSubHintText');

  // --- ROUND 1 ---
  if (currentRound === 1) {
    if (badgeText) badgeText.textContent = 'STEP 1 OF 3';
    if (mainTitle) mainTitle.textContent = isTh ? 'ขั้นตอนที่ 1 / 3: กำลังเตรียมลิงก์เข้าใช้งาน' : 'Step 1 of 3: Preparing Website Access Link';
    if (subTitle) subTitle.textContent = isTh
      ? 'แตะปุ่มด้านล่างเพื่อเปิดหน้าสปอนเซอร์และเริ่มนับเวลา 7 วินาที'
      : 'Click the button below to open sponsor ad & start 7s countdown.';

    if (roundState === 'READY') {
      if (timerNum) timerNum.textContent = '7';
      if (timerUnit) timerUnit.textContent = isTh ? 'วินาที' : 'seconds';
      if (statusTitle) statusTitle.textContent = isTh ? 'พร้อมเริ่มขั้นตอนที่ 1' : 'Ready to start Step 1';
      if (statusSub) statusSub.textContent = isTh ? 'กดปุ่มด้านล่างเพื่อเปิดหน้าสปอนเซอร์และเริ่มนับเวลา' : 'Click button below to open ad and start timer';
      if (bar) bar.style.width = '0%';

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn-enter-website ready';
      }
      if (btnText) btnText.textContent = isTh ? 'แตะเพื่อเริ่มขั้นตอนที่ 1 (Start 7s) ⚡' : 'Start Step 1 (7s) ⚡';
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'play');
        btnIcon.classList.remove('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '0.8';
      if (hintText) hintText.textContent = isTh ? 'แตะปุ่มเพื่อเปิดสปอนเซอร์ Monetag และเริ่มนับเวลา' : 'Click button to open sponsor ad & begin countdown';

    } else if (roundState === 'COUNTING') {
      if (timerNum) timerNum.textContent = remainingSeconds;
      if (timerUnit) timerUnit.textContent = isTh ? 'วินาที' : 'seconds';
      if (statusTitle) statusTitle.textContent = isTh ? `กำลังเตรียมลิงก์... (${remainingSeconds}s)` : `Preparing link... (${remainingSeconds}s)`;
      if (statusSub) statusSub.textContent = isTh ? 'ระบบกำลังเชื่อมต่อและยืนยันข้อมูลอุปกรณ์' : 'Connecting and verifying device data';
      if (bar) {
        const pct = Math.round(((ROUND_DURATION - remainingSeconds) / ROUND_DURATION) * 100);
        bar.style.width = `${pct}%`;
      }

      if (btn) {
        btn.disabled = true;
        btn.className = 'btn-enter-website disabled';
      }
      if (btnText) btnText.textContent = isTh ? `กรุณารอสักครู่... (${remainingSeconds}s)` : `Please wait... (${remainingSeconds}s)`;
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'loader-2');
        btnIcon.classList.add('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '0.3';
      if (hintText) hintText.textContent = isTh ? `รอเวลาให้ครบ ${remainingSeconds} วินาทีเพื่อไปยังขั้นตอนถัดไป` : `Wait ${remainingSeconds}s to unlock next step`;

    } else if (roundState === 'COMPLETED') {
      if (timerNum) timerNum.innerHTML = '<i data-lucide="check" style="width: 28px; height: 28px; color: #10B981;"></i>';
      if (timerUnit) timerUnit.textContent = isTh ? 'เสร็จสิ้น' : 'Done';
      if (statusTitle) statusTitle.textContent = isTh ? '🎉 ขั้นตอนที่ 1 เสร็จเรียบร้อยแล้ว!' : '🎉 Step 1 Completed!';
      if (statusSub) statusSub.textContent = isTh ? 'คลิกปุ่มด้านล่างเพื่อไปยังขั้นตอนที่ 2' : 'Click button below to advance to Step 2';
      if (bar) bar.style.width = '100%';

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn-enter-website ready';
      }
      if (btnText) btnText.textContent = isTh ? 'ไปยังขั้นตอนที่ 2 จาก 3 (Next Step) ➔' : 'Go to Step 2 of 3 (Next Step) ➔';
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'arrow-right-circle');
        btnIcon.classList.remove('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '1';
      if (hintText) hintText.textContent = isTh ? '✅ ขั้นตอนที่ 1 ผ่านแล้ว! แตะปุ่มด้านบนเพื่อไปด่าน 2' : '✅ Step 1 passed! Click button to proceed';
    }

  // --- ROUND 2 ---
  } else if (currentRound === 2) {
    if (badgeText) badgeText.textContent = 'STEP 2 OF 3';
    if (mainTitle) mainTitle.textContent = isTh ? 'ขั้นตอนที่ 2 / 3: ยืนยันสิทธิ์สปอนเซอร์' : 'Step 2 of 3: Sponsor Key Verification';
    if (subTitle) subTitle.textContent = isTh
      ? 'แตะปุ่มด้านล่างเพื่อเปิดหน้าสปอนเซอร์และสร้างรหัสผ่าน 24 ชั่วโมง'
      : 'Click button below to open sponsor ad & generate 24h pass key.';

    if (roundState === 'READY') {
      if (timerNum) timerNum.textContent = '7';
      if (timerUnit) timerUnit.textContent = isTh ? 'วินาที' : 'seconds';
      if (statusTitle) statusTitle.textContent = isTh ? 'พร้อมเริ่มขั้นตอนที่ 2' : 'Ready to start Step 2';
      if (statusSub) statusSub.textContent = isTh ? 'กดปุ่มด้านล่างเพื่อเปิดหน้าสปอนเซอร์และเริ่มนับเวลา' : 'Click button below to open ad and start timer';
      if (bar) bar.style.width = '0%';

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn-enter-website ready';
      }
      if (btnText) btnText.textContent = isTh ? 'แตะเพื่อเริ่มขั้นตอนที่ 2 (Start 7s) ⚡' : 'Start Step 2 (7s) ⚡';
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'play');
        btnIcon.classList.remove('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '0.8';
      if (hintText) hintText.textContent = isTh ? 'แตะปุ่มเพื่อเปิดสปอนเซอร์ Monetag และเริ่มนับเวลา' : 'Click button to open sponsor ad & begin countdown';

    } else if (roundState === 'COUNTING') {
      if (timerNum) timerNum.textContent = remainingSeconds;
      if (timerUnit) timerUnit.textContent = isTh ? 'วินาที' : 'seconds';
      if (statusTitle) statusTitle.textContent = isTh ? `กำลังสร้างรหัสผ่าน 24 ชม.... (${remainingSeconds}s)` : `Generating 24h pass... (${remainingSeconds}s)`;
      if (statusSub) statusSub.textContent = isTh ? 'ระบบกำลังเข้ารหัส Session Token ปลอดภัย 100%' : 'Encrypting secure 24-hour session token';
      if (bar) {
        const pct = Math.round(((ROUND_DURATION - remainingSeconds) / ROUND_DURATION) * 100);
        bar.style.width = `${pct}%`;
      }

      if (btn) {
        btn.disabled = true;
        btn.className = 'btn-enter-website disabled';
      }
      if (btnText) btnText.textContent = isTh ? `กำลังสร้างรหัสผ่าน... (${remainingSeconds}s)` : `Generating pass... (${remainingSeconds}s)`;
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'loader-2');
        btnIcon.classList.add('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '0.3';
      if (hintText) hintText.textContent = isTh ? `รอเวลาให้ครบ ${remainingSeconds} วินาทีเพื่อไปยังขั้นตอนสุดท้าย` : `Wait ${remainingSeconds}s to unlock final step`;

    } else if (roundState === 'COMPLETED') {
      if (timerNum) timerNum.innerHTML = '<i data-lucide="check" style="width: 28px; height: 28px; color: #10B981;"></i>';
      if (timerUnit) timerUnit.textContent = isTh ? 'เสร็จสิ้น' : 'Done';
      if (statusTitle) statusTitle.textContent = isTh ? '🎉 ยืนยันสิทธิ์สำเร็จ พร้อมรับลิงก์แล้ว!' : '🎉 Verification complete! Ready for link.';
      if (statusSub) statusSub.textContent = isTh ? 'คลิกปุ่มด้านล่างเพื่อไปยังหน้ารับลิงก์' : 'Click button below to go to Get Link page';
      if (bar) bar.style.width = '100%';

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn-enter-website ready';
      }
      if (btnText) btnText.textContent = isTh ? 'ไปยังหน้ารับลิงก์ (Final Step) ➔' : 'Go to Get Link (Final Step) ➔';
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'arrow-right-circle');
        btnIcon.classList.remove('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '1';
      if (hintText) hintText.textContent = isTh ? '✅ สิทธิ์พร้อมแล้ว! แตะปุ่มด้านบนเพื่อไปรับลิงก์' : '✅ Pass ready! Click button to get link';
    }

  // --- ROUND 3 (FINAL GET LINK) ---
  } else if (currentRound === 3) {
    if (badgeText) badgeText.textContent = 'FINAL STEP: GET LINK';
    if (mainTitle) mainTitle.textContent = isTh ? 'ขั้นตอนสุดท้าย: ลิงก์ของคุณพร้อมแล้ว! 🎉' : 'Final Step: Your Link is Ready! 🎉';
    if (subTitle) subTitle.textContent = isTh
      ? 'ระบบจัดเตรียมสิทธิ์เข้าใช้งานเว็บไซต์ 24 ชั่วโมงให้คุณเรียบร้อยแล้ว แตะปุ่มด้านล่างเพื่อเข้าสู่เว็บไซต์ได้ทันที'
      : 'Your 24-hour free access pass is fully generated. Click the button below to enter website!';

    if (timerNum) timerNum.innerHTML = '<i data-lucide="sparkles" style="width: 32px; height: 32px; color: #10B981;"></i>';
    if (timerUnit) timerUnit.textContent = isTh ? 'พร้อมเข้าเว็บ' : 'Ready';
    if (statusTitle) statusTitle.textContent = isTh ? '🎉 ปลดล็อคสิทธิ์ 24 ชม. เรียบร้อยแล้ว!' : '🎉 24h Pass Unlocked Successfully!';
    if (statusSub) statusSub.textContent = isTh ? 'คลิกปุ่มรับลิงก์ด้านล่างเพื่อเข้าสู่เว็บไซต์ทันที' : 'Click Get Link button below to enter website';
    if (bar) bar.style.width = '100%';

    if (btn) {
      btn.disabled = false;
      btn.className = 'btn-enter-website ready-enter';
    }
    if (btnText) btnText.textContent = isTh ? 'รับลิงก์เข้าสู่เว็บไซต์ (GET LINK 🚀)' : 'GET LINK — Enter Website 🚀';
    if (btnIcon) {
      btnIcon.setAttribute('data-lucide', 'unlock');
      btnIcon.classList.remove('spin');
    }
    if (btnArrow) btnArrow.style.opacity = '1';
    if (hintText) hintText.textContent = isTh ? '✅ คลิกปุ่มด้านบนเพื่อรับลิงก์และเข้าสู่เว็บไซต์ทันที' : '✅ Click button above to claim link & enter website';
  }

  lucide.createIcons();
}

// Handle Interactive Button Click in Each Round
window.handleShrinkButtonClick = function() {
  const isTh = currentLang === 'th';

  // --- ROUND 1 CLICK HANDLING ---
  if (currentRound === 1) {
    if (roundState === 'READY') {
      // 1. User clicked Start Step 1: Open Monetag Ad #1! 💰
      triggerDirectAd(0);

      // 2. Start 7-second countdown
      roundState = 'COUNTING';
      remainingSeconds = ROUND_DURATION;
      renderCurrentRoundUI();

      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        remainingSeconds--;
        renderCurrentRoundUI();

        if (remainingSeconds <= 0) {
          clearInterval(countdownTimer);
          countdownTimer = null;
          roundState = 'COMPLETED';
          renderCurrentRoundUI();
          showToast(isTh ? '🎉 ขั้นตอนที่ 1 เสร็จแล้ว! แตะปุ่มเพื่อไปขั้นตอนที่ 2' : '🎉 Step 1 complete! Click to advance to Step 2', 'success', 3000);
        }
      }, 1000);

    } else if (roundState === 'COMPLETED') {
      // Advance to Round 2!
      setRound(2);
      showToast(isTh ? '➡️ เข้าสู่ขั้นตอนที่ 2 จาก 3' : '➡️ Welcome to Step 2 of 3', 'info', 2000);
    }

  // --- ROUND 2 CLICK HANDLING ---
  } else if (currentRound === 2) {
    if (roundState === 'READY') {
      // 1. User clicked Start Step 2: Open Monetag Ad #2! 💰
      triggerDirectAd(1);

      // 2. Start 7-second countdown
      roundState = 'COUNTING';
      remainingSeconds = ROUND_DURATION;
      renderCurrentRoundUI();

      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        remainingSeconds--;
        renderCurrentRoundUI();

        if (remainingSeconds <= 0) {
          clearInterval(countdownTimer);
          countdownTimer = null;
          roundState = 'COMPLETED';
          renderCurrentRoundUI();
          showToast(isTh ? '✨ ขั้นตอนที่ 2 เสร็จแล้ว! แตะปุ่มเพื่อไปรับลิงก์' : '✨ Step 2 complete! Click to go to Get Link', 'success', 3000);
        }
      }, 1000);

    } else if (roundState === 'COMPLETED') {
      // Advance to Round 3 (Final Get Link)!
      setRound(3);
      showToast(isTh ? '🎉 ขั้นตอนสุดท้าย: ลิงก์พร้อมแล้ว!' : '🎉 Final Step: Your link is ready!', 'success', 2500);
    }

  // --- ROUND 3 CLICK HANDLING (FINAL GET LINK) ---
  } else if (currentRound === 3) {
    // 1. User clicked GET LINK: Open Monetag Ad #3! 💰
    triggerDirectAd(2);

    // 2. Grant 24-Hour Access in localStorage
    grant24HourAccess();

    const btnText = document.getElementById('btnShrinkText');
    if (btnText) btnText.textContent = isTh ? 'กำลังพาวาร์ปเข้าสู่เว็บไซต์...' : 'Redirecting to website...';

    showToast(isTh ? '🎉 รับสิทธิ์เข้าเว็บ 24 ชม. สำเร็จ! กำลังเข้าสู่เว็บไซต์...' : '🎉 Unlocked 24h pass! Entering website...', 'success', 2000);

    setTimeout(() => {
      window.location.href = destinationUrl;
    }, 600);
  }
};

// Trigger Monetag Direct Link (Bulletproof Popup Bypass for Mobile & PC)
function triggerDirectAd(preferredIndex = 0) {
  try {
    let index = parseInt(localStorage.getItem('blackpass_direct_index') || String(preferredIndex), 10);
    if (isNaN(index) || index >= AD_DIRECT_POOL.length) {
      index = preferredIndex % AD_DIRECT_POOL.length;
    }

    const targetAdUrl = AD_DIRECT_POOL[index];
    
    // Rotate to next zone for next time
    localStorage.setItem('blackpass_direct_index', String((index + 1) % AD_DIRECT_POOL.length));

    // 1. Try simulated anchor click (highest success rate on Mobile Chrome & Safari)
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
      console.warn('[BlackPass] Ad popup blocked:', err);
    }
  }
}

// Grant 24-Hour Access
function grant24HourAccess() {
  try {
    const expiry24h = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('blacklist_lootlabs_auth_expiry', String(expiry24h));
    sessionStorage.setItem('blacklist_lootlabs_auth', 'true');
    localStorage.setItem('blacklist_lootlabs_unlocked_event', String(Date.now()));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
}

// VIP Modal Handlers
window.openVipModal = function() {
  const modal = document.getElementById('vipModal');
  if (modal) modal.classList.add('active');
};

window.closeVipModal = function() {
  const modal = document.getElementById('vipModal');
  if (modal) modal.classList.remove('active');
};

window.submitVipKey = function() {
  const input = document.getElementById('inputVipKey');
  const key = (input ? input.value : '').trim().toUpperCase();
  const isTh = currentLang === 'th';

  if (!key) {
    showToast(isTh ? 'กรุณากรอกรหัส VIP Key' : 'Please enter VIP Key', 'error');
    return;
  }

  // Check valid keys: VIP30 or VIP-PASS-2026 or any custom prefix
  if (key === 'VIP30' || key === 'VIP-PASS-2026' || key.startsWith('VIP-')) {
    grant24HourAccess();
    closeVipModal();
    showToast(isTh ? '👑 VIP Bypass สำเร็จ! กำลังเข้าสู่เว็บไซต์...' : '👑 VIP Bypass granted! Entering...', 'success', 2000);
    setTimeout(() => {
      window.location.href = destinationUrl;
    }, 600);
  } else {
    showToast(isTh ? '❌ รหัส VIP Key ไม่ถูกต้อง หรือหมดอายุแล้ว' : '❌ Invalid or expired VIP Key', 'error');
  }
};

// Toast Utility
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
