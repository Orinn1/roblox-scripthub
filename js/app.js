/**
 * BlacklistScriptx App Logic
 * Layout: Dashboard with Home, Feed, & Exploits / sUNC Views
 * Features: Dynamic Site Name, Script Sync, Sub2Unlock Locker, WEAO API Live Exploits & sUNC Data
 * Icons: Lucide Vector Icons (Strictly No Emojis)
 */

document.addEventListener("DOMContentLoaded", () => {
    let scripts = getScriptsData();

    // App State
    let currentView = "home";
    let activeFilter = "all";
    let activeGame = null;
    let searchQuery = "";
    let selectedScript = null;

    // Exploits & sUNC State
    let allExploits = [];
    let activeExploitPlatform = "all";
    let currentSuncData = null;
    let currentSuncFilter = "";

    // Task State for Locker
    let tasks = { t1: false, t2: false, t3: false };
    let currentTaskTimer = null;

    // Views
    const homeView = document.getElementById("homeView");
    const feedView = document.getElementById("feedView");
    const exploitsView = document.getElementById("exploitsView");

    // Feeds & Grids
    const scriptsFeed = document.getElementById("scriptsFeed");
    const homeRecentScripts = document.getElementById("homeRecentScripts");
    const homeExecutorsGrid = document.getElementById("homeExecutorsGrid");
    const exploitsGrid = document.getElementById("exploitsGrid");

    // Controls & Toolbars
    const globalSearch = document.getElementById("globalSearch");
    const currentViewTitle = document.getElementById("currentViewTitle");
    const currentViewDesc = document.getElementById("currentViewDesc");
    const totalCount = document.getElementById("totalCount");
    const exploitPlatformFilter = document.getElementById("exploitPlatformFilter");

    const mainMenu = document.getElementById("mainMenu");
    const gameMenu = document.getElementById("gameMenu");
    const filterChips = document.querySelector(".view-filter-chips");
    const trendingGamesGrid = document.getElementById("trendingGamesGrid");
    const brandLogo = document.getElementById("brandLogo");
    const brandTitleText = document.getElementById("brandTitleText");

    // Mobile Navigation Elements
    const appSidebar = document.getElementById("appSidebar");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const mobileBottomNav = document.getElementById("mobileBottomNav");
    const bottomNavMenuBtn = document.getElementById("bottomNavMenuBtn");
    const mobileBrandTitle = document.getElementById("mobileBrandTitle");

    // Buttons
    const btnGoFeedAll = document.getElementById("btnGoFeedAll");
    const btnSeeAllGames = document.getElementById("btnSeeAllGames");
    const btnSeeAllScripts = document.getElementById("btnSeeAllScripts");
    const btnSeeAllExploits = document.getElementById("btnSeeAllExploits");

    // Sub2Unlock Modal Elements
    const lockerModal = document.getElementById("lockerModal");
    const closeLockerBtn = document.getElementById("closeLockerBtn");
    const tasksStack = document.getElementById("tasksStack");
    const lockedLabel = document.getElementById("lockedLabel");
    const unlockedView = document.getElementById("unlockedView");
    const scriptCodeBox = document.getElementById("scriptCodeBox");
    const btnCopyScript = document.getElementById("btnCopyScript");

    const task1Btn = document.getElementById("task1Btn");
    const task2Btn = document.getElementById("task2Btn");
    const task3Btn = document.getElementById("task3Btn");

    const dot1 = document.getElementById("dot1");
    const dot2 = document.getElementById("dot2");
    const dot3 = document.getElementById("dot3");

    // sUNC Modal Elements
    const suncModal = document.getElementById("suncModal");
    const closeSuncModalBtn = document.getElementById("closeSuncModalBtn");
    const suncModalTitle = document.getElementById("suncModalTitle");
    const suncVersion = document.getElementById("suncVersion");
    const suncTime = document.getElementById("suncTime");
    const suncPassedCount = document.getElementById("suncPassedCount");
    const suncFailedCount = document.getElementById("suncFailedCount");
    const searchSuncFunc = document.getElementById("searchSuncFunc");
    const suncTestList = document.getElementById("suncTestList");

    const toastBar = document.getElementById("toastBar");

    // LootLabs Gate Elements
    const lootlabsGateOverlay = document.getElementById("lootlabsGateOverlay");
    const gateMessageText = document.getElementById("gateMessageText");
    const gateLootlabsBtn = document.getElementById("gateLootlabsBtn");
    const gateAutoDetectBox = document.getElementById("gateAutoDetectBox");
    const gateAutoDetectText = document.getElementById("gateAutoDetectText");
    const gateCheckStatusBtn = document.getElementById("gateCheckStatusBtn");
    const gateTokenInput = document.getElementById("gateTokenInput");
    const gateErrorMsg = document.getElementById("gateErrorMsg");
    const btnToggleGateTutorial = document.getElementById("btnToggleGateTutorial");
    const lblGateTutorial = document.getElementById("lblGateTutorial");
    const gateTutorialChevron = document.getElementById("gateTutorialChevron");
    const gateTutorialPlayerBox = document.getElementById("gateTutorialPlayerBox");
    const gateTutorialIframe = document.getElementById("gateTutorialIframe");
    const gateTutorialYtDirectLink = document.getElementById("gateTutorialYtDirectLink");

    // Banned Screen Overlay Elements
    const bannedScreenOverlay = document.getElementById("bannedScreenOverlay");
    const bannedReasonText = document.getElementById("bannedReasonText");
    const bannedHours = document.getElementById("bannedHours");
    const bannedMinutes = document.getElementById("bannedMinutes");
    const bannedSeconds = document.getElementById("bannedSeconds");
    const bannedClientIp = document.getElementById("bannedClientIp");
    const bannedDurationText = document.getElementById("bannedDurationText");
    const bannedExpireTimeText = document.getElementById("bannedExpireTimeText");
    let bannedCountdownInterval = null;
    let isCurrentlyBanned = false;

    // Social Links
    const sideYtBtn = document.getElementById("sideYtBtn");
    const sideDcBtn = document.getElementById("sideDcBtn");

    // =========================================================================
    // Multi-Language Localization (i18n) - Auto Detect Thai vs Foreigners
    // =========================================================================
    function getInitialLanguage() {
        // 1. ถ้าผู้ใช้เคยกดเลือกภาษาเอง ให้จำค่านั้นไว้เสมอ
        const manualChoice = localStorage.getItem("blacklist_lang_manual");
        if (manualChoice === "true") {
            const saved = localStorage.getItem("blacklist_lang");
            if (saved === "th" || saved === "en") return saved;
        }

        // 2. ตรวจสอบเบื้องต้นแบบเรียลไทม์ทันที (Timezone ไทย หรือภาษาเครื่องภาษาไทย)
        try {
            const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
            const navLang = (navigator.language || "").toLowerCase();
            const navLangs = (navigator.languages || []).map(l => l.toLowerCase());
            if (tz === "asia/bangkok" || navLang.startsWith("th") || navLangs.some(l => l.startsWith("th"))) {
                return "th";
            }
        } catch (e) {}

        return "en";
    }

    let currentLang = getInitialLanguage();
    const langBtnEn = document.getElementById("langBtnEn");
    const langBtnTh = document.getElementById("langBtnTh");

    const I18N = {
        en: {
            pageTitle: "BlacklistScriptX - Roblox Scripts & Exploit Hub",
            searchPlaceholder: "Search games, scripts, or executors...",
            mainMenu: "Main Menu",
            navHome: "Home",
            navAll: "All Scripts",
            navKeyless: "Keyless",
            navMobile: "Mobile Supported",
            navExploits: "Executor Status & sUNC",
            gameCat: "Game Categories",
            sideYt: "YouTube Channel",
            sideDc: "Join Discord",
            spotBadge: "#1 Trending Script",
            spotDesc: "The most stable level farming script. Auto farm, quests, dual katanas, fully awakened fruits. Mobile & PC supported.",
            spotGet: "Get This Script",
            spotAll: "View All Scripts",
            trendingHead: "Trending Scripts",
            seeAllScripts: "View All ➔",
            executorsHead: "Live Executor Status & sUNC (WEAO)",
            seeAllExploits: "View All 30+ Executors ➔",
            loadingExploits: "Loading executor status from WEAO API...",
            viewTitleAll: "All Scripts",
            viewDescAll: "Select a script to unlock its code",
            viewTitleKeyless: "Keyless Scripts",
            viewDescKeyless: "No keys required, execute immediately",
            viewTitleMobile: "Mobile Supported Scripts",
            viewDescMobile: "Supports Delta, Codex, Hydrogen on Android/iOS",
            viewTitleGame: (g) => `Scripts for ${g}`,
            viewDescGame: (g) => `All verified scripts and exploits for ${g}`,
            chipAll: "All",
            chipKeyless: "Keyless",
            chipMobile: "Mobile",
            noScriptsFound: "No scripts found matching your search. Try another category.",
            noScriptsAdmin: "No scripts in system yet. Admins can add new scripts via Admin Panel.",
            exploitsTitle: "Top Executor Status & sUNC Data",
            exploitsDesc: "Live status of top executors (Delta, Codex, Solara, Wave, etc.) with sUNC scores and official downloads",
            platAll: "All",
            loadingAllExploits: "Loading data from WEAO API...",
            noExploitsFound: "No prominent executors found for the selected device.",
            weaoOffline: "Unable to connect to WEAO API at this time.",
            // Script card items
            tagKeyless: "Keyless",
            tagHasKey: "Key Required",
            tagMobilePc: "Mobile / PC",
            tagStatusNormal: "Status: Working",
            statViews: (n) => `${n} views`,
            statLikes: (n) => `${n} likes`,
            btnGetScript: "Get Script",
            toastCopied: "Script copied to clipboard!",
            toastLiked: "Thanks for liking this script!",
            toastUnliked: "Unliked script",
            // Executor card items
            badgePopular: "Popular",
            statusWorking: "Working",
            statusUpdating: "Updating",
            priceFree: "Free",
            pricePaid: "Paid",
            suncNoData: "No Data",
            typePrice: "Type / Price",
            safetyStatus: "Safety Status",
            statusDetected: "Detected",
            statusUndetected: "Undetected (Safe)",
            lastUpdated: "Last Updated",
            btnDownloadOfficial: "Official Website / Download",
            btnViewSunc: "View sUNC Results",
            btnNoSunc: "No sUNC Results",
            // sUNC Modal
            suncVer: "Version:",
            suncTime: "Tested:",
            suncPass: "Passed:",
            suncFail: "Failed:",
            suncSearchPlaceholder: "Search functions e.g. getrawmetatable, hookmetamethod...",
            suncLoading: "Loading function benchmark results...",
            suncModalTitle: (title) => `${title} - sUNC Benchmark Data`,
            suncDownloading: "Downloading sUNC data from WEAO API...",
            suncLoadError: "Unable to load sUNC data or API unresponsive.",
            suncNotFound: (q) => `No functions matching "${q}"`,
            suncReason: "Reason:",
            suncFailBadge: "Failed",
            suncPassBadge: "Passed",
            // Locker Modal
            lockerTitle: "Unlock Script Code",
            lockerDesc: "Complete the 3 support tasks below to receive the free script code",
            step1: "Task 1",
            step2: "Task 2",
            step3: "Task 3",
            task1Name: "Subscribe to YouTube Channel",
            task1Hint: "Open link and wait 5 seconds for verification",
            task2Name: "Join Discord Community",
            task2Hint: "Open link and wait 5 seconds for verification",
            task3Name: "Like & Comment on Video",
            task3Hint: "Open video and wait 3 seconds for verification",
            pillStart: "Start",
            pillPending: "Pending",
            pillDone: "Completed",
            lockedNotice: "Script is locked • Complete all tasks to unlock",
            lockedRemaining: (n) => `Script locked • Complete ${n} more task(s) to unlock`,
            lockedFinished: "Unlocked successfully!",
            verifyingTask: (sec) => `Verifying task... (${sec} seconds)`,
            taskWaitPrev1: "Please complete Task 1 first!",
            taskWaitPrev2: "Please complete Task 2 first!",
            taskDoneHint: "Task completed",
            unlockedTitle: "Unlocked Successfully! 🎉",
            unlockedDesc: "You can now copy the script code and run it in your game",
            btnCopyCode: "Copy Script (Copy Code)",
            unlockedToast: "Congratulations! Script unlocked successfully.",
            copiedBtn: "Copied successfully!",
            gateAccessRestrictedToast: "⚠️ Access restricted! Please complete LootLabs link first.",
            // Popup
            popupDismiss24h: "Don't show again for 24 hours",
            popupClose: "Close Window",
            // Gate
            gateTitle: "Access Restricted",
            gateDesc: "Please complete the support link to unlock access to the website and receive free scripts",
            gateBtn: "Complete Link to Unlock",
            gateDetect: "Waiting for completion... (Unlocks automatically when finished)",
            gateCheck: "Check Status Now",
            gateDivider: "OR VERIFY WITH ACCESS TOKEN",
            gateTokenPlaceholder: "Enter Access Token",
            gateTokenSubmit: "Unlock",
            gateHint: "Once verified, this device will be remembered for 24 hours",
            // Mobile Nav
            mobHome: "Home",
            mobScripts: "Scripts",
            mobExploits: "Executors",
            mobCats: "Categories"
        },
        th: {
            pageTitle: "BlacklistScriptX แจกสคริป Roblox & สถานะตัวรัน",
            searchPlaceholder: "ค้นหาชื่อเกม, สคริปต์, หรือตัวรัน...",
            mainMenu: "เมนูหลัก",
            navHome: "หน้าหลัก",
            navAll: "สคริปต์ทั้งหมด",
            navKeyless: "ไร้คีย์ (Keyless)",
            navMobile: "รองรับมือถือ",
            navExploits: "สถานะตัวรัน & sUNC",
            gameCat: "หมวดหมู่เกม",
            sideYt: "ช่อง YouTube",
            sideDc: "เข้า Discord",
            spotBadge: "สคริปต์ยอดนิยมอันดับ 1",
            spotDesc: "สคริปต์ฟาร์มเลเวลที่เสถียรที่สุด ฟาร์มออโต้ เควสต์ ดาบคู่โซโร ผลตื่นครบทุกสาย ไม่หลุดง่าย รองรับทั้งมือถือและ PC",
            spotGet: "รับสคริปต์นี้",
            spotAll: "ดูสคริปต์ทั้งหมด",
            trendingHead: "สคริปต์มาแรงล่าสุด",
            seeAllScripts: "ดูทั้งหมด ➔",
            executorsHead: "สถานะตัวรันยอดนิยม & sUNC (Live WEAO)",
            seeAllExploits: "ดูตัวรันทั้งหมด 30+ ตัว ➔",
            loadingExploits: "กำลังโหลดข้อมูลสถานะตัวรันจาก WEAO API...",
            viewTitleAll: "สคริปต์ทั้งหมด",
            viewDescAll: "เลือกสคริปต์ที่ต้องการเพื่อปลดล็อคโค้ด",
            viewTitleKeyless: "สคริปต์ไร้คีย์ (Keyless)",
            viewDescKeyless: "ไม่ต้องใส่คีย์ เปิดแล้วรันได้ทันที",
            viewTitleMobile: "สคริปต์รองรับมือถือ",
            viewDescMobile: "รองรับ Delta, Codex, Hydrogen บน Android/iOS",
            viewTitleGame: (g) => `สคริปต์เกม ${g}`,
            viewDescGame: (g) => `รวมสคริปต์ฟาร์มออโต้สำหรับ ${g}`,
            chipAll: "ทั้งหมด",
            chipKeyless: "ไร้คีย์",
            chipMobile: "มือถือ",
            noScriptsFound: "ไม่พบสคริปต์ที่ค้นหา ลองเลือกหมวดหมู่อื่นดูนะครับ",
            noScriptsAdmin: "ยังไม่มีสคริปต์ในระบบ แอดมินสามารถเพิ่มสคริปต์ใหม่ได้ที่หน้าหลังบ้าน (Admin Panel)",
            exploitsTitle: "ตรวจสอบสถานะตัวรันยอดนิยม & sUNC Data",
            exploitsDesc: "สถานะสดตัวรันระดับท็อป (Delta, Codex, Solara, Wave ฯลฯ) พร้อมคะแนน sUNC และลิงก์ดาวน์โหลดทางการ",
            platAll: "ทั้งหมด",
            loadingAllExploits: "กำลังดึงข้อมูลจาก WEAO API...",
            noExploitsFound: "ไม่พบตัวรันยอดนิยมสำหรับอุปกรณ์ที่เลือกในขณะนี้",
            weaoOffline: "ไม่สามารถเชื่อมต่อ WEAO API ได้ในขณะนี้",
            // Script card items
            tagKeyless: "ไร้คีย์",
            tagHasKey: "มีคีย์",
            tagMobilePc: "รองรับมือถือ / PC",
            tagStatusNormal: "สถานะ: ปกติ",
            statViews: (n) => `${n} ครั้ง`,
            statLikes: (n) => `${n} ถูกใจ`,
            btnGetScript: "รับสคริปต์",
            toastCopied: "คัดลอกสคริปต์แล้ว!",
            toastLiked: "ขอบคุณที่กดถูกใจสคริปต์นี้!",
            toastUnliked: "ยกเลิกการถูกใจแล้ว",
            // Executor card items
            badgePopular: "ยอดนิยม",
            statusWorking: "พร้อมใช้งาน",
            statusUpdating: "รออัปเดต",
            priceFree: "ฟรี",
            pricePaid: "มีค่าบริการ",
            suncNoData: "ไม่มีข้อมูล",
            typePrice: "ประเภท / ราคา",
            safetyStatus: "สถานะความปลอดภัย",
            statusDetected: "ตรวจพบ (Detected)",
            statusUndetected: "ปลอดภัย (Undetected)",
            lastUpdated: "อัปเดตล่าสุด",
            btnDownloadOfficial: "เว็บไซต์หลัก / ดาวน์โหลด",
            btnViewSunc: "ดูผลทดสอบ sUNC",
            btnNoSunc: "ไม่มีผลทดสอบ sUNC",
            // sUNC Modal
            suncVer: "เวอร์ชั่น:",
            suncTime: "เวลาทดสอบ:",
            suncPass: "ผ่าน:",
            suncFail: "ไม่ผ่าน:",
            suncSearchPlaceholder: "ค้นหาฟังก์ชัน เช่น getrawmetatable, hookmetamethod...",
            suncLoading: "กำลังโหลดผลการทดสอบฟังก์ชัน...",
            suncModalTitle: (title) => `${title} - ข้อมูลผลทดสอบ sUNC`,
            suncDownloading: "กำลังดาวน์โหลดข้อมูล sUNC จาก WEAO API...",
            suncLoadError: "ไม่สามารถโหลดข้อมูล sUNC ได้ หรือ API ไม่ตอบสนอง",
            suncNotFound: (q) => `ไม่พบฟังก์ชันที่ตรงกับ "${q}"`,
            suncReason: "เหตุผล:",
            suncFailBadge: "ไม่ผ่าน",
            suncPassBadge: "ผ่าน",
            // Locker Modal
            lockerTitle: "ปลดล็อคโค้ดสคริปต์",
            lockerDesc: "ทำภารกิจสนับสนุน 3 ขั้นตอนด้านล่างเพื่อรับโค้ดสคริปต์ฟรี",
            step1: "ภารกิจ 1",
            step2: "ภารกิจ 2",
            step3: "ภารกิจ 3",
            task1Name: "กดติดตาม YouTube / Subscribe",
            task1Hint: "เปิดลิงก์และรอระบบยืนยัน 5 วินาที",
            task2Name: "เข้าร่วม Discord / Join Discord",
            task2Hint: "เปิดลิงก์และรอระบบยืนยัน 5 วินาที",
            task3Name: "กดไลค์ & คอมเมนต์ / Like & Comment",
            task3Hint: "เปิดคลิปและรอระบบยืนยัน 3 วินาที",
            pillStart: "เริ่มทำ",
            pillPending: "รอดำเนินการ",
            pillDone: "สำเร็จ",
            lockedNotice: "สคริปต์ถูกล็อคอยู่ • ทำภารกิจให้ครบเพื่อเปิดใช้งาน",
            lockedRemaining: (n) => `สคริปต์ถูกล็อคอยู่ • เหลืออีก ${n} ภารกิจเพื่อปลดล็อค`,
            lockedFinished: "ปลดล็อคเรียบร้อยแล้ว!",
            verifyingTask: (sec) => `กำลังตรวจสอบภารกิจ... (${sec} วินาที)`,
            taskWaitPrev1: "กรุณาทำภารกิจที่ 1 ให้เสร็จก่อนครับ",
            taskWaitPrev2: "กรุณาทำภารกิจที่ 2 ให้เสร็จก่อนครับ",
            taskDoneHint: "ภารกิจเสร็จสิ้นแล้ว",
            unlockedTitle: "ปลดล็อคสำเร็จแล้ว! 🎉",
            unlockedDesc: "สามารถคัดลอกโค้ดสคริปต์ไปรันในเกมได้ทันที",
            btnCopyCode: "คัดลอกสคริปต์ (Copy Code)",
            unlockedToast: "ยินดีด้วย! คุณปลดล็อคสคริปต์สำเร็จแล้ว",
            copiedBtn: "คัดลอกสำเร็จแล้ว!",
            gateAccessRestrictedToast: "⚠️ สิทธิ์เข้าใช้งานถูกจำกัด! กรุณาผ่าน LootLabs ก่อนรับสคริปต์",
            // Popup
            popupDismiss24h: "ไม่ต้องแสดงอีก 24 ชั่วโมง",
            popupClose: "ปิดหน้าต่าง",
            // Gate
            gateTitle: "สิทธิ์เข้าใช้งานถูกจำกัด",
            gateDesc: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน เพื่อปลดล็อคการเข้าชมเว็บไซต์และรับสคริปต์ฟรี",
            gateBtn: "กดผ่านลิงก์เพื่อปลดล็อคเข้าเว็บ",
            gateDetect: "กำลังรอคุณทำภารกิจ... (ระบบจะปลดล็อคให้อัตโนมัติทันทีที่เสร็จ)",
            gateCheck: "ตรวจสอบสถานะทันที",
            gateDivider: "หรือยืนยันด้วย ACCESS TOKEN",
            gateTokenPlaceholder: "กรอก Access Token",
            gateTokenSubmit: "ปลดล็อค",
            gateHint: "เมื่อยืนยันสำเร็จ ระบบจะจดจำเครื่องนี้ไว้ให้เข้าได้ตลอด 24 ชั่วโมง",
            // Mobile Nav
            mobHome: "หน้าแรก",
            mobScripts: "สคริปต์",
            mobExploits: "ตัวรัน & sUNC",
            mobCats: "หมวดหมู่"
        }
    };

    function applyTranslations() {
        const t = I18N[currentLang] || I18N.en;

        if (SITE_CONFIG.siteName) {
            document.title = `${SITE_CONFIG.siteName} - ${currentLang === 'th' ? 'Roblox Script Hub & สถานะตัวรัน' : 'Roblox Script Hub & Exploit Status'}`;
        }

        const lblMainMenu = document.getElementById("lblMainMenu");
        if (lblMainMenu) lblMainMenu.textContent = t.mainMenu;
        const lblNavHome = document.getElementById("lblNavHome");
        if (lblNavHome) lblNavHome.textContent = t.navHome;
        const lblNavAll = document.getElementById("lblNavAll");
        if (lblNavAll) lblNavAll.textContent = t.navAll;
        const lblNavKeyless = document.getElementById("lblNavKeyless");
        if (lblNavKeyless) lblNavKeyless.textContent = t.navKeyless;
        const lblNavMobile = document.getElementById("lblNavMobile");
        if (lblNavMobile) lblNavMobile.textContent = t.navMobile;
        const lblNavExploits = document.getElementById("lblNavExploits");
        if (lblNavExploits) lblNavExploits.textContent = t.navExploits;
        const lblGameCat = document.getElementById("lblGameCat");
        if (lblGameCat) lblGameCat.textContent = t.gameCat;
        const lblSideYt = document.getElementById("lblSideYt");
        if (lblSideYt) lblSideYt.textContent = t.sideYt;
        const lblSideDc = document.getElementById("lblSideDc");
        if (lblSideDc) lblSideDc.textContent = t.sideDc;

        if (globalSearch) globalSearch.placeholder = t.searchPlaceholder;

        const lblSpotBadge = document.getElementById("lblSpotBadge");
        if (lblSpotBadge) lblSpotBadge.textContent = t.spotBadge;
        const lblSpotDesc = document.getElementById("lblSpotDesc");
        if (lblSpotDesc) lblSpotDesc.textContent = t.spotDesc;
        const lblSpotGet = document.getElementById("lblSpotGet");
        if (lblSpotGet) lblSpotGet.textContent = t.spotGet;
        const lblSpotAll = document.getElementById("lblSpotAll");
        if (lblSpotAll) lblSpotAll.textContent = t.spotAll;

        const lblTrendingHead = document.getElementById("lblTrendingHead");
        if (lblTrendingHead) lblTrendingHead.textContent = t.trendingHead;
        const lblSeeAllScripts = document.getElementById("lblSeeAllScripts");
        if (lblSeeAllScripts) lblSeeAllScripts.textContent = t.seeAllScripts;
        const lblExecutorsHead = document.getElementById("lblExecutorsHead");
        if (lblExecutorsHead) lblExecutorsHead.textContent = t.executorsHead;
        const lblSeeAllExploits = document.getElementById("lblSeeAllExploits");
        if (lblSeeAllExploits) lblSeeAllExploits.textContent = t.seeAllExploits;
        const lblLoadingExploits = document.getElementById("lblLoadingExploits");
        if (lblLoadingExploits) lblLoadingExploits.innerHTML = `<i data-lucide="loader-2" class="spin"></i> ${t.loadingExploits}`;

        if (!activeGame) {
            if (currentViewTitle) {
                if (activeFilter === "keyless") currentViewTitle.textContent = t.viewTitleKeyless;
                else if (activeFilter === "mobile") currentViewTitle.textContent = t.viewTitleMobile;
                else currentViewTitle.textContent = t.viewTitleAll;
            }
            if (currentViewDesc) {
                if (activeFilter === "keyless") currentViewDesc.textContent = t.viewDescKeyless;
                else if (activeFilter === "mobile") currentViewDesc.textContent = t.viewDescMobile;
                else currentViewDesc.textContent = t.viewDescAll;
            }
        } else {
            if (currentViewTitle) currentViewTitle.textContent = t.viewTitleGame(activeGame);
            if (currentViewDesc) currentViewDesc.textContent = t.viewDescGame(activeGame);
        }

        const lblChipAll = document.getElementById("lblChipAll");
        if (lblChipAll) lblChipAll.textContent = t.chipAll;
        const lblChipKeyless = document.getElementById("lblChipKeyless");
        if (lblChipKeyless) lblChipKeyless.textContent = t.chipKeyless;
        const lblChipMobile = document.getElementById("lblChipMobile");
        if (lblChipMobile) lblChipMobile.textContent = t.chipMobile;

        const lblExploitsViewTitle = document.getElementById("lblExploitsViewTitle");
        if (lblExploitsViewTitle) lblExploitsViewTitle.textContent = t.exploitsTitle;
        const lblExploitsViewDesc = document.getElementById("lblExploitsViewDesc");
        if (lblExploitsViewDesc) lblExploitsViewDesc.textContent = t.exploitsDesc;
        const lblPlatAll = document.getElementById("lblPlatAll");
        if (lblPlatAll) lblPlatAll.textContent = t.platAll;

        const lblLockerTitle = document.getElementById("lblLockerTitle");
        if (lblLockerTitle) lblLockerTitle.textContent = t.lockerTitle;
        const lblLockerDesc = document.getElementById("lblLockerDesc");
        if (lblLockerDesc) lblLockerDesc.textContent = t.lockerDesc;
        const lblStep1 = document.getElementById("lblStep1");
        if (lblStep1) lblStep1.textContent = t.step1;
        const lblStep2 = document.getElementById("lblStep2");
        if (lblStep2) lblStep2.textContent = t.step2;
        const lblStep3 = document.getElementById("lblStep3");
        if (lblStep3) lblStep3.textContent = t.step3;
        const task1Text = document.getElementById("task1Text");
        if (task1Text) task1Text.textContent = t.task1Name;
        const task1Hint = document.getElementById("task1Hint");
        if (task1Hint) task1Hint.textContent = t.task1Hint;
        const task2Text = document.getElementById("task2Text");
        if (task2Text) task2Text.textContent = t.task2Name;
        const task2Hint = document.getElementById("task2Hint");
        if (task2Hint) task2Hint.textContent = t.task2Hint;
        const task3Text = document.getElementById("task3Text");
        if (task3Text) task3Text.textContent = t.task3Name;
        const task3Hint = document.getElementById("task3Hint");
        if (task3Hint) task3Hint.textContent = t.task3Hint;

        const lockedStatusText = document.getElementById("lockedStatusText");
        if (lockedStatusText && !tasks.t1 && !tasks.t2 && !tasks.t3) lockedStatusText.textContent = t.lockedNotice;

        const lblUnlockedTitle = document.getElementById("lblUnlockedTitle");
        if (lblUnlockedTitle) lblUnlockedTitle.textContent = t.unlockedTitle;
        const lblUnlockedDesc = document.getElementById("lblUnlockedDesc");
        if (lblUnlockedDesc) lblUnlockedDesc.textContent = t.unlockedDesc;
        const lblBtnCopy = document.getElementById("lblBtnCopy");
        if (lblBtnCopy) lblBtnCopy.textContent = t.btnCopyCode;

        const lblPopup24h = document.getElementById("lblPopup24h");
        if (lblPopup24h) lblPopup24h.textContent = t.popupDismiss24h;
        const lblPopupClose = document.getElementById("lblPopupClose");
        if (lblPopupClose) lblPopupClose.textContent = t.popupClose;

        const lblGateTitle = document.getElementById("lblGateTitle");
        if (lblGateTitle) lblGateTitle.textContent = t.gateTitle;
        const lblGateBtn = document.getElementById("lblGateBtn");
        if (lblGateBtn) lblGateBtn.textContent = t.gateBtn;
        const gateAutoDetectText = document.getElementById("gateAutoDetectText");
        if (gateAutoDetectText) gateAutoDetectText.textContent = t.gateDetect;
        const lblGateCheck = document.getElementById("lblGateCheck");
        if (lblGateCheck) lblGateCheck.textContent = t.gateCheck;
        const lblGateDivider = document.getElementById("lblGateDivider");
        if (lblGateDivider) lblGateDivider.textContent = t.gateDivider;
        const gateTokenInput = document.getElementById("gateTokenInput");
        if (gateTokenInput) gateTokenInput.placeholder = t.gateTokenPlaceholder;
        const lblGateTokenSubmit = document.getElementById("lblGateTokenSubmit");
        if (lblGateTokenSubmit) lblGateTokenSubmit.textContent = t.gateTokenSubmit;
        const lblGateHint = document.getElementById("lblGateHint");
        if (lblGateHint) lblGateHint.textContent = t.gateHint;
        if (gateErrorMsg) gateErrorMsg.textContent = currentLang === 'th' ? "Token ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" : "Invalid Token. Please try again.";

        const lblGateTutorial = document.getElementById("lblGateTutorial");
        if (lblGateTutorial) {
            const isOpened = gateTutorialPlayerBox && gateTutorialPlayerBox.style.display !== "none";
            if (isOpened) {
                lblGateTutorial.textContent = currentLang === 'th' ? "ซ่อนคลิปสอนวิธีผ่าน" : "Hide Tutorial";
            } else {
                lblGateTutorial.textContent = currentLang === 'th' ? "ดูคลิปสอนวิธีผ่านลิงก์ (คลิกที่นี่)" : "Watch Tutorial Guide (Click here)";
            }
        }
        const lblGateTutorialHint = document.getElementById("lblGateTutorialHint");
        if (lblGateTutorialHint) lblGateTutorialHint.textContent = currentLang === 'th' ? "คลิปสั้นเข้าใจง่าย ดูจบทำตามได้ทันที" : "Short & easy guide. Follow steps to unlock.";
        const lblGateTutorialYt = document.getElementById("lblGateTutorialYt");
        if (lblGateTutorialYt) lblGateTutorialYt.textContent = currentLang === 'th' ? "เปิดดูบน YouTube" : "Watch on YouTube";

        const lblMobileNavHome = document.getElementById("lblMobileNavHome");
        if (lblMobileNavHome) lblMobileNavHome.textContent = t.mobHome;
        const lblMobileNavScripts = document.getElementById("lblMobileNavScripts");
        if (lblMobileNavScripts) lblMobileNavScripts.textContent = t.mobScripts;
        const lblMobileNavExploits = document.getElementById("lblMobileNavExploits");
        if (lblMobileNavExploits) lblMobileNavExploits.textContent = t.mobExploits;
        const lblMobileNavCats = document.getElementById("lblMobileNavCats");
        if (lblMobileNavCats) lblMobileNavCats.textContent = t.mobCats;

        const lblSuncVer = document.getElementById("lblSuncVer");
        if (lblSuncVer) {
            const vStrong = document.getElementById("suncVersion")?.textContent || "-";
            lblSuncVer.innerHTML = `${t.suncVer} <strong id="suncVersion">${vStrong}</strong>`;
        }
        const lblSuncTime = document.getElementById("lblSuncTime");
        if (lblSuncTime) {
            const tStrong = document.getElementById("suncTime")?.textContent || "-";
            lblSuncTime.innerHTML = `${t.suncTime} <strong id="suncTime">${tStrong}</strong>`;
        }
        const lblSuncPass = document.getElementById("lblSuncPass");
        if (lblSuncPass) {
            const pStrong = document.getElementById("suncPassedCount")?.textContent || "0";
            lblSuncPass.innerHTML = `${t.suncPass} <strong id="suncPassedCount">${pStrong}</strong>`;
        }
        const lblSuncFail = document.getElementById("lblSuncFail");
        if (lblSuncFail) {
            const fStrong = document.getElementById("suncFailedCount")?.textContent || "0";
            lblSuncFail.innerHTML = `${t.suncFail} <strong id="suncFailedCount">${fStrong}</strong>`;
        }
        if (searchSuncFunc) searchSuncFunc.placeholder = t.suncSearchPlaceholder;
    }

    function setLanguage(lang, isManual = false) {
        currentLang = lang === "th" ? "th" : "en";
        localStorage.setItem("blacklist_lang", currentLang);
        if (isManual) {
            localStorage.setItem("blacklist_lang_manual", "true");
        }
        document.documentElement.lang = currentLang;

        if (langBtnEn && langBtnTh) {
            if (currentLang === "en") {
                langBtnEn.classList.add("active");
                langBtnTh.classList.remove("active");
            } else {
                langBtnTh.classList.add("active");
                langBtnEn.classList.remove("active");
            }
        }

        applyTranslations();
        renderHomeRecent();
        if (currentView === "feed") renderFeed();
        renderHomeExecutors();
        if (currentView === "exploits") renderExploits();
        refreshIcons();
    }

    if (langBtnEn) {
        langBtnEn.addEventListener("click", () => setLanguage("en", true));
    }
    if (langBtnTh) {
        langBtnTh.addEventListener("click", () => setLanguage("th", true));
    }

    // ระบบตรวจจับประเทศผ่าน IP (Auto Geo-Language Detection)
    // ถ้าผู้ใช้มาจากประเทศไทย (TH) ให้ตั้งภาษาไทยอัตโนมัติ / ต่างชาติให้เป็นภาษาอังกฤษ (EN)
    async function autoDetectGeoLanguage() {
        // หากผู้ใช้เคยกดเลือกภาษาเอง จะไม่บังคับเปลี่ยน
        if (localStorage.getItem("blacklist_lang_manual") === "true") return;

        try {
            let country = "";

            // 1. ดึงข้อมูลผ่าน Endpoint ของเราเอง (/api/geo จาก Vercel / Cloudflare Header)
            const res = await fetch("/api/geo").catch(() => null);
            if (res && res.ok) {
                const data = await res.json().catch(() => null);
                if (data && data.country) country = data.country;
            }

            // 2. หากยังไม่ได้ประเทศ ให้ดึงจากบริการ GeoIP ฟรี (api.country.is)
            if (!country) {
                const pubRes = await fetch("https://api.country.is").catch(() => null);
                if (pubRes && pubRes.ok) {
                    const pubData = await pubRes.json().catch(() => null);
                    if (pubData && pubData.country) country = pubData.country;
                }
            }

            if (country) {
                const isThai = country.toUpperCase() === "TH";
                const targetLang = isThai ? "th" : "en";
                if (targetLang !== currentLang) {
                    setLanguage(targetLang, false);
                }
            }
        } catch (e) {
            console.debug("Geo-language auto-detect notice:", e);
        }
    }

    autoDetectGeoLanguage();

    // Helper: Refresh Lucide Icons
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

    // Helper: Escape HTML strings
    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // =========================================================================
    // Dynamic Site Config & Category Badge Counters
    // =========================================================================
    function applySiteConfig() {
        if (SITE_CONFIG.siteName) {
            document.title = `${SITE_CONFIG.siteName} - Roblox Script Hub & Exploit Status`;
        }
        const p = SITE_CONFIG.brandPrefix || "Rocket";
        const s = SITE_CONFIG.brandSuffix || "Scriptz";
        if (brandTitleText) {
            brandTitleText.innerHTML = `${escapeHtml(p)}<span>${escapeHtml(s)}</span>`;
        }
        if (mobileBrandTitle) {
            mobileBrandTitle.innerHTML = `${escapeHtml(p)}<span>${escapeHtml(s)}</span>`;
        }
        if (sideYtBtn) {
            let yt = (SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.youtube) || "https://www.youtube.com/@Blacklistxyx";
            if (yt.includes("YOUR_CHANNEL")) yt = "https://www.youtube.com/@Blacklistxyx";
            sideYtBtn.href = yt;
        }
        if (sideDcBtn && SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.discord) {
            sideDcBtn.href = SITE_CONFIG.socialLinks.discord;
        }
    }

    // Helper: สร้างหรือดึง Device PUID สำหรับส่งให้ LootLabs
    function getOrCreateLootlabsPuid() {
        let puid = localStorage.getItem("blacklist_lootlabs_puid");
        if (!puid || !puid.startsWith("ll_")) {
            puid = "ll_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
            localStorage.setItem("blacklist_lootlabs_puid", puid);
        }
        return puid;
    }

    let gatePollTimer = null;

    // Helper: ซ่อนหน้าต่างล็อคอย่างนุ่มนวล (Fade Out)
    function hideGateOverlay(withToast = false) {
        if (!lootlabsGateOverlay) return;
        isGateActivelyEnforced = false;
        isInternalGateChange = true;
        stopGatePolling();
        if (gateTutorialIframe) gateTutorialIframe.src = "";
        if (gateTutorialPlayerBox) gateTutorialPlayerBox.style.display = "none";
        lootlabsGateOverlay.style.pointerEvents = "none";
        lootlabsGateOverlay.classList.add("gate-fade-out");
        setTimeout(() => {
            lootlabsGateOverlay.style.display = "none";
            lootlabsGateOverlay.style.visibility = "hidden";
            lootlabsGateOverlay.classList.remove("gate-fade-out");
            isInternalGateChange = false;
        }, 350);

        if (withToast) {
            const gate = SITE_CONFIG.lootlabsGate || {};
            const durationHours = Number(gate.expiryHours || 24);
            showToast(`🎉 ปลดล็อคสำเร็จ! จดจำเครื่องนี้ไว้ ${durationHours} ชั่วโมง`);
        }
    }

    // Helper: วนลูปตรวจจับสถานะจาก LootLabs อัตโนมัติ (ไม่ต้องกดปุ่มเอง)
    function startGatePolling(fast = false) {
        if (gatePollTimer) clearInterval(gatePollTimer);
        const intervalMs = fast ? 1500 : 2500;
        gatePollTimer = setInterval(async () => {
            if (!lootlabsGateOverlay || lootlabsGateOverlay.style.display === "none") {
                stopGatePolling();
                return;
            }
            const ok = await verifyLootlabsSession(true);
            if (ok) {
                stopGatePolling();
            }
        }, intervalMs);
    }

    function stopGatePolling() {
        if (gatePollTimer) {
            clearInterval(gatePollTimer);
            gatePollTimer = null;
        }
    }

    // =========================================================================
    // VIP MEMBER (DISCORD ROLE 1549727990542508083) SYSTEM
    // =========================================================================
    function getVipData() {
        try {
            const raw = localStorage.getItem("blacklist_vip_pass");
            if (!raw) {
                // Auto-restore VIP session if previously unlocked with lifetime marker
                if (localStorage.getItem("blacklist_lootlabs_auth_expiry") === "9999999999999") {
                    const restored = {
                        token: "",
                        user: { username: "VIP Member", id: "" },
                        expiresAt: 0
                    };
                    localStorage.setItem("blacklist_vip_pass", JSON.stringify(restored));
                    window.__IS_VIP__ = true;
                    return restored;
                }
                return null;
            }
            const data = JSON.parse(raw);
            if (!data) return null;
            // Only expire if explicitly set to a timestamp > 0 and current time is past it
            if (data.expiresAt && Number(data.expiresAt) > 0 && Date.now() > Number(data.expiresAt)) {
                localStorage.removeItem("blacklist_vip_pass");
                return null;
            }
            window.__IS_VIP__ = true;
            return data;
        } catch (e) {
            return null;
        }
    }

    function isVipMember() {
        return getVipData() !== null;
    }

    function saveVipSession(token, user, expiresAt) {
        const payload = {
            token: token || "",
            user: user || { username: "VIP Member", id: "" },
            expiresAt: 0 // 0 = Lifetime (Never expires)
        };
        localStorage.setItem("blacklist_vip_pass", JSON.stringify(payload));
        // Also grant gate access permanently
        localStorage.setItem("blacklist_lootlabs_auth_expiry", "9999999999999");
        sessionStorage.setItem("blacklist_lootlabs_auth", "true");
        window.__IS_VIP__ = true;
        updateVipUI();
    }

    function clearVipSession() {
        localStorage.removeItem("blacklist_vip_pass");
        updateVipUI();
    }

    function updateVipUI() {
        const vip = getVipData();
        const vipNavBtn = document.getElementById("vipNavBtn");
        const vipNavText = document.getElementById("vipNavText");
        const vipBtnIcon = document.getElementById("vipBtnIcon");
        const vipActivePanel = document.getElementById("vipActivePanel");
        const vipInactivePanel = document.getElementById("vipInactivePanel");
        const vipUserName = document.getElementById("vipUserName");
        const vipUserAvatar = document.getElementById("vipUserAvatar");
        const vipExpiryText = document.getElementById("vipExpiryText");

        if (vip) {
            let username = "VIP Member";
            let avatarUrl = "";

            if (vip.user) {
                username = vip.user.global_name || vip.user.username || username;
                if (vip.user.avatar) {
                    avatarUrl = vip.user.avatar.startsWith("http")
                        ? vip.user.avatar
                        : `https://cdn.discordapp.com/avatars/${vip.user.userId || vip.user.id}/${vip.user.avatar}.png`;
                }
            }

            // Fallback: decode directly from token if avatar or username missing
            if ((!avatarUrl || username === "VIP Member") && vip.token && vip.token.includes('.')) {
                try {
                    const tokenPayload = JSON.parse(atob(vip.token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
                    if (tokenPayload.username) username = tokenPayload.username;
                    if (tokenPayload.avatar) avatarUrl = tokenPayload.avatar;
                } catch (e) {}
            }

            if (vipNavBtn) {
                vipNavBtn.classList.add("is-active");
                if (vipNavText) vipNavText.textContent = username;
                if (vipBtnIcon) {
                    if (avatarUrl) {
                        vipBtnIcon.innerHTML = `<img src="${avatarUrl}" class="vip-user-nav-avatar" alt="${escapeHtml(username)}">`;
                    } else {
                        vipBtnIcon.innerHTML = `<div class="vip-user-nav-avatar-placeholder">${escapeHtml(username.charAt(0).toUpperCase())}</div>`;
                    }
                }
                vipNavBtn.title = username;
            }
            if (vipActivePanel) vipActivePanel.style.display = "block";
            if (vipInactivePanel) vipInactivePanel.style.display = "none";

            if (vipUserName) vipUserName.textContent = username;

            if (vipUserAvatar) {
                if (avatarUrl) {
                    vipUserAvatar.innerHTML = `<img src="${avatarUrl}" alt="${escapeHtml(username)}">`;
                } else {
                    vipUserAvatar.textContent = "👤";
                }
            }

            if (vipExpiryText) {
                if (vip.expiresAt && Number(vip.expiresAt) > 0) {
                    const daysLeft = Math.max(1, Math.ceil((Number(vip.expiresAt) - Date.now()) / (24 * 60 * 60 * 1000)));
                    vipExpiryText.innerHTML = `✨ สถานะ: <strong>VIP (${daysLeft} วัน)</strong>`;
                } else {
                    vipExpiryText.innerHTML = '✨ สถานะ: <strong>ตลอดชีพ (ไม่มีวันหมดอายุ)</strong>';
                }
            }

            // Immediately close and suppress gate overlay if visible
            hideGateOverlay(false);
        } else {
            if (vipNavBtn) {
                vipNavBtn.classList.remove("is-active");
                if (vipNavText) vipNavText.textContent = "Login";
                if (vipBtnIcon) vipBtnIcon.innerHTML = `<i data-lucide="log-in" style="width: 14px; height: 14px;"></i>`;
                if (typeof refreshIcons === "function") refreshIcons();
            }
            if (vipActivePanel) vipActivePanel.style.display = "none";
            if (vipInactivePanel) vipInactivePanel.style.display = "block";
        }
    }

    async function checkUrlForVipToken() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get("vip_token") || urlParams.get("vip_code");
            const oauthSuccess = urlParams.get("vip_success");
            const oauthError = urlParams.get("vip_error");

            if (token) {
                const res = await fetch("/api/verify-vip", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token })
                }).catch(() => null);

                if (res && res.ok) {
                    const data = await res.json();
                    if (data.valid) {
                        saveVipSession(token, data.user, data.expiresAt);
                        showToast(`👑 ยินดีต้อนรับ VIP ${data.user ? (data.user.global_name || data.user.username) : ""}! ปลดล็อคระบบไร้โฆษณาเรียบร้อย`);
                        urlParams.delete("vip_token");
                        urlParams.delete("vip_code");
                        const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "") + window.location.hash;
                        window.history.replaceState({}, document.title, newUrl);
                        return;
                    } else {
                        showToast(data.message || "รหัส VIP ไม่ถูกต้องหรือหมดอายุแล้ว", "error");
                    }
                }
            }

            if (oauthSuccess === "true") {
                urlParams.delete("vip_success");
                const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "") + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
                showToast("👑 ยืนยันสิทธิ์ VIP ผ่าน Discord สำเร็จ! เพลิดเพลินกับเว็บไร้โฆษณา");
            } else if (oauthError) {
                const checkedUser = urlParams.get("user") || "";
                let msg = "ไม่สามารถยืนยันยศ VIP ได้";
                if (oauthError === "no_role") msg = `❌ บัญชี ${checkedUser ? '(' + checkedUser + ') ' : ''}ยังไม่มียศ VIP ในเซิร์ฟเวอร์ Discord`;
                else if (oauthError === "not_in_guild") msg = "❌ คุณยังไม่ได้เข้าร่วม Discord เซิร์ฟเวอร์ของเรา";
                urlParams.delete("vip_error");
                urlParams.delete("user");
                const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "") + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
                showToast(msg, "error");
            }
        } catch (e) {
            console.warn("[VIP] checkUrlForVipToken error:", e);
        }
    }

    function initVipSystem() {
        updateVipUI();

        const vipNavBtn = document.getElementById("vipNavBtn");
        const vipModalOverlay = document.getElementById("vipModalOverlay");
        const vipModalCloseBtn = document.getElementById("vipModalCloseBtn");
        const vipLogoutBtn = document.getElementById("vipLogoutBtn");

        function openVipModal() {
            updateVipUI();
            if (vipModalOverlay) {
                vipModalOverlay.style.display = "flex";
                refreshIcons();
            }
        }

        function closeVipModal() {
            if (vipModalOverlay) {
                vipModalOverlay.style.display = "none";
            }
        }

        if (vipNavBtn) {
            vipNavBtn.addEventListener("click", () => {
                if (isVipMember()) {
                    openVipModal();
                } else {
                    // Not VIP: Direct 1-Click to Discord OAuth2 login screen (like Maru Hub)
                    window.location.href = "/api/discord-auth?action=login";
                }
            });
        }

        if (vipModalCloseBtn) vipModalCloseBtn.addEventListener("click", closeVipModal);

        if (vipModalOverlay) {
            vipModalOverlay.addEventListener("click", (e) => {
                if (e.target === vipModalOverlay) closeVipModal();
            });
        }

        if (vipLogoutBtn) {
            vipLogoutBtn.addEventListener("click", () => {
                if (confirm("ต้องการออกจากระบบ VIP บนเครื่องนี้ใช่หรือไม่?")) {
                    clearVipSession();
                    closeVipModal();
                    showToast("ออกจากระบบ VIP บนเครื่องนี้เรียบร้อยแล้ว");
                    checkLootlabsGate();
                }
            });
        }
    }

    // Helper: ตรวจสอบว่าเครื่องนี้มีสิทธิ์ผ่าน LootLabs หรือยัง
    function isGateAuthorized() {
        if (isVipMember()) return true;
        const gate = SITE_CONFIG.lootlabsGate;
        if (!gate || !gate.enabled) return true;
        const savedExpiry = localStorage.getItem("blacklist_lootlabs_auth_expiry");
        if (savedExpiry && Date.now() < Number(savedExpiry)) return true;
        if (sessionStorage.getItem("blacklist_lootlabs_auth") === "true") return true;
        return false;
    }

    // Helper: ตรวจสอบสถานะการยืนยัน Postback จากเซิร์ฟเวอร์
    async function verifyLootlabsSession(silent = false) {
        const puid = localStorage.getItem("blacklist_lootlabs_puid") || "";
        const gate = SITE_CONFIG.lootlabsGate || {};
        const durationHours = Number(gate.expiryHours || 24);

        try {
            // 1. ตรวจสอบผ่าน Endpoint /api/check-session (รองรับทั้ง puid และ IP)
            const queryParam = puid ? `?puid=${encodeURIComponent(puid)}` : "";
            let res = await fetch(`/api/check-session${queryParam}`).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                if (data.verified) {
                    const expiryTimestamp = Date.now() + (durationHours * 60 * 60 * 1000);
                    localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
                    sessionStorage.setItem("blacklist_lootlabs_auth", "true");
                    localStorage.setItem("blacklist_lootlabs_unlocked_event", String(Date.now()));
                    localStorage.removeItem("blacklist_lootlabs_puid");

                    if (gateAutoDetectBox) {
                        gateAutoDetectBox.style.display = "flex";
                        gateAutoDetectBox.innerHTML = '<i data-lucide="check-circle" style="color: #4ade80; width: 16px; height: 16px;"></i> <span style="color: #4ade80; font-weight: 600;">ปลดล็อคสำเร็จ! กำลังเปิดหน้าเว็บ...</span>';
                        refreshIcons();
                    }

                    setTimeout(() => {
                        hideGateOverlay(true);
                    }, 500);
                    return true;
                }
            }

            // 2. ตรวจสอบสำรองตรงไปยัง Firebase Firestore
            if (puid) {
                const fbUrl = `https://firestore.googleapis.com/v1/projects/blacklistscripts/databases/(default)/documents/lootlabs_sessions/${encodeURIComponent(puid)}?key=AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI`;
                const fbRes = await fetch(fbUrl).catch(() => null);
                if (fbRes && fbRes.ok) {
                    const data = await fbRes.json();
                    if (data.fields && data.fields.verified && data.fields.verified.booleanValue === true) {
                        const expiryTimestamp = Date.now() + (durationHours * 60 * 60 * 1000);
                        localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
                        sessionStorage.setItem("blacklist_lootlabs_auth", "true");
                        localStorage.setItem("blacklist_lootlabs_unlocked_event", String(Date.now()));
                        localStorage.removeItem("blacklist_lootlabs_puid");

                        if (gateAutoDetectBox) {
                            gateAutoDetectBox.style.display = "flex";
                            gateAutoDetectBox.innerHTML = '<i data-lucide="check-circle" style="color: #4ade80; width: 16px; height: 16px;"></i> <span style="color: #4ade80; font-weight: 600;">ปลดล็อคสำเร็จ! กำลังเปิดหน้าเว็บ...</span>';
                            refreshIcons();
                        }

                        setTimeout(() => {
                            hideGateOverlay(true);
                        }, 500);
                        return true;
                    }
                }
            }
        } catch (err) {
            console.warn("Session check notice:", err);
        }

        if (!silent) {
            showToast("ยังไม่พบการยืนยันจาก LootLabs กรุณาทำภารกิจให้ครบ");
        }
        return false;
    }

    // =========================================================================
    // Real-time Anti-Bypass Logger & Discord Alert Sender
    // =========================================================================
    let pageReadyForTamperCheck = false;
    let isInternalGateChange = false;
    let isGateActivelyEnforced = false;
    let lastBypassReport = 0;

    // Grace period on initial load: do not report bypass attempts during initial 4 seconds of page loading
    setTimeout(() => {
        pageReadyForTamperCheck = true;
    }, 4000);

    function reportBypassAttempt(reason, details = "") {
        if (!pageReadyForTamperCheck) return; // Prevent any false positives during initial boot & CSS animations
        const now = Date.now();
        if (now - lastBypassReport < 25000) return; // 25s debounce
        lastBypassReport = now;

        const payload = {
            reason: reason,
            details: details,
            referrer: document.referrer || "Direct / None",
            userAgent: navigator.userAgent || ""
        };

        fetch("/api/log-bypass", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(() => {
            setTimeout(checkBanStatus, 2000);
        }).catch(err => console.warn("[Anti-Bypass] Report notice:", err.message));
    }

    // =========================================================================
    // Ban Enforcement & Real-time Countdown System
    // =========================================================================
    function showBannedScreen(banData) {
        isCurrentlyBanned = true;
        isGateActivelyEnforced = false;
        isInternalGateChange = true;
        if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
        stopGatePolling();

        if (bannedScreenOverlay) {
            bannedScreenOverlay.style.display = "flex";
        }
        setTimeout(() => { isInternalGateChange = false; }, 300);
        if (bannedReasonText && banData.reason) {
            bannedReasonText.textContent = banData.reason;
        }
        if (bannedClientIp && banData.ip) {
            bannedClientIp.textContent = banData.ip;
        }
        if (bannedDurationText && banData.durationHours) {
            bannedDurationText.textContent = `${banData.durationHours} ชั่วโมง`;
        }
        if (bannedExpireTimeText && banData.bannedUntil) {
            const expDate = new Date(banData.bannedUntil);
            bannedExpireTimeText.textContent = expDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " (" + expDate.toLocaleDateString("th-TH") + ")";
        }

        refreshIcons();

        if (bannedCountdownInterval) clearInterval(bannedCountdownInterval);

        function updateCountdown() {
            const now = Date.now();
            const remaining = banData.bannedUntil - now;
            if (remaining <= 0) {
                clearInterval(bannedCountdownInterval);
                bannedCountdownInterval = null;
                checkBanStatus();
                return;
            }

            const totalSec = Math.floor(remaining / 1000);
            const hrs = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;

            if (bannedHours) bannedHours.textContent = String(hrs).padStart(2, "0");
            if (bannedMinutes) bannedMinutes.textContent = String(mins).padStart(2, "0");
            if (bannedSeconds) bannedSeconds.textContent = String(secs).padStart(2, "0");
        }

        updateCountdown();
        bannedCountdownInterval = setInterval(updateCountdown, 1000);
    }

    function hideBannedScreen() {
        isCurrentlyBanned = false;
        isInternalGateChange = true;
        if (bannedCountdownInterval) {
            clearInterval(bannedCountdownInterval);
            bannedCountdownInterval = null;
        }
        if (bannedScreenOverlay) {
            bannedScreenOverlay.style.display = "none";
        }
        setTimeout(() => { isInternalGateChange = false; }, 300);
        checkLootlabsGate();
    }

    async function checkBanStatus() {
        try {
            const res = await fetch("/api/check-ban");
            if (res.ok) {
                const data = await res.json();
                if (data && data.banned) {
                    showBannedScreen(data);
                    return true;
                } else if (isCurrentlyBanned) {
                    hideBannedScreen();
                }
            }
        } catch (e) {
            console.warn("[Anti-Bypass] Check ban notice:", e);
        }
        return false;
    }

    // =========================================================================
    // LootLabs Anti-Bypass Gate Logic (Remember device for 24 hours + Postback)
    // =========================================================================
    function checkLootlabsGate() {
        if (isCurrentlyBanned) return;

        if (isVipMember()) {
            isGateActivelyEnforced = false;
            isInternalGateChange = true;
            if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
            stopGatePolling();
            setTimeout(() => { isInternalGateChange = false; }, 200);
            return;
        }

        const gate = SITE_CONFIG.lootlabsGate;
        if (!gate || !gate.enabled) {
            isGateActivelyEnforced = false;
            isInternalGateChange = true;
            if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
            stopGatePolling();
            setTimeout(() => { isInternalGateChange = false; }, 200);
            return;
        }

        // ตรวจสอบ Referrer ดักจับพวก bypass.vip หรือเครื่องมือ Bypass (เฉพาะโดเมน bypass จริงๆ และเช็คเพียงครั้งเดียวต่อ session)
        if (document.referrer && !sessionStorage.getItem("blacklist_bypass_ref_logged")) {
            try {
                const refUrl = new URL(document.referrer);
                const host = refUrl.hostname.toLowerCase();
                const knownBypassHosts = ["bypass.vip", "thebypasser.com", "linkvertisebypasser.com", "adlinkfly.com"];
                const isBypass = knownBypassHosts.some(d => host === d || host.endsWith("." + d));
                if (isBypass) {
                    sessionStorage.setItem("blacklist_bypass_ref_logged", "true");
                    reportBypassAttempt("เปิดเว็บไซต์ผ่านเครื่องมือ Bypass อัตโนมัติ", `Referrer Host: ${host}`);
                    showToast("⚠️ ตรวจพบการเปิดผ่านเครื่องมือ Bypass กรุณาทำภารกิจผ่าน LootLabs อย่างถูกต้อง");
                }
            } catch (e) {}
        }

        const requiredToken = (gate.token || "blacklist_vip").trim().toLowerCase();
        const durationHours = Number(gate.expiryHours || 24);
        const durationMs = durationHours * 60 * 60 * 1000;

        function grantDeviceAccess() {
            const expiryTimestamp = Date.now() + durationMs;
            localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
            sessionStorage.setItem("blacklist_lootlabs_auth", "true");
            hideGateOverlay(false);
        }

        // 1. Check URL parameters (?auth= or ?token= or ?key=) - Backdoor สำหรับแอดมิน
        const urlParams = new URLSearchParams(window.location.search);

        // ทดสอบระบบ: หากใส่ ?lock=1 หรือ ?reset=1 จะรีเซ็ตเครื่องให้กลับมาล็อคเหมือนเครื่องใหม่ทันที
        if (urlParams.has("lock") || urlParams.has("reset") || urlParams.has("relock") || urlParams.has("test")) {
            localStorage.removeItem("blacklist_lootlabs_auth_expiry");
            localStorage.removeItem("blacklist_lootlabs_puid");
            localStorage.removeItem("blacklist_lootlabs_unlocked_event");
            sessionStorage.removeItem("blacklist_lootlabs_auth");
            
            // ลบสถานะการยืนยัน IP บนเซิร์ฟเวอร์ทันที เพื่อให้จำลองเป็นเครื่องใหม่ 100%
            fetch("/api/reset-device-test").catch(() => null);

            try {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            } catch (e) {}
            showToast("รีเซ็ตสถานะเป็นเครื่องใหม่ (ล็อคหน้าเว็บ) เรียบร้อยแล้ว");
        }

        const incomingToken = (urlParams.get("auth") || urlParams.get("token") || urlParams.get("key") || "").trim().toLowerCase();

        if (incomingToken && incomingToken === requiredToken) {
            const provider = gate.provider || "shrinkearn";

            // Anti-Bypass Check 1: Known Bypass Referrers
            if (document.referrer) {
                try {
                    const refUrl = new URL(document.referrer);
                    const refHost = refUrl.hostname.toLowerCase();
                    const knownBypassHosts = ["bypass.vip", "thebypasser.com", "linkvertisebypasser.com", "adlinkfly.com", "freebypass.com", "bypass-city.com"];
                    if (knownBypassHosts.some(d => refHost === d || refHost.endsWith("." + d))) {
                        reportBypassAttempt("พยายามเปิดเว็บไซต์ผ่านบริการ Bypass อัตโนมัติ", `Referrer: ${refHost}`);
                        showToast("⚠️ ตรวจพบการเปิดผ่านเครื่องมือ Bypass กรุณาผ่านลิงก์อย่างถูกต้อง");
                        try {
                            const cleanUrl = window.location.origin + window.location.pathname;
                            window.history.replaceState({}, document.title, cleanUrl);
                        } catch (e) {}
                        return;
                    }
                } catch (e) {}
            }

            // Anti-Bypass Check 2: Handshake Check & Source Verification (รองรับทั้งแท็บเดิมและเปิดแท็บใหม่)
            const clickedHandshake = (localStorage.getItem("blacklist_gate_clicked") === "true") ||
                                     (sessionStorage.getItem("blacklist_gate_clicked") === "true");
            const isManualInput = (sessionStorage.getItem("blacklist_manual_token_verify") === "true") ||
                                  (localStorage.getItem("blacklist_manual_token_verify") === "true");

            // ตรวจสอบ Referrer จาก ShrinkEarn โดยตรง
            const ref = (document.referrer || "").toLowerCase();
            const isFromShortener = ref.includes("shrinkearn") || ref.includes("srnky") || ref.includes("shrinkforearn") || ref.includes("shrink");

            // ดึงเวลาที่กดลิงก์
            const clickTime = Number(localStorage.getItem("blacklist_gate_click_time") || sessionStorage.getItem("blacklist_gate_click_time") || 0);
            const timeSinceClick = clickTime > 0 ? (Date.now() - clickTime) : 999999;
            const isRecentClick = clickTime > 0 && (timeSinceClick < 3600000); // ภายใน 1 ชั่วโมง

            // อนุญาตถ้า:
            // 1) มีประวัติการคลิกจากเว็บนี้ (localStorage หรือ sessionStorage ภายใน 1 ชั่วโมง)
            // 2) หรือ Referrer มาจาก ShrinkEarn โดยตรง
            // 3) หรือเป็นการกรอก token ด้วยตนเอง
            const isAuthorizedSource = isRecentClick || clickedHandshake || isFromShortener || isManualInput || provider === "lootlabs";

            if (!isAuthorizedSource) {
                showToast("⚠️ กรุณากดปุ่มเพื่อรับสิทธิ์ผ่าน ShrinkEarn ก่อนเข้าใช้งาน");
                try {
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                } catch (e) {}
                return;
            }

            // Anti-Bypass Check 3: Speed Check (ดักจับบอทที่ตอบกลับเร็วเกินไป < 3 วินาที)
            if (clickTime > 0 && !isManualInput && provider !== "lootlabs") {
                const elapsedSec = (Date.now() - clickTime) / 1000;
                if (elapsedSec < 3) {
                    showToast(`⚠️ ตรวจพบความเร็วผิดปกติ (${elapsedSec.toFixed(1)}s) กรุณารอสักครู่แล้วลองใหม่`);
                    try {
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    } catch (e) {}
                    return;
                }
            }

            // ผ่านการตรวจสอบความปลอดภัยทั้งหมด!
            localStorage.removeItem("blacklist_gate_clicked");
            localStorage.removeItem("blacklist_gate_click_time");
            localStorage.removeItem("blacklist_manual_token_verify");
            sessionStorage.removeItem("blacklist_gate_clicked");
            sessionStorage.removeItem("blacklist_gate_click_time");
            sessionStorage.removeItem("blacklist_manual_token_verify");
            grantDeviceAccess();
            try {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            } catch (e) {}
            showToast("🎉 ยืนยันสิทธิ์สำเร็จ! ปลดล็อคการเข้าใช้งาน 24 ชั่วโมง");
            return;
        }

        // 2. Check 24-Hour Device Remember in localStorage
        const savedExpiry = localStorage.getItem("blacklist_lootlabs_auth_expiry");
        if (savedExpiry) {
            const expTime = Number(savedExpiry);
            if (!isNaN(expTime) && Date.now() < expTime) {
                // Device is within 24-hour validity window!
                isGateActivelyEnforced = false;
                isInternalGateChange = true;
                if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
                stopGatePolling();
                setTimeout(() => { isInternalGateChange = false; }, 200);
                return;
            } else {
                // Expired after 24 hours! Remove and re-lock
                localStorage.removeItem("blacklist_lootlabs_auth_expiry");
                sessionStorage.removeItem("blacklist_lootlabs_auth");
            }
        }

        // 3. Check sessionStorage fallback
        if (sessionStorage.getItem("blacklist_lootlabs_auth") === "true") {
            isGateActivelyEnforced = false;
            isInternalGateChange = true;
            if (lootlabsGateOverlay) lootlabsGateOverlay.style.display = "none";
            stopGatePolling();
            setTimeout(() => { isInternalGateChange = false; }, 200);
            return;
        }

        // 4. Otherwise show gate overlay and setup dynamic link
        if (lootlabsGateOverlay) {
            isInternalGateChange = true;
            lootlabsGateOverlay.style.display = "flex";
            lootlabsGateOverlay.style.visibility = "visible";
            lootlabsGateOverlay.style.opacity = "1";
            setTimeout(() => {
                isInternalGateChange = false;
                if (!isGateAuthorized() && !isCurrentlyBanned) {
                    isGateActivelyEnforced = true;
                }
            }, 600);

            const provider = gate.provider || "shrinkearn";
            const puid = getOrCreateLootlabsPuid();

            if (gateLootlabsBtn) {
                if (provider === "shrinkearn") {
                    const shrinkLink = (gate.shrinkearnUrl || gate.lootlabsUrl || "").trim();
                    gateLootlabsBtn.href = shrinkLink || "#";
                    if (lblGateBtn) {
                        lblGateBtn.textContent = currentLang === "th" ? "🔓 เข้าใช้งานผ่าน ShrinkEarn (รอ 10-15 วินาที)" : "Unlock via ShrinkEarn (10-15s)";
                    }
                    if (gateCheckStatusBtn) gateCheckStatusBtn.style.display = "none";
                    if (gateAutoDetectBox) gateAutoDetectBox.style.display = "none";
                } else if (provider === "lootlabs") {
                    let baseLink = (gate.lootlabsUrl || "https://loot-link.com/s?example").trim();
                    baseLink = baseLink.replace(/[?&]puid=[^&]+/, '');
                    const separator = baseLink.includes("?") ? "&" : "?";
                    gateLootlabsBtn.href = `${baseLink}${separator}puid=${encodeURIComponent(puid)}`;
                    if (lblGateBtn) {
                        lblGateBtn.textContent = currentLang === "th" ? "เข้าใช้งานผ่าน LootLabs เพื่อปลดล็อค" : "Complete LootLabs to Unlock";
                    }
                    if (gateCheckStatusBtn) gateCheckStatusBtn.style.display = "inline-flex";
                    // เริ่มระบบตรวจจับอัตโนมัติเบื้องหลัง
                    startGatePolling(false);
                    verifyLootlabsSession(true);
                } else {
                    const customLink = (gate.shrinkearnUrl || gate.lootlabsUrl || "").trim();
                    gateLootlabsBtn.href = customLink || "#";
                    if (lblGateBtn) {
                        lblGateBtn.textContent = currentLang === "th" ? "กดลิงก์สนับสนุนเพื่อปลดล็อค" : "Complete Link to Unlock";
                    }
                    if (gateCheckStatusBtn) gateCheckStatusBtn.style.display = "none";
                }
            }

            if (gateMessageText) {
                if (provider === "shrinkearn") {
                    gateMessageText.textContent = (gate.bypassMessage && !gate.bypassMessage.includes("LootLabs"))
                        ? gate.bypassMessage
                        : (currentLang === "th"
                            ? "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน ShrinkEarn เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
                            : "Please complete the ShrinkEarn support link to unlock access to the website");
                } else if (provider === "lootlabs") {
                    gateMessageText.textContent = (gate.bypassMessage && !gate.bypassMessage.includes("ShrinkEarn"))
                        ? gate.bypassMessage
                        : (currentLang === "th"
                            ? "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน LootLabs เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
                            : "Please complete the LootLabs support link to unlock access to the website");
                } else {
                    gateMessageText.textContent = gate.bypassMessage || "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์";
                }
            }

            const lblGateTitleEl = document.getElementById("lblGateTitle");
            if (lblGateTitleEl) {
                lblGateTitleEl.textContent = currentLang === "th" ? "ปลดล็อคเพื่อเข้าสู่เว็บไซต์" : "Access Restricted";
            }
            if (lblGateTutorial) {
                lblGateTutorial.textContent = currentLang === "th" ? "ดูคลิปสอนวิธีผ่านลิงก์ (คลิกที่นี่)" : "Watch Tutorial Guide";
            }
            if (gateTutorialYtDirectLink && gate.tutorialVideoUrl) {
                gateTutorialYtDirectLink.href = gate.tutorialVideoUrl;
            }
            refreshIcons();
        }
    }

    // เมื่อคลิกปุ่มเปิดลิงก์สร้างรายได้ บันทึก Handshake + Timestamp ป้องกัน Bypass
    if (gateLootlabsBtn) {
        gateLootlabsBtn.addEventListener("click", () => {
            const gate = SITE_CONFIG.lootlabsGate || {};
            const provider = gate.provider || "shrinkearn";

            // 1. บันทึก Session & LocalStorage Handshake และเวลาที่คลิก สำหรับป้องกัน Bypass
            localStorage.setItem("blacklist_gate_clicked", "true");
            localStorage.setItem("blacklist_gate_click_time", String(Date.now()));
            localStorage.setItem("blacklist_gate_provider", provider);
            sessionStorage.setItem("blacklist_gate_clicked", "true");
            sessionStorage.setItem("blacklist_gate_click_time", String(Date.now()));
            sessionStorage.setItem("blacklist_gate_provider", provider);

            if (provider === "lootlabs") {
                if (gateAutoDetectBox) {
                    gateAutoDetectBox.style.display = "flex";
                    if (gateAutoDetectText) {
                        const t = I18N[currentLang] || I18N.en;
                        gateAutoDetectText.textContent = t.gateDetect || "Waiting for completion... (Unlocks automatically when finished)";
                    }
                }
                startGatePolling(true);
            }
        });
    }

    // ซิงก์สถานะปลดล็อคข้ามแท็บอัตโนมัติ (หากผู้ใช้เปิดหลายแท็บ เมื่อแท็บหนึ่งปลดล็อคแล้ว แท็บอื่นจะหายทันที)
    window.addEventListener("storage", (e) => {
        if (e.key === "blacklist_lootlabs_auth_expiry" || e.key === "blacklist_lootlabs_auth") {
            if (isGateAuthorized()) {
                hideGateOverlay(true);
            }
        }
    });

    window.addEventListener("focus", () => {
        if (isGateAuthorized()) {
            hideGateOverlay(false);
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            if (isGateAuthorized()) {
                hideGateOverlay(false);
            }
        }
    });

    // Helper: ดึง YouTube Embed URL พร้อม No-Cookie
    function getYouTubeEmbedUrl(url) {
        if (!url) return "https://www.youtube-nocookie.com/embed/FdXsvivWhOw?autoplay=1&rel=0";
        try {
            let videoId = "";
            if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1].split(/[?&]/)[0];
            } else if (url.includes("youtube.com/watch")) {
                const u = new URL(url);
                videoId = u.searchParams.get("v");
            } else if (url.includes("youtube.com/embed/")) {
                videoId = url.split("youtube.com/embed/")[1].split(/[?&]/)[0];
            }
            if (videoId) {
                return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
            }
        } catch (e) {}
        return url;
    }

    // สลับเปิด/ปิดคลิปสอนวิธีผ่านลิงก์ใน Gate Modal
    if (btnToggleGateTutorial) {
        btnToggleGateTutorial.addEventListener("click", () => {
            const isHidden = !gateTutorialPlayerBox || gateTutorialPlayerBox.style.display === "none";
            const gate = SITE_CONFIG.lootlabsGate || {};
            const ytUrl = gate.tutorialVideoUrl || "https://youtu.be/FdXsvivWhOw";

            if (isHidden) {
                if (gateTutorialIframe) {
                    gateTutorialIframe.src = getYouTubeEmbedUrl(ytUrl);
                }
                if (gateTutorialYtDirectLink) {
                    gateTutorialYtDirectLink.href = ytUrl;
                }
                if (gateTutorialPlayerBox) {
                    gateTutorialPlayerBox.style.display = "block";
                }
                if (gateTutorialChevron) {
                    gateTutorialChevron.style.transform = "rotate(180deg)";
                }
                if (lblGateTutorial) {
                    lblGateTutorial.textContent = currentLang === "th" ? "ซ่อนคลิปสอนวิธีผ่าน" : "Hide Tutorial";
                }
            } else {
                if (gateTutorialIframe) {
                    gateTutorialIframe.src = "";
                }
                if (gateTutorialPlayerBox) {
                    gateTutorialPlayerBox.style.display = "none";
                }
                if (gateTutorialChevron) {
                    gateTutorialChevron.style.transform = "rotate(0deg)";
                }
                if (lblGateTutorial) {
                    lblGateTutorial.textContent = currentLang === "th" ? "ดูคลิปสอนวิธีผ่านลิงก์ (คลิกที่นี่)" : "Watch Tutorial Guide";
                }
            }
        });
    }

    if (gateTokenSubmitBtn && gateTokenInput) {
        const verifyManualToken = async () => {
            const inputVal = gateTokenInput.value.trim().toLowerCase();
            if (!inputVal) return;

            const gate = SITE_CONFIG.lootlabsGate || {};
            const required = (gate.token || "blacklist_vip").trim().toLowerCase();
            const durationHours = Number(gate.expiryHours || 24);

            // 1. ตรวจสอบกับ token ในหน่วยความจำทันที (เร็วที่สุด)
            if (inputVal === required) {
                const expiryTimestamp = Date.now() + (durationHours * 60 * 60 * 1000);
                localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
                sessionStorage.setItem("blacklist_lootlabs_auth", "true");
                hideGateOverlay(true);
                return;
            }

            // 2. หากไม่ตรง ให้ลองดึงคีย์ล่าสุดจาก Firebase / Server มาตรวจสอบทันที (ป้องกันกรณีแอดมินเพิ่งแก้ หรือเครื่องยังไม่ได้ซิงก์)
            const originalBtnHtml = gateTokenSubmitBtn.innerHTML;
            gateTokenSubmitBtn.disabled = true;
            gateTokenSubmitBtn.innerHTML = `<span>${currentLang === 'th' ? "กำลังตรวจสอบ..." : "Verifying..."}</span>`;

            try {
                let latestConfig = null;
                if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
                    latestConfig = await window.FirebaseDB.getConfig().catch(() => null);
                }
                if (!latestConfig) {
                    const res = await fetch("/api/config").catch(() => null);
                    if (res && res.ok) latestConfig = await res.json().catch(() => null);
                }

                if (latestConfig) {
                    if (window.mergeSiteConfig) window.mergeSiteConfig(latestConfig);
                    else Object.assign(SITE_CONFIG, latestConfig);
                    localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));

                    const refreshedGate = SITE_CONFIG.lootlabsGate || {};
                    const refreshedRequired = (refreshedGate.token || "blacklist_vip").trim().toLowerCase();
                    const refreshedHours = Number(refreshedGate.expiryHours || 24);

                    if (inputVal === refreshedRequired) {
                        const expiryTimestamp = Date.now() + (refreshedHours * 60 * 60 * 1000);
                        localStorage.setItem("blacklist_lootlabs_auth_expiry", String(expiryTimestamp));
                        sessionStorage.setItem("blacklist_lootlabs_auth", "true");
                        hideGateOverlay(true);
                        return;
                    }
                }
            } catch (liveErr) {
                console.warn("Live token verification notice:", liveErr);
            } finally {
                gateTokenSubmitBtn.disabled = false;
                gateTokenSubmitBtn.innerHTML = originalBtnHtml;
                if (window.lucide && lucide.createIcons) lucide.createIcons();
            }

            // 3. แสดงข้อความแจ้งเตือนเมื่อไม่ถูกต้องจริงๆ
            if (gateErrorMsg) {
                gateErrorMsg.style.display = "block";
                setTimeout(() => { if (gateErrorMsg) gateErrorMsg.style.display = "none"; }, 3000);
            }
        };

        gateTokenSubmitBtn.addEventListener("click", verifyManualToken);
        gateTokenInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") verifyManualToken();
        });
    }

    // ปุ่มกดตรวจสถานะการทำภารกิจ LootLabs ด้วยตนเอง
    if (gateCheckStatusBtn) {
        gateCheckStatusBtn.addEventListener("click", () => {
            const icon = gateCheckStatusBtn.querySelector("i");
            if (icon) icon.style.animation = "spin 0.8s linear infinite";
            verifyLootlabsSession(false).finally(() => {
                if (icon) icon.style.animation = "";
            });
        });
    }

    // ตรวจสอบอัตโนมัติเมื่อผู้ใช้สลับแท็บกลับมาจากหน้า LootLabs
    window.addEventListener("focus", () => {
        if (lootlabsGateOverlay && lootlabsGateOverlay.style.display !== "none") {
            verifyLootlabsSession(true);
        }
    });

    // ซิงก์การปลดล็อคข้ามแท็บอัตโนมัติ (ถ้าแท็บอื่นปลดล็อคแล้ว แท็บนี้จะหายไปทันที)
    window.addEventListener("storage", (e) => {
        if (e.key === "blacklist_lootlabs_auth_expiry" || e.key === "blacklist_lootlabs_unlocked_event") {
            hideGateOverlay(false);
        }
    });

    // Global Helper สำหรับทดสอบระบบ: ล้างการจำเครื่องและล็อคหน้าเว็บใหม่ทันที
    window.resetDeviceLock = async function() {
        localStorage.removeItem("blacklist_lootlabs_auth_expiry");
        localStorage.removeItem("blacklist_lootlabs_puid");
        localStorage.removeItem("blacklist_lootlabs_unlocked_event");
        sessionStorage.removeItem("blacklist_lootlabs_auth");
        await fetch("/api/reset-device-test").catch(() => null);
        window.location.href = window.location.origin + window.location.pathname + "?lock=1";
    };

    // ป้องกันการแอบ Inspect Element / DevTools ปิด Modal หน้าเว็บ
    if (window.MutationObserver) {
        if (lootlabsGateOverlay) {
            const tamperObserver = new MutationObserver(() => {
                if (!pageReadyForTamperCheck || isInternalGateChange || !isGateActivelyEnforced) return;
                if (isGateAuthorized() || isCurrentlyBanned) return;

                const style = window.getComputedStyle(lootlabsGateOverlay);
                const isHidden = lootlabsGateOverlay.style.display === "none" ||
                                 style.display === "none" ||
                                 style.visibility === "hidden" ||
                                 lootlabsGateOverlay.hidden;

                if (isHidden || lootlabsGateOverlay.style.opacity === "0") {
                    isInternalGateChange = true;
                    lootlabsGateOverlay.style.display = "flex";
                    lootlabsGateOverlay.style.visibility = "visible";
                    lootlabsGateOverlay.style.opacity = "1";
                    lootlabsGateOverlay.hidden = false;
                    setTimeout(() => { isInternalGateChange = false; }, 300);

                    reportBypassAttempt("พยายามลบ/ซ่อนกล่อง LootLabs Gate ผ่าน DevTools", "ตรวจพบการซ่อน #lootlabsGateOverlay");
                    showToast("⚠️ ตรวจพบการพยายามบายพาส! ระบบทำการล็อคหน้าเว็บและส่งบันทึก");
                }
            });
            tamperObserver.observe(lootlabsGateOverlay, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
        }

        if (bannedScreenOverlay) {
            const banTamperObserver = new MutationObserver(() => {
                if (!pageReadyForTamperCheck || isInternalGateChange || !isCurrentlyBanned) return;

                const style = window.getComputedStyle(bannedScreenOverlay);
                const isHidden = bannedScreenOverlay.style.display === "none" ||
                                 style.display === "none" ||
                                 style.visibility === "hidden" ||
                                 bannedScreenOverlay.hidden;

                if (isHidden || bannedScreenOverlay.style.opacity === "0") {
                    isInternalGateChange = true;
                    bannedScreenOverlay.style.display = "flex";
                    bannedScreenOverlay.style.visibility = "visible";
                    bannedScreenOverlay.style.opacity = "1";
                    bannedScreenOverlay.hidden = false;
                    setTimeout(() => { isInternalGateChange = false; }, 300);

                    reportBypassAttempt("พยายามลบ/ซ่อนหน้าต่าง Banned Screen ผ่าน DevTools", "ตรวจพบการซ่อน #bannedScreenOverlay");
                }
            });
            banTamperObserver.observe(bannedScreenOverlay, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
        }
    }

    // แผนผังไอคอนของเกมยอดนิยม
    const GAME_ICONS = {
        'bloxfruits': 'sword',
        'blox fruits': 'sword',
        'fisch': 'fish',
        'stealanegg': 'egg',
        'steal an egg': 'egg',
        'bladeball': 'shield',
        'blade ball': 'shield',
        'petsim99': 'sparkles',
        'pet simulator 99': 'sparkles',
        'animedefenders': 'gem',
        'anime defenders': 'gem',
        'rivals': 'crosshair',
        'doors': 'door-closed',
        'bedwars': 'bed',
        'arsenal': 'crosshair',
        'kinglegacy': 'crown',
        'king legacy': 'crown',
        'brookhaven': 'home',
        'dahood': 'crosshair',
        'da hood': 'crosshair',
        'murdermystery2': 'skull',
        'murder mystery 2': 'skull',
        'mm2': 'skull',
        'animevanguards': 'shield-alert',
        'anime vanguards': 'shield-alert',
        'slapbattles': 'hand',
        'slap battles': 'hand'
    };

    function getGameIcon(category = '', gameName = '') {
        const normCat = category.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normGame = gameName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return GAME_ICONS[normCat] || GAME_ICONS[normGame] || GAME_ICONS[category.toLowerCase()] || GAME_ICONS[gameName.toLowerCase()] || 'gamepad-2';
    }

    function updateCategoryBadges() {
        if (totalCount) totalCount.textContent = scripts.length;
        if (!gameMenu) return;

        // ดึงหมวดหมู่เกมที่มีอยู่จริงจากสคริปต์ (เฉพาะเกมที่มีสคริปต์อย่างน้อย 1 รายการ)
        const gameMap = new Map();
        scripts.forEach(s => {
            const catKey = (s.category || '').toLowerCase().trim() || (s.game || '').toLowerCase().trim();
            if (!catKey) return;
            if (!gameMap.has(catKey)) {
                gameMap.set(catKey, {
                    category: catKey,
                    gameName: s.game || s.category || catKey,
                    count: 0
                });
            }
            gameMap.get(catKey).count++;
        });

        if (gameMap.size === 0) {
            gameMenu.innerHTML = `
                <li style="padding: 10px 16px; font-size: 12px; color: var(--text-muted); list-style: none;">
                    ยังไม่มีหมวดหมู่เกม
                </li>
            `;
            return;
        }

        // เรียงลำดับตามจำนวนสคริปต์จากมากไปน้อย
        const sortedGames = Array.from(gameMap.values()).sort((a, b) => b.count - a.count);

        let html = '';
        sortedGames.forEach(item => {
            const icon = getGameIcon(item.category, item.gameName);
            const isActive = activeGame && (activeGame.toLowerCase() === item.category.toLowerCase());
            html += `
                <li class="menu-item ${isActive ? 'active' : ''}" data-nav="feed" data-game="${escapeHtml(item.category)}">
                    <div class="menu-left"><i data-lucide="${icon}"></i> ${escapeHtml(item.gameName)}</div>
                    <span class="menu-badge">${item.count}</span>
                </li>
            `;
        });

        gameMenu.innerHTML = html;
        refreshIcons();
    }

    async function syncDataFromServer() {
        try {
            // 1. Top Priority: Firebase Cloud Firestore (50,000 Reads/วัน ฟรีตลอดชีพ)
            if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
                try {
                    const [fbScripts, fbConfig] = await Promise.all([
                        window.FirebaseDB.getScripts(),
                        window.FirebaseDB.getConfig().catch(() => null)
                    ]);
                    if (fbConfig) {
                        if (window.mergeSiteConfig) window.mergeSiteConfig(fbConfig);
                        else Object.assign(SITE_CONFIG, fbConfig);
                        localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));
                        applySiteConfig();
                        checkLootlabsGate();
                    }
                    if (Array.isArray(fbScripts) && fbScripts.length > 0) {
                        scripts = fbScripts;
                        renderHomeRecent();
                        if (currentView === "feed") renderFeed();
                        updateCategoryBadges();
                        return;
                    }
                } catch (fbErr) {
                    console.warn("Firebase fetch notice:", fbErr);
                }
            }

            // 2. Secondary Priority: JSONBin.io Cloud Database with Smart Caching (ประหยัดโควตา Request ไม่ให้หมดไว)
            if (SITE_CONFIG.cloudDb && SITE_CONFIG.cloudDb.enabled && SITE_CONFIG.cloudDb.binId) {
                const CACHE_KEY = "nova_scripts_db";
                const TIME_KEY = "nova_scripts_cache_time";
                const CACHE_DURATION_MS = 60 * 1000; // แคชไว้ 60 วินาทีต่อผู้ใช้
                const cachedTime = parseInt(sessionStorage.getItem(TIME_KEY) || "0", 10);
                const hasCache = localStorage.getItem(CACHE_KEY);

                if (hasCache && (Date.now() - cachedTime < CACHE_DURATION_MS)) {
                    try {
                        const parsed = JSON.parse(hasCache);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            scripts = parsed;
                            renderHomeRecent();
                            if (currentView === "feed") renderFeed();
                            updateCategoryBadges();
                            return;
                        }
                    } catch (e) {}
                }

                try {
                    const binRes = await fetch(`https://api.jsonbin.io/v3/b/${SITE_CONFIG.cloudDb.binId}/latest?meta=false`);
                    if (binRes.ok) {
                        const binData = await binRes.json();
                        const remoteScripts = Array.isArray(binData) ? binData : (binData.scripts || []);
                        scripts = remoteScripts;
                        localStorage.setItem(CACHE_KEY, JSON.stringify(scripts));
                        sessionStorage.setItem(TIME_KEY, Date.now().toString());
                        renderHomeRecent();
                        if (currentView === "feed") renderFeed();
                        updateCategoryBadges();
                        return;
                    }
                } catch (cloudErr) {
                    console.warn("Cloud DB fetch notice:", cloudErr);
                }
            }

            // 2. Fallback to local server / static file
            let [cfgRes, scpRes] = await Promise.all([
                fetch('/api/config').catch(() => null),
                fetch('/api/scripts').catch(() => null)
            ]);

            // Fallback for static hosting (e.g. GitHub Pages or Vercel)
            if (!cfgRes || !cfgRes.ok) {
                cfgRes = await fetch('data/config.json').catch(() => null);
            }
            if (!scpRes || !scpRes.ok) {
                if (localStorage.getItem("nova_scripts_db") === null) {
                    scpRes = await fetch('data/scripts.json').catch(() => null);
                }
            }

            if (cfgRes && cfgRes.ok) {
                const cfg = await cfgRes.json();
                if (window.mergeSiteConfig) window.mergeSiteConfig(cfg);
                else Object.assign(SITE_CONFIG, cfg);
                localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));
                applySiteConfig();
                checkLootlabsGate();
            }

            if (scpRes && scpRes.ok) {
                const scp = await scpRes.json();
                if (Array.isArray(scp)) {
                    const isFromApi = scpRes.url && scpRes.url.includes('/api/scripts');
                    if (isFromApi || localStorage.getItem("nova_scripts_db") === null) {
                        scripts = scp;
                        localStorage.setItem("nova_scripts_db", JSON.stringify(scripts));
                        renderHomeRecent();
                        if (currentView === "feed") renderFeed();
                        updateCategoryBadges();
                    }
                }
            }
        } catch (err) {
            console.warn("Server sync notice:", err);
        }
    }

    // Listen for storage events (e.g. from admin tab)
    window.addEventListener("storage", (e) => {
        if (e.key === "nova_site_config") {
            try {
                const parsedConfig = JSON.parse(e.newValue);
                if (window.mergeSiteConfig) window.mergeSiteConfig(parsedConfig);
                else Object.assign(SITE_CONFIG, parsedConfig);
                applySiteConfig();
                checkLootlabsGate();
            } catch (err) {}
        }
        if (e.key === "nova_scripts_db") {
            try {
                scripts = JSON.parse(e.newValue);
                renderHomeRecent();
                if (currentView === "feed") renderFeed();
                updateCategoryBadges();
            } catch (err) {}
        }
    });

    // =========================================================================
    // View Switcher
    // =========================================================================
    function switchView(viewName) {
        currentView = viewName;

        if (viewName === "home") {
            homeView.style.display = "flex";
            feedView.style.display = "none";
            if (exploitsView) exploitsView.style.display = "none";
            highlightSidebarItem("home");
            renderHomeRecent();
            renderHomeExecutors();
        } else if (viewName === "exploits") {
            homeView.style.display = "none";
            feedView.style.display = "none";
            if (exploitsView) exploitsView.style.display = "block";
            highlightSidebarItem("exploits");
            renderExploits();
        } else {
            homeView.style.display = "none";
            feedView.style.display = "block";
            if (exploitsView) exploitsView.style.display = "none";
            renderFeed();
        }

        if (mobileBottomNav) {
            mobileBottomNav.querySelectorAll(".bottom-nav-item").forEach(btn => {
                btn.classList.remove("active");
                if (btn.dataset.nav === viewName) {
                    btn.classList.add("active");
                }
            });
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        refreshIcons();
    }

    function highlightSidebarItem(type, val = null) {
        mainMenu.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
        gameMenu.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));

        if (type === "home") {
            const homeItem = mainMenu.querySelector('[data-nav="home"]');
            if (homeItem) homeItem.classList.add("active");
        } else if (type === "exploits") {
            const expItem = mainMenu.querySelector('[data-nav="exploits"]');
            if (expItem) expItem.classList.add("active");
        } else if (type === "filter") {
            const filterItem = mainMenu.querySelector(`[data-filter="${val}"]`);
            if (filterItem) filterItem.classList.add("active");
        } else if (type === "game") {
            const gameItem = gameMenu.querySelector(`[data-game="${val}"]`);
            if (gameItem) gameItem.classList.add("active");
        }
    }

    // =========================================================================
    // Auto-Translation & Bilingual Display Logic (EN / TH)
    // =========================================================================
    function autoTranslateTitle(title, gameName = "") {
        if (!title || typeof title !== "string") return title || "";
        if (!/[\u0E00-\u0E7F]/.test(title)) return title; // Already English/non-Thai

        let s = title;

        // Clean YouTube prefixes
        s = s.replace(/Roblox\s*แจกสคริปต์?\s*ฟรี!?\s*/gi, "Roblox Script - ");
        s = s.replace(/Roblox\s*แจกสคริปต์?\s*/gi, "Roblox Script - ");
        s = s.replace(/แจกสคริปต์?\s*ฟรี!?\s*/gi, "Script - ");
        s = s.replace(/แจกสคริปต์?\s*/gi, "Script - ");
        s = s.replace(/แจกสคริป\s*/gi, "Script - ");
        s = s.replace(/แจกโปร\s*/gi, "Script - ");

        // Specific combined phrases
        s = s.replace(/ไม่มีคีย์\s*พร้อมฟาร์มออโต้/gi, "Keyless & Auto Farm");
        s = s.replace(/ไม่มีคีย์\s*ออโต้ทุกอย่าง/gi, "Keyless & Auto All");
        s = s.replace(/AFK\s*24\s*ชั่วโมง\s*ชิวๆ/gi, "24/7 Easy AFK");
        s = s.replace(/AFK\s*24\s*ชั่วโมง/gi, "24/7 AFK");
        s = s.replace(/24\s*ชั่วโมง\s*ชิวๆ/gi, "24/7 Easy");
        s = s.replace(/24\s*ชั่วโมง/gi, "24/7");
        s = s.replace(/24\s*ชม\.?/gi, "24/7");

        // Keys
        s = s.replace(/ไม่มีคีย์/gi, "Keyless");
        s = s.replace(/ไม่ต้องใส่คีย์/gi, "Keyless");
        s = s.replace(/ไม่ต้องใช้คีย์/gi, "Keyless");
        s = s.replace(/ไร้คีย์/gi, "Keyless");

        // Features
        s = s.replace(/ฟาร์มไข่อัตโนมัติ/gi, "Auto Hatch & Farm");
        s = s.replace(/พร้อมฟาร์มออโต้/gi, "Auto Farm");
        s = s.replace(/ฟาร์มออโต้/gi, "Auto Farm");
        s = s.replace(/ฟาร์มอัตโนมัติ/gi, "Auto Farm");
        s = s.replace(/ออโต้ทุกอย่าง/gi, "Auto All");
        s = s.replace(/ฟาร์มชิวๆ/gi, "Fast & Easy Farm");
        s = s.replace(/ฟาร์มไว/gi, "Fast Farm");
        s = s.replace(/วิ่งไว/gi, "Speed Boost");
        s = s.replace(/วาป/gi, "Teleport");
        s = s.replace(/ชิวๆ/gi, "Easy");
        s = s.replace(/พร้อมฟาร์ม/gi, "Auto Farm");
        s = s.replace(/สอนใช้/gi, "Showcase");
        s = s.replace(/อัปเดตใหม่/gi, "Updated");
        s = s.replace(/อัปเดตล่าสุด/gi, "Latest");
        s = s.replace(/ฟรี!?/gi, "Free");

        // Remove leftover Thai characters
        s = s.replace(/[\u0E00-\u0E7F]+/g, "");

        // Clean up formatting & spacing
        s = s.replace(/\s*-\s*-\s*/g, " - ")
             .replace(/^\s*-\s*/, "")
             .replace(/\s*-\s*$/, "")
             .replace(/\s+/g, " ")
             .trim();

        // If gameName is given and title starts with Script - [Game], reorder cleanly to [Game] Script
        if (gameName) {
            const escapedGame = gameName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`^(?:Roblox\\s+)?Script\\s*[-:]?\\s*${escapedGame}`, "i");
            if (pattern.test(s)) {
                s = s.replace(pattern, `${gameName} Script -`);
            }
            const hasGame = new RegExp(escapedGame, "i").test(s);
            if (!hasGame) {
                s = `${gameName} Script - ${s}`;
            }
        }

        // Final clean
        s = s.replace(/\s*-\s*-\s*/g, " - ")
             .replace(/\s*-\s*$/, "")
             .replace(/\s+/g, " ")
             .trim();

        return s;
    }

    function autoTranslateDesc(desc, gameName = "") {
        if (!desc || typeof desc !== "string") return desc || "";
        if (!/[\u0E00-\u0E7F]/.test(desc)) return desc;

        let s = desc;
        s = s.replace(/สคริปต์\s*([a-zA-Z0-9\s]+)\s*อัปเดตล่าสุด\s*ฟังก์ชันครบ\s*ใช้งานง่าย\s*ปลอดภัย/gi, "$1 script - Fully featured, easy to use & 100% safe.");
        s = s.replace(/สคริปต์\s*Roblox\s*อัปเดตล่าสุด\s*ปลอดภัย\s*ปลดล็อคฟรี/gi, "Latest Roblox script, 100% safe & verified. Free unlock.");
        s = s.replace(/สคริปต์\s*Roblox\s*อัปเดตล่าสุด/gi, "Latest updated Roblox script");
        s = s.replace(/ปลอดภัย\s*ปลดล็อคฟรี/gi, "Safe & free to unlock");
        s = s.replace(/ฟังก์ชันครบ/gi, "Fully featured");
        s = s.replace(/ใช้งานง่าย/gi, "Easy to use");
        s = s.replace(/ปลอดภัย/gi, "Safe & undetected");
        s = s.replace(/อัปเดตล่าสุด/gi, "Latest update");

        return s.replace(/\s+/g, " ").trim();
    }

    function getScriptDisplay(item, lang = currentLang) {
        if (!item) return { title: "", description: "", thumbnail: "Logo.png" };
        if (lang === "th") {
            return {
                title: item.title || "",
                description: item.description || "",
                thumbnail: item.thumbnail || "Logo.png"
            };
        }

        // English mode
        const title = item.title_en || autoTranslateTitle(item.title, item.game);
        const description = item.description_en || autoTranslateDesc(item.description, item.game);
        const thumbnail = item.thumbnail_en || item.thumbnail || "Logo.png";

        return { title, description, thumbnail };
    }

    // =========================================================================
    // Scripts Feed Rendering
    // =========================================================================
    function createScriptRow(item) {
        const isLiked = localStorage.getItem("liked_script_" + item.id) === "true";
        const t = I18N[currentLang] || I18N.en;
        const display = getScriptDisplay(item, currentLang);
        return `
            <div class="script-row" data-script-id="${escapeHtml(item.id)}">
                <div class="row-left">
                    <div class="row-thumb-wrap" onclick="openLocker('${escapeHtml(item.id)}')" title="${escapeHtml(display.title)}">
                        <img class="row-thumb" src="${escapeHtml(display.thumbnail)}" alt="${escapeHtml(display.title)}" loading="lazy">
                        <div class="thumb-play-overlay">
                            <div class="thumb-play-btn">
                                <i data-lucide="play" style="width: 18px; height: 18px; fill: #fff; margin-left: 2px;"></i>
                            </div>
                        </div>
                    </div>
                    <div class="row-meta">
                        <div class="row-game-badge">
                            <i data-lucide="gamepad-2"></i> ${escapeHtml(item.game)} • ${escapeHtml(item.version || 'v1.0')}
                        </div>
                        <div class="row-title" onclick="openLocker('${escapeHtml(item.id)}')">${escapeHtml(display.title)}</div>
                        <div class="row-features">${escapeHtml(display.description)}</div>
                        <div class="row-tags">
                            <span class="tag-badge ${item.isKeyless ? 'green' : ''}">
                                ${item.isKeyless ? t.tagKeyless : t.tagHasKey}
                            </span>
                            <span class="tag-badge">${t.tagMobilePc}</span>
                            <span class="tag-badge" style="color: #4ade80;">${t.tagStatusNormal}</span>
                        </div>
                    </div>
                </div>

                <div class="row-right">
                    <div class="row-stats">
                        <div class="stat-views-badge" data-view-id="${escapeHtml(item.id)}" title="${currentLang === 'th' ? 'จำนวนการเข้าชม' : 'Total Views'}">
                            <i data-lucide="eye"></i> <span>${t.statViews(formatNumber(item.views || 0))}</span>
                        </div>
                        <div class="stat-likes-badge ${isLiked ? 'liked' : ''}" data-like-id="${escapeHtml(item.id)}" onclick="toggleScriptLike(event, '${escapeHtml(item.id)}')" title="${isLiked ? (currentLang === 'th' ? 'ยกเลิกการถูกใจ' : 'Unlike') : (currentLang === 'th' ? 'กดถูกใจสคริปต์นี้' : 'Like this script')}">
                            <i data-lucide="thumbs-up"></i> <span>${t.statLikes(formatNumber(item.likes || 0))}</span>
                        </div>
                    </div>
                    <button class="btn-get" onclick="openLocker('${escapeHtml(item.id)}')">
                        <span>${t.btnGetScript}</span>
                        <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function formatNumber(n) {
        const num = Number(n) || 0;
        return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : String(num);
    }

    // ฟังก์ชันเพิ่มยอดเข้าชมสคริปต์แบบเรียลไทม์ (Real-time View Counter)
    function incrementScriptView(id) {
        const item = scripts.find(s => String(s.id) === String(id));
        if (!item) return;

        item.views = (Number(item.views) || 0) + 1;
        const t = I18N[currentLang] || I18N.en;

        // อัปเดตตัวเลขบนหน้าจอทันทีทุกจุดที่แสดง
        document.querySelectorAll(`[data-view-id="${id}"]`).forEach(el => {
            const span = el.querySelector("span");
            if (span) span.textContent = t.statViews(formatNumber(item.views));
        });

        // บันทึกเก็บลงแคชเครื่อง
        saveScriptsData(scripts);

        // ซิงค์ยอดการดูขึ้น Firebase Cloud
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            window.FirebaseDB.incrementView(id);
        }

        // ซิงค์ยอดการดูไปที่ Server SQLite (กรณีรันบน Node.js)
        fetch('/api/scripts/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        }).catch(() => {});
    }

    // ฟังก์ชันกดถูกใจสคริปต์แบบเรียลไทม์ (Interactive Like Button)
    window.toggleScriptLike = function(event, id) {
        if (event) event.stopPropagation();
        const item = scripts.find(s => String(s.id) === String(id));
        if (!item) return;

        const isLiked = localStorage.getItem("liked_script_" + id) === "true";
        const t = I18N[currentLang] || I18N.en;
        let delta = 1;

        if (isLiked) {
            localStorage.removeItem("liked_script_" + id);
            item.likes = Math.max(0, (Number(item.likes) || 1) - 1);
            delta = -1;
            showToast(t.toastUnliked);
        } else {
            localStorage.setItem("liked_script_" + id, "true");
            item.likes = (Number(item.likes) || 0) + 1;
            delta = 1;
            showToast(t.toastLiked);
        }

        // อัปเดตไอคอนและตัวเลขถูกใจในหน้าจอทันที
        document.querySelectorAll(`[data-like-id="${id}"]`).forEach(el => {
            if (!isLiked) {
                el.classList.add("liked");
                el.setAttribute("title", currentLang === 'th' ? "ยกเลิกการถูกใจ" : "Unlike");
            } else {
                el.classList.remove("liked");
                el.setAttribute("title", currentLang === 'th' ? "กดถูกใจสคริปต์นี้" : "Like this script");
            }
            const span = el.querySelector("span");
            if (span) span.textContent = t.statLikes(formatNumber(item.likes));
        });

        // บันทึกเก็บลงแคชเครื่อง
        saveScriptsData(scripts);

        // ซิงค์ยอดถูกใจขึ้น Firebase Cloud
        if (window.FirebaseDB && window.FirebaseDB.isAvailable()) {
            window.FirebaseDB.incrementLike(id, delta);
        }

        // ซิงค์ยอดถูกใจไปที่ Server SQLite
        fetch('/api/scripts/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, delta })
        }).catch(() => {});

        refreshIcons();
    };

    function renderHomeRecent() {
        const homeSpotlight = document.querySelector(".home-spotlight");
        const spotlightTitle = document.querySelector(".spotlight-title");
        const spotlightDesc = document.querySelector(".spotlight-desc");
        const btnSpotlight = document.querySelector(".btn-spotlight");
        const t = I18N[currentLang] || I18N.en;

        if (scripts.length === 0) {
            if (homeSpotlight) homeSpotlight.style.display = "none";
            if (homeRecentScripts) {
                homeRecentScripts.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border);">
                        <i data-lucide="inbox" style="width: 32px; height: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
                        <p style="font-size: 14px; font-weight: 500;">${t.noScriptsAdmin}</p>
                    </div>
                `;
            }
            refreshIcons();
            return;
        }

        if (homeSpotlight) {
            homeSpotlight.style.display = "block";
            const top = scripts[0];
            const topDisplay = getScriptDisplay(top, currentLang);
            if (spotlightTitle) spotlightTitle.textContent = topDisplay.title;
            if (spotlightDesc) spotlightDesc.textContent = topDisplay.description || "";
            if (btnSpotlight) {
                btnSpotlight.onclick = () => openLocker(top.id);
            }
        }

        const top3 = scripts.slice(0, 3);
        if (homeRecentScripts) {
            homeRecentScripts.innerHTML = top3.map(createScriptRow).join("");
        }
        refreshIcons();
    }

    function renderFeed() {
        const filtered = scripts.filter(item => {
            if (activeGame) {
                const target = activeGame.toLowerCase().trim();
                const itemCat = (item.category || '').toLowerCase().trim();
                const itemGame = (item.game || '').toLowerCase().trim();
                if (itemCat !== target && itemGame !== target) return false;
            }
            if (activeFilter === "keyless" && !item.isKeyless) return false;
            if (activeFilter === "mobile" && !item.isMobile) return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const display = getScriptDisplay(item, currentLang);
                const mTitle = (item.title || "").toLowerCase().includes(q) || (display.title || "").toLowerCase().includes(q);
                const mGame = (item.game || "").toLowerCase().includes(q);
                const mDesc = (item.description || "").toLowerCase().includes(q) || (display.description || "").toLowerCase().includes(q);
                if (!mTitle && !mGame && !mDesc) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            const t = I18N[currentLang] || I18N.en;
            scriptsFeed.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: 10px;">
                    ${t.noScriptsFound}
                </div>
            `;
            return;
        }

        scriptsFeed.innerHTML = filtered.map(createScriptRow).join("");
        refreshIcons();
    }

    // =========================================================================
    // WEAO Exploits & sUNC Data API Integration
    // =========================================================================
    async function fetchExploits() {
        try {
            let res = await fetch("/api/exploits").catch(() => null);
            if (!res || !res.ok) {
                res = await fetch("https://weao.xyz/api/status/exploits").catch(() => null);
            }
            if (!res || !res.ok) throw new Error("Status: " + (res ? res.status : "failed"));
            const data = await res.json();
            if (Array.isArray(data)) {
                allExploits = data;
                renderHomeExecutors();
                if (currentView === "exploits") {
                    renderExploits();
                }
            }
        } catch (err) {
            console.error("Failed to load WEAO exploits:", err);
            const t = I18N[currentLang] || I18N.en;
            if (homeExecutorsGrid) {
                homeExecutorsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-muted);">
                        ${t.weaoOffline}
                    </div>
                `;
            }
            if (exploitsGrid) {
                exploitsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                        ${t.weaoOffline}
                    </div>
                `;
            }
        }
    }

    // =========================================================================
    // รายชื่อตัวรันยอดนิยมระดับท็อป (Famous / Prominent Executors Whitelist)
    // =========================================================================
    const FAMOUS_EXPLOITS_MAP = {
        "delta": { name: "Delta", priority: 1, officialUrl: "https://deltaexploits.gg/", desc: "ตัวรันมือถือยอดนิยมอันดับ 1 เสถียรสูง" },
        "codex": { name: "Codex", priority: 2, officialUrl: "https://codex.lol/", desc: "ตัวรันมือถือระดับท็อป รองรับหลายสคริปต์" },
        "solara": { name: "Solara", priority: 3, officialUrl: "https://getsolara.dev/", desc: "ตัวรัน Windows ฟรีที่นิยมที่สุด ปลอดภัย" },
        "wave": { name: "Wave", priority: 4, officialUrl: "https://getwave.gg/", desc: "ตัวรัน Windows ประสิทธิภาพสูง sUNC 100%" },
        "synapse z": { name: "Synapse Z", priority: 5, officialUrl: "https://z.synapse.do/", desc: "ตัวรัน Windows พรีเมียม ทายาท Synapse" },
        "volt": { name: "Volt", priority: 6, officialUrl: "https://voltbz.net/", desc: "ตัวรัน Windows ระดับพรีเมียม sUNC 100%" },
        "potassium": { name: "Potassium", priority: 7, officialUrl: "https://www.potassium.pro/", desc: "ตัวรัน Windows sUNC 100%" },
        "real": { name: "Real", priority: 8, officialUrl: "https://realest.gg", desc: "ตัวรัน Windows ฟรี sUNC 100%" },
        "vega x": { name: "Vega X", priority: 9, officialUrl: "https://www.vegax.gg/", desc: "ตัวรันมือถือชื่อดัง เมนูใช้งานง่าย" },
        "xeno": { name: "Xeno", priority: 10, officialUrl: "https://www.xeno.now/", desc: "ตัวรัน Windows ฟรี ฟังก์ชันครบครัน" },
        "macsploit": { name: "MacSploit", priority: 11, officialUrl: "https://www.raptor.fun/", desc: "ตัวรันสำหรับ macOS ที่ดีที่สุดและเสถียรสุด" },
        "arceus": { name: "Arceus X", priority: 12, officialUrl: "https://spdmteam.com/", desc: "ตัวรันมือถือยอดนิยมระดับตำนาน" },
        "fluxus": { name: "Fluxus", priority: 13, officialUrl: "https://fluxteam.net/", desc: "ตัวรันยอดนิยม" },
        "krnl": { name: "KRNL", priority: 14, officialUrl: "https://krnl.place/", desc: "ตัวรัน Windows ยอดนิยม" }
    };

    function getFamousInfo(exp) {
        if (!exp) return null;
        const title = (exp.title || "").toLowerCase().trim();
        for (const [key, info] of Object.entries(FAMOUS_EXPLOITS_MAP)) {
            if (key === "real") {
                if (title === "real" || title.startsWith("real ")) return info;
            } else if (title.includes(key)) {
                return info;
            }
        }
        return null;
    }

    // Render 4 top executors on Homepage (เฉพาะตัวรันยอดนิยม)
    function renderHomeExecutors() {
        if (!homeExecutorsGrid) return;
        if (allExploits.length === 0) return;
        const t = I18N[currentLang] || I18N.en;

        // ดึงเฉพาะตัวรันยอดนิยมและเรียงตามลำดับ Priority
        const famousList = allExploits.filter(exp => getFamousInfo(exp));
        famousList.sort((a, b) => {
            const pA = getFamousInfo(a)?.priority || 99;
            const pB = getFamousInfo(b)?.priority || 99;
            return pA - pB;
        });

        const topExecutors = famousList.length > 0 ? famousList.slice(0, 4) : allExploits.slice(0, 4);
        homeExecutorsGrid.innerHTML = topExecutors.map(exp => {
            const isOnline = !!exp.updateStatus;
            const statusClass = isOnline ? "status-working" : "status-outdated";
            const statusText = isOnline ? t.statusWorking : t.statusUpdating;
            const suncScore = typeof exp.suncPercentage === "number" ? `${exp.suncPercentage}%` : (typeof exp.uncPercentage === "number" ? `${exp.uncPercentage}%` : t.suncNoData);
            const platform = exp.platform || "Multi";
            const price = exp.free ? t.priceFree : (exp.cost || t.pricePaid);

            return `
                <div class="executor-card" style="cursor: pointer;" onclick="openExploitsView()">
                    <div class="executor-info">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h4>${escapeHtml(exp.title)}</h4>
                            <span class="badge-popular"><i data-lucide="star" style="width: 10px; height: 10px;"></i> ${t.badgePopular}</span>
                            <span class="exploit-status-badge ${statusClass}" style="font-size: 10px; padding: 1px 6px;">${statusText}</span>
                        </div>
                        <p style="margin-top: 4px; display: flex; gap: 8px; font-size: 11px;">
                            <span><i data-lucide="monitor" style="width: 12px; height: 12px;"></i> ${escapeHtml(platform)}</span>
                            <span><i data-lucide="tag" style="width: 12px; height: 12px;"></i> ${escapeHtml(price)}</span>
                            <span>sUNC: <strong style="color: #38bdf8;">${suncScore}</strong></span>
                        </p>
                    </div>
                    <div style="color: var(--text-muted);">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </div>
            `;
        }).join("");
        refreshIcons();
    }

    // Render full list in Exploits View (คัดกรองเฉพาะตัวรันยอดนิยมที่มีชื่อเสียง)
    function renderExploits() {
        if (!exploitsGrid) return;
        const t = I18N[currentLang] || I18N.en;

        if (allExploits.length === 0) {
            exploitsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <i data-lucide="loader-2" class="spin"></i> ${t.loadingAllExploits}
                </div>
            `;
            refreshIcons();
            return;
        }

        const filtered = allExploits.filter(exp => {
            // คัดกรองเหลือเฉพาะตัวรันที่มีชื่อเสียง
            const famous = getFamousInfo(exp);
            if (!famous) return false;

            if (activeExploitPlatform !== "all" && exp.platform && exp.platform.toLowerCase() !== activeExploitPlatform.toLowerCase()) {
                return false;
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const mTitle = (exp.title || "").toLowerCase().includes(q);
                const mPlat = (exp.platform || "").toLowerCase().includes(q);
                const mVer = (exp.version || "").toLowerCase().includes(q);
                if (!mTitle && !mPlat && !mVer) return false;
            }
            return true;
        });

        // จัดเรียงลำดับความนิยม
        filtered.sort((a, b) => {
            const pA = getFamousInfo(a)?.priority || 99;
            const pB = getFamousInfo(b)?.priority || 99;
            return pA - pB;
        });

        if (filtered.length === 0) {
            exploitsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    ${t.noExploitsFound}
                </div>
            `;
            return;
        }

        exploitsGrid.innerHTML = filtered.map(exp => {
            const isOnline = !!exp.updateStatus;
            const statusClass = isOnline ? "status-working" : "status-outdated";
            const statusText = isOnline ? t.statusWorking : t.statusUpdating;
            const isDetected = !!exp.detected;
            const suncScore = typeof exp.suncPercentage === "number" ? exp.suncPercentage : (typeof exp.uncPercentage === "number" ? exp.uncPercentage : null);
            const suncFillClass = suncScore !== null && suncScore < 70 ? "low" : (suncScore !== null && suncScore < 90 ? "medium" : "");
            const price = exp.free ? t.priceFree : (exp.cost || t.pricePaid);
            const hasSuncData = exp.sunc && exp.sunc.suncScrap && exp.sunc.suncKey;
            const famousInfo = getFamousInfo(exp);
            const officialUrl = famousInfo?.officialUrl || exp.websitelink || "#";

            return `
                <div class="exploit-card">
                    <div>
                        <div class="exploit-head">
                            <div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div class="exploit-name">${escapeHtml(exp.title)}</div>
                                    <span class="badge-popular"><i data-lucide="star" style="width: 10px; height: 10px;"></i> ${t.badgePopular}</span>
                                </div>
                                <div class="exploit-platform">
                                    <i data-lucide="monitor" style="width: 12px; height: 12px;"></i> ${escapeHtml(exp.platform || 'Multi')} • v${escapeHtml(exp.version || (currentLang === 'th' ? 'ล่าสุด' : 'Latest'))}
                                </div>
                            </div>
                            <span class="exploit-status-badge ${statusClass}">
                                <i data-lucide="${isOnline ? 'check-circle-2' : 'alert-circle'}" style="width: 12px; height: 12px;"></i> ${statusText}
                            </span>
                        </div>

                        <!-- sUNC Progress Bar -->
                        <div class="sunc-score-wrap">
                            <div class="sunc-label-row">
                                <span>sUNC Benchmark Score</span>
                                <span class="sunc-score-val">${suncScore !== null ? suncScore + '%' : t.suncNoData}</span>
                            </div>
                            <div class="sunc-bar-bg">
                                <div class="sunc-bar-fill ${suncFillClass}" style="width: ${suncScore !== null ? suncScore : 0}%;"></div>
                            </div>
                        </div>

                        <!-- Details Rows -->
                        <div class="exploit-details-row">
                            <span>${t.typePrice}</span>
                            <span style="color: #fff; font-weight: 500;">${escapeHtml(price)}</span>
                        </div>
                        <div class="exploit-details-row">
                            <span>${t.safetyStatus}</span>
                            <span style="color: ${isDetected ? '#f87171' : '#4ade80'};">
                                ${isDetected ? t.statusDetected : t.statusUndetected}
                            </span>
                        </div>
                        ${exp.updatedDate ? `
                        <div class="exploit-details-row">
                            <span>${t.lastUpdated}</span>
                            <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(exp.updatedDate)}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
                        ${officialUrl && officialUrl !== '#' ? `
                            <a href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer" class="btn-download-executor">
                                <i data-lucide="download"></i> ${t.btnDownloadOfficial}
                            </a>
                        ` : ''}
                        ${hasSuncData ? `
                            <button class="btn-view-sunc" onclick="openSuncDetails('${escapeHtml(exp.title)}', '${escapeHtml(exp.version || '')}', '${escapeHtml(exp.sunc.suncScrap)}', '${escapeHtml(exp.sunc.suncKey)}')">
                                <i data-lucide="bar-chart-2"></i> ${t.btnViewSunc}
                            </button>
                        ` : `
                            <button class="btn-view-sunc" disabled style="opacity: 0.45; cursor: not-allowed;">
                                <i data-lucide="info"></i> ${t.btnNoSunc}
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join("");
        refreshIcons();
    }

    // Open sUNC Benchmark Details Modal
    window.openSuncDetails = async function(title, version, scrap, key) {
        if (!suncModal) return;
        const t = I18N[currentLang] || I18N.en;
        suncModalTitle.textContent = typeof t.suncModalTitle === "function" ? t.suncModalTitle(title) : `${title} - sUNC Data`;
        suncVersion.textContent = version || "-";
        suncTime.textContent = "...";
        suncPassedCount.textContent = "0";
        suncFailedCount.textContent = "0";
        if (searchSuncFunc) searchSuncFunc.value = "";
        currentSuncFilter = "";
        currentSuncData = null;

        suncTestList.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                <i data-lucide="loader-2" class="spin"></i> ${t.suncDownloading}
            </div>
        `;
        refreshIcons();
        suncModal.classList.add("active");

        try {
            let res = await fetch(`/api/sunc?scrap=${encodeURIComponent(scrap)}&key=${encodeURIComponent(key)}`).catch(() => null);
            if (!res || !res.ok) {
                res = await fetch(`https://weao.xyz/api/sunc?scrap=${encodeURIComponent(scrap)}&key=${encodeURIComponent(key)}`).catch(() => null);
            }
            if (!res || !res.ok) throw new Error("Failed to load sUNC: " + (res ? res.status : "failed"));
            const data = await res.json();
            currentSuncData = data;

            suncTime.textContent = (data.timeTaken ? data.timeTaken + "s" : "-");
            const passedList = (data.tests && data.tests.passed) || [];
            const failedList = (data.tests && data.tests.failed) || [];
            suncPassedCount.textContent = passedList.length;
            suncFailedCount.textContent = failedList.length;

            renderSuncTests();
        } catch (err) {
            console.error("Error loading sUNC details:", err);
            suncTestList.innerHTML = `
                <div style="text-align: center; padding: 24px; color: #f87171;">
                    ${t.suncLoadError}
                </div>
            `;
        }
    };

    function renderSuncTests() {
        if (!currentSuncData || !currentSuncData.tests) return;
        const t = I18N[currentLang] || I18N.en;
        const passedList = currentSuncData.tests.passed || [];
        const failedList = currentSuncData.tests.failed || [];
        const q = currentSuncFilter.toLowerCase().trim();

        const filteredPassed = passedList.filter(t => !q || (t.name && t.name.toLowerCase().includes(q)) || (t.library && t.library.toLowerCase().includes(q)));
        const filteredFailed = failedList.filter(t => !q || (t.name && t.name.toLowerCase().includes(q)) || (t.library && t.library.toLowerCase().includes(q)));

        if (filteredPassed.length === 0 && filteredFailed.length === 0) {
            suncTestList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    ${typeof t.suncNotFound === "function" ? t.suncNotFound(escapeHtml(currentSuncFilter)) : 'No functions found'}
                </div>
            `;
            return;
        }

        let html = "";
        filteredFailed.forEach(item => {
            html += `
                <div class="sunc-test-item failed">
                    <div>
                        <div class="sunc-func-name" style="color: #f87171;">${escapeHtml(item.name)}</div>
                        <div class="sunc-func-lib">${escapeHtml(item.library || 'General')} • ${t.suncReason} ${escapeHtml(item.reason || 'Not supported')}</div>
                    </div>
                    <span class="exploit-status-badge status-outdated">
                        <i data-lucide="x" style="width: 12px; height: 12px;"></i> ${t.suncFailBadge}
                    </span>
                </div>
            `;
        });

        filteredPassed.forEach(item => {
            html += `
                <div class="sunc-test-item passed">
                    <div>
                        <div class="sunc-func-name">${escapeHtml(item.name)}</div>
                        <div class="sunc-func-lib">${escapeHtml(item.library || 'General')}${item.description ? ' • ' + escapeHtml(item.description) : ''}</div>
                    </div>
                    <span class="exploit-status-badge status-working">
                        <i data-lucide="check" style="width: 12px; height: 12px;"></i> ${t.suncPassBadge}
                    </span>
                </div>
            `;
        });

        suncTestList.innerHTML = html;
        refreshIcons();
    }

    window.openExploitsView = function() {
        switchView("exploits");
    };

    // sUNC Filter search listener
    if (searchSuncFunc) {
        searchSuncFunc.addEventListener("input", (e) => {
            currentSuncFilter = e.target.value;
            renderSuncTests();
        });
    }

    // Close sUNC modal
    if (closeSuncModalBtn) {
        closeSuncModalBtn.addEventListener("click", () => {
            suncModal.classList.remove("active");
        });
    }
    if (suncModal) {
        suncModal.addEventListener("click", (e) => {
            if (e.target === suncModal) suncModal.classList.remove("active");
        });
    }

    // Platform Filter for Exploits
    if (exploitPlatformFilter) {
        exploitPlatformFilter.addEventListener("click", (e) => {
            const chip = e.target.closest(".chip");
            if (!chip) return;
            exploitPlatformFilter.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeExploitPlatform = chip.dataset.plat || "all";
            renderExploits();
        });
    }

    if (btnSeeAllExploits) {
        btnSeeAllExploits.addEventListener("click", () => {
            switchView("exploits");
        });
    }

    // =========================================================================
    // Sub2Unlock Locker Logic (Ultra Modern Gaming Locker)
    // =========================================================================
    window.openLocker = function(id) {
        const t = I18N[currentLang] || I18N.en;
        if (!isGateAuthorized()) {
            showToast(t.gateAccessRestrictedToast);
            checkLootlabsGate();
            return;
        }
        if (currentTaskTimer) {
            clearInterval(currentTaskTimer);
            currentTaskTimer = null;
        }
        selectedScript = scripts.find(s => String(s.id) === String(id));
        if (!selectedScript) return;

        // Increment view count immediately
        incrementScriptView(id);

        if (isVipMember()) {
            tasks = { t1: true, t2: true, t3: true };
            scriptCodeBox.value = selectedScript.loadstring || "";
            tasksStack.style.display = "none";
            lockedLabel.style.display = "none";
            unlockedView.classList.add("show");
            lockerModal.classList.add("active");
            refreshIcons();
            showToast("👑 สมาชิก VIP: ปลดล็อคโค้ดสคริปต์ทันที!");
            return;
        }

        tasks = { t1: false, t2: false, t3: false };
        scriptCodeBox.value = selectedScript.loadstring || "";

        tasksStack.style.display = "flex";
        lockedLabel.style.display = "flex";
        unlockedView.classList.remove("show");

        resetTaskBtn(task1Btn, "01", "youtube", t.task1Name, t.task1Hint, "primary-red", true);
        resetTaskBtn(task2Btn, "02", "message-square", t.task2Name, t.task2Hint, "", false);
        resetTaskBtn(task3Btn, "03", "thumbs-up", t.task3Name, t.task3Hint, "", false);

        updateDots();
        lockerModal.classList.add("active");
        refreshIcons();
    };

    function resetTaskBtn(btn, stepNum, icon, title, hint, extraClass, isReady) {
        const t = I18N[currentLang] || I18N.en;
        btn.disabled = false;
        btn.className = `btn-task ${extraClass}`.trim();
        const statusHtml = isReady 
            ? `<span class="status-pill active-pill">${t.pillStart} <i data-lucide="arrow-right"></i></span>`
            : `<span class="status-pill wait-pill"><i data-lucide="lock"></i> ${t.pillPending}</span>`;
            
        btn.innerHTML = `
            <div class="task-left">
                <div class="task-badge">${stepNum}</div>
                <div class="task-icon-box"><i data-lucide="${icon}"></i></div>
                <div class="task-meta">
                    <span class="task-name">${title}</span>
                    <span class="task-hint">${hint}</span>
                </div>
            </div>
            <div class="task-status">
                ${statusHtml}
            </div>
        `;
    }

    function setTaskDone(btn, stepNum, title) {
        const t = I18N[currentLang] || I18N.en;
        btn.disabled = true;
        btn.className = "btn-task done";
        btn.innerHTML = `
            <div class="task-left">
                <div class="task-badge done"><i data-lucide="check"></i></div>
                <div class="task-icon-box done"><i data-lucide="check"></i></div>
                <div class="task-meta">
                    <span class="task-name">${title}</span>
                    <span class="task-hint done-hint">${t.taskDoneHint}</span>
                </div>
            </div>
            <div class="task-status">
                <span class="status-pill done-pill"><i data-lucide="check"></i> ${t.pillDone}</span>
            </div>
        `;
        refreshIcons();
    }

    function updateDots() {
        const line1 = document.getElementById("line1");
        const line2 = document.getElementById("line2");
        const lockedStatusText = document.getElementById("lockedStatusText");

        // Step 1
        if (tasks.t1) {
            dot1.className = "tracker-step done";
            if (line1) line1.className = "tracker-line done";
        } else {
            dot1.className = "tracker-step active";
            if (line1) line1.className = "tracker-line";
        }

        // Step 2
        if (tasks.t2) {
            dot2.className = "tracker-step done";
            if (line2) line2.className = "tracker-line done";
        } else if (tasks.t1) {
            dot2.className = "tracker-step active";
            if (line2) line2.className = "tracker-line";
        } else {
            dot2.className = "tracker-step";
            if (line2) line2.className = "tracker-line";
        }

        // Step 3
        if (tasks.t3) {
            dot3.className = "tracker-step done";
        } else if (tasks.t2) {
            dot3.className = "tracker-step active";
        } else {
            dot3.className = "tracker-step";
        }

        // Update Remaining Count
        if (lockedStatusText) {
            const t = I18N[currentLang] || I18N.en;
            const completedCount = (tasks.t1 ? 1 : 0) + (tasks.t2 ? 1 : 0) + (tasks.t3 ? 1 : 0);
            const remaining = 3 - completedCount;
            if (remaining > 0) {
                lockedStatusText.textContent = typeof t.lockedRemaining === "function" ? t.lockedRemaining(remaining) : `Script is locked • Complete ${remaining} more task(s) to unlock`;
            } else {
                lockedStatusText.textContent = t.lockedFinished;
            }
        }
    }

    function handleTaskClick(btn, link, waitSec, taskKey, stepNum, title, nextBtnToActivate, nextStepNum, nextIcon, nextTitle, nextHint) {
        if (tasks[taskKey]) return;
        const t = I18N[currentLang] || I18N.en;
        if (currentTaskTimer) {
            clearInterval(currentTaskTimer);
            currentTaskTimer = null;
        }
        window.open(link, "_blank");

        let sec = waitSec;
        btn.disabled = true;
        btn.className = "btn-task loading";
        btn.innerHTML = `
            <div class="task-left">
                <div class="task-badge loading">${stepNum}</div>
                <div class="task-icon-box loading"><i data-lucide="loader-2" class="spin"></i></div>
                <div class="task-meta">
                    <span class="task-name">${title}</span>
                    <span class="task-hint loading-hint">${typeof t.verifyingTask === "function" ? t.verifyingTask(sec) : `Verifying task... (${sec}s)`}</span>
                </div>
            </div>
            <div class="task-status">
                <span class="status-pill loading-pill"><i data-lucide="loader-2" class="spin"></i> ${sec}s</span>
            </div>
        `;
        refreshIcons();

        currentTaskTimer = setInterval(() => {
            sec--;
            if (sec > 0) {
                const hintEl = btn.querySelector(".task-hint");
                const pillEl = btn.querySelector(".status-pill");
                if (hintEl) hintEl.textContent = typeof t.verifyingTask === "function" ? t.verifyingTask(sec) : `Verifying task... (${sec}s)`;
                if (pillEl) pillEl.innerHTML = `<i data-lucide="loader-2" class="spin"></i> ${sec}s`;
                refreshIcons();
            } else {
                clearInterval(currentTaskTimer);
                currentTaskTimer = null;
                tasks[taskKey] = true;
                setTaskDone(btn, stepNum, title);
                updateDots();

                if (nextBtnToActivate) {
                    resetTaskBtn(nextBtnToActivate, nextStepNum, nextIcon, nextTitle, nextHint, "primary-red", true);
                    refreshIcons();
                }

                checkAllCompleted();
            }
        }, 1000);
    }

    task1Btn.addEventListener("click", () => {
        const t = I18N[currentLang] || I18N.en;
        let ytUrl = (SITE_CONFIG.unlockTasks && SITE_CONFIG.unlockTasks.youtubeChannelUrl) || "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1";
        if (ytUrl.includes("YOUR_CHANNEL")) ytUrl = "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1";
        handleTaskClick(
            task1Btn, 
            ytUrl, 
            5, 
            "t1", 
            "01", 
            t.task1Name, 
            task2Btn, 
            "02", 
            "message-square",
            t.task2Name, 
            t.task2Hint
        );
    });

    task2Btn.addEventListener("click", () => {
        const t = I18N[currentLang] || I18N.en;
        if (!tasks.t1) {
            showToast(t.taskWaitPrev1);
            return;
        }
        let discordUrl = (SITE_CONFIG.unlockTasks && SITE_CONFIG.unlockTasks.affiliateUrl) || "";
        if (!discordUrl || discordUrl.includes("shopee.co.th")) {
            discordUrl = (SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.discord) || "https://discord.gg/your-discord";
        }
        handleTaskClick(
            task2Btn, 
            discordUrl, 
            5, 
            "t2", 
            "02", 
            t.task2Name, 
            task3Btn, 
            "03", 
            "thumbs-up",
            t.task3Name, 
            t.task3Hint
        );
    });

    task3Btn.addEventListener("click", () => {
        const t = I18N[currentLang] || I18N.en;
        if (!tasks.t2) {
            showToast(t.taskWaitPrev2);
            return;
        }
        handleTaskClick(
            task3Btn, 
            SITE_CONFIG.unlockTasks.latestVideoUrl, 
            3, 
            "t3", 
            "03", 
            t.task3Name, 
            null, 
            null, 
            null,
            null, 
            null
        );
    });

    function checkAllCompleted() {
        const t = I18N[currentLang] || I18N.en;
        if (tasks.t1 && tasks.t2 && tasks.t3) {
            showToast(t.unlockedToast);
            setTimeout(() => {
                tasksStack.style.display = "none";
                lockedLabel.style.display = "none";
                unlockedView.classList.add("show");
                refreshIcons();
            }, 500);
        }
    }

    btnCopyScript.addEventListener("click", () => {
        scriptCodeBox.select();
        const t = I18N[currentLang] || I18N.en;
        const copySuccess = () => {
            btnCopyScript.className = "btn-copy-script copied";
            btnCopyScript.innerHTML = `<i data-lucide="check"></i> <span>${t.copiedBtn}</span>`;
            refreshIcons();
            showToast(t.toastCopied);
            setTimeout(() => {
                btnCopyScript.className = "btn-copy-script";
                btnCopyScript.innerHTML = `<i data-lucide="copy"></i> <span>${t.btnCopyCode}</span>`;
                refreshIcons();
            }, 2500);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(scriptCodeBox.value).then(copySuccess).catch(() => {
                document.execCommand("copy");
                copySuccess();
            });
        } else {
            document.execCommand("copy");
            copySuccess();
        }
    });

    closeLockerBtn.addEventListener("click", () => {
        if (currentTaskTimer) {
            clearInterval(currentTaskTimer);
            currentTaskTimer = null;
        }
        lockerModal.classList.remove("active");
    });
    lockerModal.addEventListener("click", (e) => {
        if (e.target === lockerModal) {
            if (currentTaskTimer) {
                clearInterval(currentTaskTimer);
                currentTaskTimer = null;
            }
            lockerModal.classList.remove("active");
        }
    });

    // Close modals with Escape key
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (lockerModal && lockerModal.classList.contains("active")) {
                lockerModal.classList.remove("active");
            }
            if (suncModal && suncModal.classList.contains("active")) {
                suncModal.classList.remove("active");
            }
        }
    });

    // =========================================================================
    // Sidebar & Mobile Drawer Interactions
    // =========================================================================
    function openMobileSidebar() {
        if (appSidebar) appSidebar.classList.add("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.add("active");
    }

    function closeMobileSidebar() {
        if (appSidebar) appSidebar.classList.remove("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileSidebar);
    if (bottomNavMenuBtn) bottomNavMenuBtn.addEventListener("click", openMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeMobileSidebar);

    if (mobileBottomNav) {
        mobileBottomNav.addEventListener("click", (e) => {
            const btn = e.target.closest(".bottom-nav-item");
            if (!btn || btn.id === "bottomNavMenuBtn") return;
            const nav = btn.dataset.nav;
            if (nav === "home") {
                switchView("home");
            } else if (nav === "feed") {
                activeFilter = btn.dataset.filter || "all";
                activeGame = null;
                switchView("feed");
            } else if (nav === "exploits") {
                switchView("exploits");
            }
        });
    }

    brandLogo.addEventListener("click", () => {
        closeMobileSidebar();
        switchView("home");
    });

    mainMenu.addEventListener("click", (e) => {
        const item = e.target.closest(".menu-item");
        if (!item) return;

        closeMobileSidebar();
        const nav = item.dataset.nav;
        if (nav === "home") {
            switchView("home");
            return;
        }
        if (nav === "exploits") {
            switchView("exploits");
            return;
        }

        activeFilter = item.dataset.filter || "all";
        activeGame = null;
        highlightSidebarItem("filter", activeFilter);

        const t = I18N[currentLang] || I18N.en;
        if (activeFilter === "all") {
            currentViewTitle.textContent = t.viewTitleAll;
            currentViewDesc.textContent = t.viewDescAll;
        } else if (activeFilter === "keyless") {
            currentViewTitle.textContent = t.viewTitleKeyless;
            currentViewDesc.textContent = t.viewDescKeyless;
        } else if (activeFilter === "mobile") {
            currentViewTitle.textContent = t.viewTitleMobile;
            currentViewDesc.textContent = t.viewDescMobile;
        }

        switchView("feed");
    });

    gameMenu.addEventListener("click", (e) => {
        const item = e.target.closest(".menu-item");
        if (!item) return;

        closeMobileSidebar();
        activeGame = item.dataset.game;
        activeFilter = "all";
        highlightSidebarItem("game", activeGame);

        const t = I18N[currentLang] || I18N.en;
        const gameName = item.querySelector(".menu-left").textContent.trim();
        currentViewTitle.textContent = typeof t.viewTitleGame === "function" ? t.viewTitleGame(gameName) : `Scripts for ${gameName}`;
        currentViewDesc.textContent = typeof t.viewDescGame === "function" ? t.viewDescGame(gameName) : `All scripts for ${gameName}`;

        switchView("feed");
    });

    // Trending Game Tiles in Home
    if (trendingGamesGrid) {
        trendingGamesGrid.addEventListener("click", (e) => {
            const tile = e.target.closest(".game-tile");
            if (!tile) return;
            const game = tile.dataset.game;
            activeGame = game;
            activeFilter = "all";
            highlightSidebarItem("game", game);

            const t = I18N[currentLang] || I18N.en;
            const name = tile.querySelector(".tile-name").textContent;
            currentViewTitle.textContent = typeof t.viewTitleGame === "function" ? t.viewTitleGame(name) : `Scripts for ${name}`;
            currentViewDesc.textContent = typeof t.viewDescGame === "function" ? t.viewDescGame(name) : `All scripts for ${name}`;

            switchView("feed");
        });
    }

    // Home Action Buttons
    if (btnGoFeedAll) btnGoFeedAll.addEventListener("click", () => {
        const t = I18N[currentLang] || I18N.en;
        activeFilter = "all";
        activeGame = null;
        highlightSidebarItem("filter", "all");
        currentViewTitle.textContent = t.viewTitleAll;
        currentViewDesc.textContent = t.viewDescAll;
        switchView("feed");
    });

    if (btnSeeAllGames) btnSeeAllGames.addEventListener("click", () => {
        const t = I18N[currentLang] || I18N.en;
        activeFilter = "all";
        activeGame = null;
        highlightSidebarItem("filter", "all");
        currentViewTitle.textContent = t.viewTitleAll;
        currentViewDesc.textContent = t.viewDescAll;
        switchView("feed");
    });

    if (btnSeeAllScripts) btnSeeAllScripts.addEventListener("click", () => {
        const t = I18N[currentLang] || I18N.en;
        activeFilter = "all";
        activeGame = null;
        highlightSidebarItem("filter", "all");
        currentViewTitle.textContent = t.viewTitleAll;
        currentViewDesc.textContent = t.viewDescAll;
        switchView("feed");
    });

    // Filter Chips in Feed View
    if (filterChips) {
        filterChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".chip");
            if (!chip) return;
            filterChips.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilter = chip.dataset.tag;
            renderFeed();
        });
    }

    // Global Search
    globalSearch.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim();
        if (currentView === "home" && searchQuery) {
            switchView("feed");
        } else if (currentView === "exploits") {
            renderExploits();
        } else if (currentView === "feed") {
            renderFeed();
        }
    });

    function showToast(msg) {
        toastBar.textContent = msg;
        toastBar.classList.add("active");
        setTimeout(() => toastBar.classList.remove("active"), 2500);
    }

    // =========================================================================
    // Discord Support & Notice Popup (popup.png Modal with 24h dismissal)
    // =========================================================================
    function initSiteNoticePopup() {
        const popup = document.getElementById("siteNoticePopup");
        const closeBtn = document.getElementById("sitePopupCloseBtn");
        const closeNowBtn = document.getElementById("sitePopupCloseNowBtn");
        const dismiss24hBtn = document.getElementById("sitePopupDismiss24hBtn");
        const popupLink = document.getElementById("sitePopupLink");

        if (!popup) return;

        // Set Discord link dynamically from config if available
        if (popupLink) {
            const dcLink = (SITE_CONFIG.socialLinks && SITE_CONFIG.socialLinks.discord) ||
                           (SITE_CONFIG.unlockTasks && SITE_CONFIG.unlockTasks.affiliateUrl) ||
                           "https://discord.gg/6x67MrtfbX";
            popupLink.href = dcLink;
        }

        // ตรวจสอบ URL query: หากใส่ ?reset_popup=1 หรือ ?reset=1 หรือ ?relock=1 ให้ล้างการจำ 24 ชม. ของป๊อปอัปด้วย
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("reset_popup") || urlParams.has("reset") || urlParams.has("relock")) {
            localStorage.removeItem("blacklist_popup_dismissed_until");
        }

        // ตรวจสอบว่าผู้ใช้เคยกด "ไม่ต้องแสดงอีก 24 ชั่วโมง" หรือไม่
        const dismissedUntil = localStorage.getItem("blacklist_popup_dismissed_until");
        if (dismissedUntil) {
            const exp = Number(dismissedUntil);
            if (!isNaN(exp) && Date.now() < exp) {
                // ยังอยู่ในช่วงเวลา 24 ชั่วโมงที่ไม่ต้องแสดง
                return;
            } else {
                localStorage.removeItem("blacklist_popup_dismissed_until");
            }
        }

        function showPopup() {
            if (isCurrentlyBanned) return;
            popup.style.display = "flex";
            requestAnimationFrame(() => {
                popup.classList.add("active");
            });
            refreshIcons();
        }

        function hidePopup(is24h = false) {
            popup.classList.remove("active");
            setTimeout(() => {
                popup.style.display = "none";
            }, 250);

            if (is24h) {
                const next24h = Date.now() + (24 * 60 * 60 * 1000);
                localStorage.setItem("blacklist_popup_dismissed_until", String(next24h));
                showToast(currentLang === 'th' ? "บันทึกแล้ว: จะไม่แสดงป๊อปอัปนี้อีกใน 24 ชั่วโมง" : "Saved: will not show this popup again for 24 hours");
            }
        }

        // ถ้าหน้าเว็บติดหน้าต่างล็อค LootLabs อยู่ ให้รอจนกว่าจะปลดล็อคก่อนจึงค่อยเด้งขึ้นมา
        const gateOverlay = document.getElementById("lootlabsGateOverlay");
        if (gateOverlay && gateOverlay.style.display !== "none" && !isGateAuthorized()) {
            const gateObserver = new MutationObserver(() => {
                if (gateOverlay.style.display === "none") {
                    gateObserver.disconnect();
                    setTimeout(showPopup, 600);
                }
            });
            gateObserver.observe(gateOverlay, { attributes: true, attributeFilter: ["style"] });
        } else {
            // หน่วงเวลาเล็กน้อยให้หน้าเว็บโหลดสมูท 700ms แล้วแสดง
            setTimeout(showPopup, 700);
        }

        if (closeBtn) {
            closeBtn.addEventListener("click", () => hidePopup(false));
        }

        if (closeNowBtn) {
            closeNowBtn.addEventListener("click", () => hidePopup(false));
        }

        if (dismiss24hBtn) {
            dismiss24hBtn.addEventListener("click", () => hidePopup(true));
        }

        // คลิกพื้นที่ว่างภายนอกกล่องเพื่อปิด
        popup.addEventListener("click", (e) => {
            if (e.target === popup) {
                hidePopup(false);
            }
        });
    }

    // Initialize App
    setLanguage(currentLang);
    applySiteConfig();
    initVipSystem();
    checkUrlForVipToken();
    checkBanStatus();
    checkLootlabsGate();
    updateCategoryBadges();
    switchView("home");
    fetchExploits();
    syncDataFromServer();
    initSiteNoticePopup();
    refreshIcons();

    // Check ban status periodically (every 45s)
    setInterval(checkBanStatus, 45000);
});
