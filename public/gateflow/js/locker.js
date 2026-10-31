/* ==========================================================================
   ShrinkMe-Style Multi-Round Gateway (3 Rounds / Steps)
   Round 1 (Ad 1 -> 10s Away-Dwell) -> Round 2 (Ad 2 -> 10s Away-Dwell) -> Round 3 (Ad 3 -> GET LINK)
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
const ROUND_DURATION = 10; // 10 seconds per round with Away-Dwell verification

let currentRound = 1;
let roundState = 'READY'; // 'READY' | 'COUNTING' | 'PAUSED' | 'COMPLETED'
let remainingSeconds = ROUND_DURATION;
let countdownTimer = null;
let targetEndTime = 0;
let gracePeriodActive = false;

document.addEventListener('DOMContentLoaded', () => {
  initLockerLang();
  initDestinationUrl();
  checkInAppBrowser();
  initAwayDwellListeners();
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

  // FastPass VIP Compact Bar Translation
  const vipPass = document.getElementById('lblVipBarPass');
  const vipSub = document.getElementById('lblVipBarSub');
  const vipBtn = document.getElementById('lblVipBarBtn');

  if (vipPass) vipPass.textContent = isTh ? 'ไร้โฆษณา 3 วัน' : '3-Day Ad-Free';
  if (vipSub) vipSub.textContent = isTh ? 'ติดตั้ง 1 แอพฟรี • ข้ามด่านทันทีไม่ต้องรอ' : 'Install 1 free app • Skip all rounds instantly';
  if (vipBtn) vipBtn.textContent = isTh ? 'กดรับ' : 'Claim';
}

// Set & Transition to a specific Round (1, 2, or 3)
function setRound(roundNum) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  gracePeriodActive = false;

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

  // Reset indicator colors
  if (statusDot && roundState !== 'PAUSED' && roundState !== 'COMPLETED') {
    statusDot.style.background = '';
    statusDot.style.boxShadow = '';
  }
  if (bar && roundState !== 'PAUSED' && roundState !== 'COMPLETED') {
    bar.style.background = '';
  }

  // --- ROUND 1 ---
  if (currentRound === 1) {
    if (badgeText) badgeText.textContent = 'STEP 1 OF 3';
    if (mainTitle) mainTitle.textContent = isTh ? 'ขั้นตอนที่ 1 / 3: กำลังเตรียมลิงก์เข้าใช้งาน' : 'Step 1 of 3: Preparing Website Access Link';
    if (subTitle) subTitle.textContent = isTh
      ? 'แตะปุ่มด้านล่างเพื่อเปิดหน้าสปอนเซอร์และรับชม 10 วินาที'
      : 'Click button below to open sponsor ad & stay for 10s.';

    if (roundState === 'READY') {
      if (timerNum) timerNum.textContent = '10';
      if (timerUnit) timerUnit.textContent = isTh ? 'วินาที' : 'seconds';
      if (statusTitle) statusTitle.innerHTML = isTh ? 'พร้อมเริ่มขั้นตอนที่ 1' : 'Ready to start Step 1';
      if (statusSub) statusSub.textContent = isTh ? 'กดปุ่มด้านล่างเพื่อเปิดหน้าสปอนเซอร์และเริ่มนับเวลา' : 'Click button below to open ad and start timer';
      if (bar) bar.style.width = '0%';

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn-enter-website ready';
      }
      if (btnText) btnText.textContent = isTh ? 'แตะเพื่อเริ่มขั้นตอนที่ 1 (Start 10s) ⚡' : 'Start Step 1 (10s) ⚡';
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'play');
        btnIcon.classList.remove('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '0.8';
      if (hintText) hintText.textContent = isTh ? 'แตะปุ่มเพื่อเปิดสปอนเซอร์ Monetag และเริ่มนับเวลา' : 'Click button to open sponsor ad & begin countdown';

    } else if (roundState === 'COUNTING') {
      if (timerNum) timerNum.textContent = remainingSeconds;
      if (timerUnit) timerUnit.textContent = isTh ? 'วินาที' : 'seconds';
      if (statusTitle) statusTitle.innerHTML = isTh ? `กำลังเตรียมลิงก์... (${remainingSeconds}s)` : `Preparing link... (${remainingSeconds}s)`;
      if (statusSub) statusSub.textContent = isTh ? 'กรุณาเปิดหน้าสปอนเซอร์ค้างไว้ ระบบกำลังเชื่อมต่อข้อมูล' : 'Please keep sponsor page open, verifying dwell time...';
      if (bar) {
        const pct = Math.round(((ROUND_DURATION - remainingSeconds) / ROUND_DURATION) * 100);
        bar.style.width = `${pct}%`;
      }

      if (btn) {
        btn.disabled = true;
        btn.className = 'btn-enter-website disabled';
      }
      if (btnText) btnText.textContent = isTh ? `กรุณาเปิดหน้าสปอนเซอร์ค้างไว้... (${remainingSeconds}s)` : `Keep sponsor page open... (${remainingSeconds}s)`;
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'loader-2');
        btnIcon.classList.add('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '0.3';
      if (hintText) hintText.textContent = isTh ? `รอเวลาให้ครบ ${remainingSeconds} วินาทีเพื่อไปยังขั้นตอนถัดไป` : `Wait ${remainingSeconds}s to unlock next step`;

    } else if (roundState === 'PAUSED') {
      if (timerNum) timerNum.innerHTML = `<span style="color: #F59E0B; display: inline-flex; align-items: center; gap: 4px;">⏸️ ${remainingSeconds}</span>`;
      if (timerUnit) timerUnit.textContent = isTh ? 'หยุดชั่วคราว' : 'PAUSED';
      if (statusDot) {
        statusDot.style.background = '#F59E0B';
        statusDot.style.boxShadow = '0 0 10px #F59E0B';
      }
      if (statusTitle) statusTitle.innerHTML = `<span style="color: #F59E0B;">⏸️ ${isTh ? 'หยุดนับเวลาชั่วคราว!' : 'Timer Paused!'} (${remainingSeconds}s)</span>`;
      if (statusSub) statusSub.textContent = isTh
        ? 'ระบบตรวจพบว่าคุณไม่ได้เปิดหน้าสปอนเซอร์ กรุณาสลับกลับไปดูโฆษณาให้ครบเวลา'
        : 'Please stay on the sponsor page to resume countdown';
      if (bar) {
        const pct = Math.round(((ROUND_DURATION - remainingSeconds) / ROUND_DURATION) * 100);
        bar.style.width = `${pct}%`;
        bar.style.background = 'linear-gradient(90deg, #F59E0B, #EA580C)';
      }

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn-enter-website paused';
      }
      if (btnText) btnText.textContent = isTh ? `⚡ แตะกลับไปดูโฆษณาต่อ (เหลือ ${remainingSeconds}s)` : `⚡ Resume Sponsor Ad (${remainingSeconds}s left)`;
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'external-link');
        btnIcon.classList.remove('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '1';
      if (hintText) hintText.textContent = isTh ? 'แตะปุ่มเพื่อเปิดหน้าสปอนเซอร์ใหม่อีกครั้ง' : 'Click button to open sponsor ad again';

    } else if (roundState === 'COMPLETED') {
      if (timerNum) timerNum.innerHTML = '<i data-lucide="check" style="width: 28px; height: 28px; color: #10B981;"></i>';
      if (timerUnit) timerUnit.textContent = isTh ? 'เสร็จสิ้น' : 'Done';
      if (statusDot) {
        statusDot.style.background = '#10B981';
        statusDot.style.boxShadow = '0 0 10px #10B981';
      }
      if (statusTitle) statusTitle.innerHTML = isTh ? '🎉 ขั้นตอนที่ 1 เสร็จเรียบร้อยแล้ว!' : '🎉 Step 1 Completed!';
      if (statusSub) statusSub.textContent = isTh ? 'คลิกปุ่มด้านล่างเพื่อไปยังขั้นตอนที่ 2' : 'Click button below to advance to Step 2';
      if (bar) {
        bar.style.width = '100%';
        bar.style.background = 'linear-gradient(90deg, #10B981, #059669)';
      }

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
      ? 'แตะปุ่มด้านล่างเพื่อเปิดหน้าสปอนเซอร์และสร้างรหัสผ่าน 24 ชั่วโมง (10 วิ)'
      : 'Click button below to open sponsor ad & generate 24h pass (10s)';

    if (roundState === 'READY') {
      if (timerNum) timerNum.textContent = '10';
      if (timerUnit) timerUnit.textContent = isTh ? 'วินาที' : 'seconds';
      if (statusTitle) statusTitle.innerHTML = isTh ? 'พร้อมเริ่มขั้นตอนที่ 2' : 'Ready to start Step 2';
      if (statusSub) statusSub.textContent = isTh ? 'กดปุ่มด้านล่างเพื่อเปิดหน้าสปอนเซอร์และเริ่มนับเวลา' : 'Click button below to open ad and start timer';
      if (bar) bar.style.width = '0%';

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn-enter-website ready';
      }
      if (btnText) btnText.textContent = isTh ? 'แตะเพื่อเริ่มขั้นตอนที่ 2 (Start 10s) ⚡' : 'Start Step 2 (10s) ⚡';
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'play');
        btnIcon.classList.remove('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '0.8';
      if (hintText) hintText.textContent = isTh ? 'แตะปุ่มเพื่อเปิดสปอนเซอร์ Monetag และเริ่มนับเวลา' : 'Click button to open sponsor ad & begin countdown';

    } else if (roundState === 'COUNTING') {
      if (timerNum) timerNum.textContent = remainingSeconds;
      if (timerUnit) timerUnit.textContent = isTh ? 'วินาที' : 'seconds';
      if (statusTitle) statusTitle.innerHTML = isTh ? `กำลังสร้างรหัสผ่าน 24 ชม.... (${remainingSeconds}s)` : `Generating 24h pass... (${remainingSeconds}s)`;
      if (statusSub) statusSub.textContent = isTh ? 'กรุณาเปิดหน้าสปอนเซอร์ค้างไว้ ระบบกำลังเข้ารหัส Session Token' : 'Keep sponsor page open, encrypting secure session token...';
      if (bar) {
        const pct = Math.round(((ROUND_DURATION - remainingSeconds) / ROUND_DURATION) * 100);
        bar.style.width = `${pct}%`;
      }

      if (btn) {
        btn.disabled = true;
        btn.className = 'btn-enter-website disabled';
      }
      if (btnText) btnText.textContent = isTh ? `กรุณาเปิดหน้าสปอนเซอร์ค้างไว้... (${remainingSeconds}s)` : `Keep sponsor page open... (${remainingSeconds}s)`;
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'loader-2');
        btnIcon.classList.add('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '0.3';
      if (hintText) hintText.textContent = isTh ? `รอเวลาให้ครบ ${remainingSeconds} วินาทีเพื่อไปยังขั้นตอนสุดท้าย` : `Wait ${remainingSeconds}s to unlock final step`;

    } else if (roundState === 'PAUSED') {
      if (timerNum) timerNum.innerHTML = `<span style="color: #F59E0B; display: inline-flex; align-items: center; gap: 4px;">⏸️ ${remainingSeconds}</span>`;
      if (timerUnit) timerUnit.textContent = isTh ? 'หยุดชั่วคราว' : 'PAUSED';
      if (statusDot) {
        statusDot.style.background = '#F59E0B';
        statusDot.style.boxShadow = '0 0 10px #F59E0B';
      }
      if (statusTitle) statusTitle.innerHTML = `<span style="color: #F59E0B;">⏸️ ${isTh ? 'หยุดนับเวลาชั่วคราว!' : 'Timer Paused!'} (${remainingSeconds}s)</span>`;
      if (statusSub) statusSub.textContent = isTh
        ? 'ระบบตรวจพบว่าคุณไม่ได้เปิดหน้าสปอนเซอร์ กรุณาสลับกลับไปดูโฆษณาให้ครบเวลา'
        : 'Please stay on the sponsor page to resume countdown';
      if (bar) {
        const pct = Math.round(((ROUND_DURATION - remainingSeconds) / ROUND_DURATION) * 100);
        bar.style.width = `${pct}%`;
        bar.style.background = 'linear-gradient(90deg, #F59E0B, #EA580C)';
      }

      if (btn) {
        btn.disabled = false;
        btn.className = 'btn-enter-website paused';
      }
      if (btnText) btnText.textContent = isTh ? `⚡ แตะกลับไปดูโฆษณาต่อ (เหลือ ${remainingSeconds}s)` : `⚡ Resume Sponsor Ad (${remainingSeconds}s left)`;
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'external-link');
        btnIcon.classList.remove('spin');
      }
      if (btnArrow) btnArrow.style.opacity = '1';
      if (hintText) hintText.textContent = isTh ? 'แตะปุ่มเพื่อเปิดหน้าสปอนเซอร์ใหม่อีกครั้ง' : 'Click button to open sponsor ad again';

    } else if (roundState === 'COMPLETED') {
      if (timerNum) timerNum.innerHTML = '<i data-lucide="check" style="width: 28px; height: 28px; color: #10B981;"></i>';
      if (timerUnit) timerUnit.textContent = isTh ? 'เสร็จสิ้น' : 'Done';
      if (statusDot) {
        statusDot.style.background = '#10B981';
        statusDot.style.boxShadow = '0 0 10px #10B981';
      }
      if (statusTitle) statusTitle.innerHTML = isTh ? '🎉 ยืนยันสิทธิ์สำเร็จ พร้อมรับลิงก์แล้ว!' : '🎉 Verification complete! Ready for link.';
      if (statusSub) statusSub.textContent = isTh ? 'คลิกปุ่มด้านล่างเพื่อไปยังหน้ารับลิงก์' : 'Click button below to go to Get Link page';
      if (bar) {
        bar.style.width = '100%';
        bar.style.background = 'linear-gradient(90deg, #10B981, #059669)';
      }

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
    if (statusDot) {
      statusDot.style.background = '#10B981';
      statusDot.style.boxShadow = '0 0 10px #10B981';
    }
    if (statusTitle) statusTitle.innerHTML = isTh ? '🎉 ปลดล็อคสิทธิ์ 24 ชม. เรียบร้อยแล้ว!' : '🎉 24h Pass Unlocked Successfully!';
    if (statusSub) statusSub.textContent = isTh ? 'คลิกปุ่มรับลิงก์ด้านล่างเพื่อเข้าสู่เว็บไซต์ทันที' : 'Click Get Link button below to enter website';
    if (bar) {
      bar.style.width = '100%';
      bar.style.background = 'linear-gradient(90deg, #10B981, #059669)';
    }

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

// Start Round Countdown with Grace Period
function startRoundCountdown(roundNum, adIndex) {
  // 1. Open Monetag Ad #1 or #2
  triggerDirectAd(adIndex);

  // 2. Set state to COUNTING with 10 seconds duration
  roundState = 'COUNTING';
  remainingSeconds = ROUND_DURATION;
  targetEndTime = Date.now() + (ROUND_DURATION * 1000);
  gracePeriodActive = true;

  // 1.8s grace period to allow browser to open and focus ad tab
  setTimeout(() => {
    gracePeriodActive = false;
    checkAwayDwellStatus();
  }, 1800);

  renderCurrentRoundUI();
  runTimerLoop();
}

// Resume Round Countdown after Pause
function resumeRoundCountdown(adIndex) {
  if (adIndex !== undefined) {
    triggerDirectAd(adIndex);
  }

  roundState = 'COUNTING';
  targetEndTime = Date.now() + (remainingSeconds * 1000);
  gracePeriodActive = true;

  setTimeout(() => {
    gracePeriodActive = false;
    checkAwayDwellStatus();
  }, 1800);

  renderCurrentRoundUI();
  runTimerLoop();
}

// Timer Loop with Timestamp Calculation (Resistant to Background Tab Throttling)
function runTimerLoop() {
  if (countdownTimer) clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    if (roundState !== 'COUNTING') return;

    const now = Date.now();
    const remainingMs = targetEndTime - now;
    remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

    // If tab is visible and remaining > 0 and grace period has ended, pause!
    if (!document.hidden && remainingSeconds > 0 && !gracePeriodActive) {
      pauseRoundCountdown();
      return;
    }

    renderCurrentRoundUI();

    if (remainingSeconds <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      roundState = 'COMPLETED';
      renderCurrentRoundUI();
      const isTh = currentLang === 'th';
      if (currentRound === 1) {
        showToast(isTh ? '🎉 ขั้นตอนที่ 1 เสร็จแล้ว! แตะปุ่มเพื่อไปขั้นตอนที่ 2' : '🎉 Step 1 complete! Click to advance to Step 2', 'success', 3000);
      } else if (currentRound === 2) {
        showToast(isTh ? '✨ ขั้นตอนที่ 2 เสร็จแล้ว! แตะปุ่มเพื่อไปรับลิงก์' : '✨ Step 2 complete! Click to go to Get Link', 'success', 3000);
      }
    }
  }, 400);
}

// Away Dwell Check: Pause if user returns to gateway tab early
function checkAwayDwellStatus() {
  if (roundState !== 'COUNTING' || gracePeriodActive) return;
  if (!document.hidden && remainingSeconds > 0) {
    pauseRoundCountdown();
  }
}

// Pause Countdown
function pauseRoundCountdown() {
  if (roundState !== 'COUNTING') return;

  roundState = 'PAUSED';
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  renderCurrentRoundUI();

  const isTh = currentLang === 'th';
  showToast(
    isTh 
      ? `⏸️ หยุดนับเวลา! กรุณากลับไปดูหน้าสปอนเซอร์ให้ครบ ${ROUND_DURATION} วินาที` 
      : `⏸️ Paused! Please view sponsor page for ${ROUND_DURATION} seconds`,
    'error',
    3000
  );
}

// Away Dwell Visibility & Window Focus Event Listeners
function initAwayDwellListeners() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // User switched away to the ad tab! Automatically resume if paused
      if (roundState === 'PAUSED' && remainingSeconds > 0) {
        roundState = 'COUNTING';
        targetEndTime = Date.now() + (remainingSeconds * 1000);
        runTimerLoop();
        renderCurrentRoundUI();
      }
    } else {
      // User returned to gateway tab!
      if (roundState === 'COUNTING' && remainingSeconds > 0 && !gracePeriodActive) {
        pauseRoundCountdown();
      }
    }
  });

  window.addEventListener('blur', () => {
    // Window lost focus (user moved to ad window)
    if (roundState === 'PAUSED' && remainingSeconds > 0) {
      roundState = 'COUNTING';
      targetEndTime = Date.now() + (remainingSeconds * 1000);
      runTimerLoop();
      renderCurrentRoundUI();
    }
  });

  window.addEventListener('focus', () => {
    // Window gained focus
    if (roundState === 'COUNTING' && remainingSeconds > 0 && !gracePeriodActive) {
      pauseRoundCountdown();
    }
  });
}

// Handle Interactive Button Click in Each Round
window.handleShrinkButtonClick = function() {
  const isTh = currentLang === 'th';

  // --- ROUND 1 CLICK HANDLING ---
  if (currentRound === 1) {
    if (roundState === 'READY') {
      startRoundCountdown(1, 0);
    } else if (roundState === 'PAUSED') {
      resumeRoundCountdown(0);
    } else if (roundState === 'COMPLETED') {
      setRound(2);
      showToast(isTh ? '➡️ เข้าสู่ขั้นตอนที่ 2 จาก 3' : '➡️ Welcome to Step 2 of 3', 'info', 2000);
    }

  // --- ROUND 2 CLICK HANDLING ---
  } else if (currentRound === 2) {
    if (roundState === 'READY') {
      startRoundCountdown(2, 1);
    } else if (roundState === 'PAUSED') {
      resumeRoundCountdown(1);
    } else if (roundState === 'COMPLETED') {
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
