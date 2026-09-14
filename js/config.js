/**
 * การตั้งค่าหลักของเว็บไซต์ (แก้ไขลิงก์และชื่อเว็บได้ที่นี่ หรือผ่านระบบหลังบ้าน admin.html)
 * Main Website Configuration
 */
const SITE_CONFIG = {
    // ข้อมูลทั่วไปของเว็บ
    siteName: "BlacklistScriptx",
    brandPrefix: "Blacklist",
    brandSuffix: "Scriptx",
    siteTagline: "ศูนย์รวมสคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
    logoIcon: "Logo.ico",
    
    // Firebase Cloud Firestore (50,000 Reads/วัน ฟรีตลอดชีพ)
    firebaseConfig: {
        apiKey: "AIzaSyApTJf2qSiaaM3qQ9e2XE16Za1p3FGXpxI",
        authDomain: "blacklistscripts.firebaseapp.com",
        projectId: "blacklistscripts",
        storageBucket: "blacklistscripts.firebasestorage.app",
        messagingSenderId: "337802433479",
        appId: "1:337802433479:web:d0758311bfd6bd02983fe2",
        measurementId: "G-KJVSN73QYR"
    },

    // Cloud Database Backup (JSONBin.io)
    cloudDb: {
        enabled: true,
        binId: "6aa6a183ac6210605ac7dcf7",
        masterKey: "$2a$10$IYkvYSXXCqfb9lO86OX8.ehEV.hMZwInw.esSiflJGjjaiYEs5eQ6"
    },
    
    // ลิงก์สำหรับภารกิจปลดล็อค Sub2Unlock
    unlockTasks: {
        youtubeChannelUrl: "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1",
        youtubeChannelName: "ช่อง Blacklistxyx",
        affiliateUrl: "https://shopee.co.th",
        affiliateTitle: "สนับสนุนช่อง / ดูสินค้าราคาพิเศษ",
        latestVideoUrl: "https://www.youtube.com/@Blacklistxyx",
        latestVideoTitle: "กดไลค์และคอมเมนต์คลิปแจกสคริปต์ล่าสุด",
        verificationSeconds: 5
    },

    // ลิงก์ Social Media ด้านบนเว็บ
    socialLinks: {
        youtube: "https://www.youtube.com/@Blacklistxyx",
        discord: "https://discord.gg/YOUR_DISCORD",
        tiktok: "https://www.tiktok.com/@YOUR_TIKTOK"
    },

    // ระบบป้องกัน Bypass ด้วย LootLabs Token Gate
    lootlabsGate: {
        enabled: true,
        token: "blacklist_vip",
        lootlabsUrl: "https://loot-link.com/s?oSxvK7gj&data=Ie0PVBmn90rQrhCi8dVydrnOLIdR8byoGkbNlLEmHw1qavc1xhDTH/PaTy9MUFqh",
        expiryHours: 24, // จดจำเครื่องไว้ 24 ชั่วโมง
        bypassMessage: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน LootLabs เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์"
    }
};

// ตรวจสอบว่าเคยบันทึกการตั้งค่าไว้ใน LocalStorage หรือไม่
(function loadSavedConfig() {
    try {
        const saved = localStorage.getItem("nova_site_config");
        if (saved) {
            const parsed = JSON.parse(saved);
            // ล้างลิงก์ตัวอย่าง YOUR_CHANNEL ออกให้หมด และแทนที่ด้วยช่อง Blacklistxyx
            if (parsed.unlockTasks) {
                if (!parsed.unlockTasks.youtubeChannelUrl || parsed.unlockTasks.youtubeChannelUrl.includes("YOUR_CHANNEL")) {
                    parsed.unlockTasks.youtubeChannelUrl = "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1";
                }
                if (!parsed.unlockTasks.latestVideoUrl || parsed.unlockTasks.latestVideoUrl.includes("YOUR_CHANNEL") || parsed.unlockTasks.latestVideoUrl.includes("dQw4w9WgXcQ")) {
                    parsed.unlockTasks.latestVideoUrl = "https://www.youtube.com/@Blacklistxyx";
                }
                parsed.unlockTasks.youtubeChannelName = "ช่อง Blacklistxyx";
            }
            if (parsed.socialLinks) {
                if (!parsed.socialLinks.youtube || parsed.socialLinks.youtube.includes("YOUR_CHANNEL")) {
                    parsed.socialLinks.youtube = "https://www.youtube.com/@Blacklistxyx";
                }
            }
            // ล้างลิงก์ LootLabs เก่าที่เป็นตัวอย่างออก
            if (parsed.lootlabsGate) {
                if (!parsed.lootlabsGate.lootlabsUrl || parsed.lootlabsGate.lootlabsUrl.includes("s?example")) {
                    parsed.lootlabsGate.lootlabsUrl = "https://loot-link.com/s?oSxvK7gj&data=Ie0PVBmn90rQrhCi8dVydrnOLIdR8byoGkbNlLEmHw1qavc1xhDTH/PaTy9MUFqh";
                }
            }
            // อัปเดต firebaseConfig เสมอ
            parsed.firebaseConfig = SITE_CONFIG.firebaseConfig;
            Object.assign(SITE_CONFIG, parsed);
            localStorage.setItem("nova_site_config", JSON.stringify(SITE_CONFIG));
        }
    } catch (e) {
        console.warn("Could not load custom config from localStorage", e);
    }
})();
