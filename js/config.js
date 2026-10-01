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
        affiliateUrl: "https://omg10.com/4/11919655",
        affiliateTitle: "ภารกิจผู้สนับสนุน / Sponsor Link",
        latestVideoUrl: "https://www.youtube.com/@Blacklistxyx",
        latestVideoTitle: "กดไลค์และคอมเมนต์คลิปแจกสคริปต์ล่าสุด",
        verificationSeconds: 15
    },

    // ลิงก์ Social Media ด้านบนเว็บ
    socialLinks: {
        youtube: "https://www.youtube.com/@Blacklistxyx",
        discord: "https://discord.gg/6x67MrtfbX",
        tiktok: "https://www.tiktok.com/@YOUR_TIKTOK"
    },

    // ระบบสร้างรายได้และป้องกัน Bypass (ShrinkMe / ShrinkEarn / LootLabs Gate)
    lootlabsGate: {
        enabled: true,
        provider: "shrinkme", // "shrinkme" | "shrinkearn" | "blackpass" | "lootlabs" | "custom"
        token: "blacklist_vip",
        shrinkmeUrl: "https://shrinkme.click/cBGgRn",
        blackpassLockerUrl: "/gateflow/locker.html?slug=hub-access",
        shrinkearnUrl: "https://srnky.com/aehfqq0",
        shrinkearnApiToken: "3ce8c70d0c1e31404164f66164ea8f9117b29b69",
        tutorialVideoUrl: "https://youtu.be/FdXsvivWhOw",
        lootlabsUrl: "https://loot-link.com/s?oSxvK7gj&data=Ie0PVBmn90rQrhCi8dVydrnOLIdR8byoGkbNlLEmHw1qavc1xhDTH/PaTy9MUFqh",
        expiryHours: 24, // จดจำเครื่องไว้ 24 ชั่วโมง
        bypassMessage: "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน ShrinkMe เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์ 24 ชั่วโมง"
    },

    // Monetag Smartlink / Direct Link
    adsterraSmartlinkUrl: "https://omg10.com/4/11911452",
    executorDirectLinkUrl: "https://omg10.com/4/11919658"
};

// Make SITE_CONFIG globally available on window
window.SITE_CONFIG = SITE_CONFIG;

// Deep merge helper function to prevent shallow overwrite of nested objects
function deepMergeConfig(target, source) {
    if (!source || typeof source !== "object") return target;
    
    // If source has a serialized configJson string from Firestore, unpack and merge it first
    if (typeof source.configJson === "string") {
        try {
            const unpacked = JSON.parse(source.configJson);
            deepMergeConfig(target, unpacked);
        } catch (e) {}
    }

    for (const key of Object.keys(source)) {
        if (key === "configJson") continue;
        const val = source[key];
        if (val && typeof val === "object" && !Array.isArray(val)) {
            if (!target[key] || typeof target[key] !== "object") {
                target[key] = {};
            }
            deepMergeConfig(target[key], val);
        } else if (val !== undefined && val !== null) {
            target[key] = val;
        }
    }
    return target;
}

window.isGlobalDomain = function () {
    if (typeof window !== "undefined") {
        const override = sessionStorage.getItem("blacklist_active_db_target");
        if (override === "hub_global") return true;
        if (override === "hub") return false;
        if (window.location && window.location.hostname) {
            const host = window.location.hostname.toLowerCase();
            // ONLY hub.blacklisthub.workers.dev or explicit global subdomains are global/English
            if (host.startsWith("hub.") || host.includes("global")) {
                return true;
            }
        }
    }
    return false;
};

// Apply English defaults immediately if running on Global Hub domain
if (window.isGlobalDomain()) {
    SITE_CONFIG.siteTagline = "Ultimate Roblox Script Hub - Safe, Updated & Free Keyless Exploits";
    if (SITE_CONFIG.unlockTasks) {
        SITE_CONFIG.unlockTasks.youtubeChannelName = "Blacklistxyx Channel";
        SITE_CONFIG.unlockTasks.affiliateTitle = "Join Discord Community";
        SITE_CONFIG.unlockTasks.latestVideoTitle = "Like & Comment Latest Showcase Video";
    }
    if (SITE_CONFIG.lootlabsGate) {
        SITE_CONFIG.lootlabsGate.bypassMessage = "Please complete the support link to unlock access to the website.";
    }
}

window.mergeSiteConfig = function (source) {
    deepMergeConfig(SITE_CONFIG, source);
    if (window.isGlobalDomain()) {
        if (SITE_CONFIG.siteTagline && /[\u0E00-\u0E7F]/.test(SITE_CONFIG.siteTagline)) {
            SITE_CONFIG.siteTagline = "Ultimate Roblox Script Hub - Safe, Updated & Free Keyless Exploits";
        }
        if (SITE_CONFIG.lootlabsGate && /[\u0E00-\u0E7F]/.test(SITE_CONFIG.lootlabsGate.bypassMessage || "")) {
            SITE_CONFIG.lootlabsGate.bypassMessage = "Please complete the support link to unlock access to the website.";
        }
    }
    return SITE_CONFIG;
};

window.getSiteConfigStorageKey = function () {
    if (window.isGlobalDomain()) {
        return "nova_site_config_global";
    }
    return "nova_site_config";
};

// ตรวจสอบว่าเคยบันทึกการตั้งค่าไว้ใน LocalStorage หรือไม่
(function loadSavedConfig() {
    try {
        const storageKey = window.getSiteConfigStorageKey();
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            // คลาย configJson เก่าที่อาจจะค้างอยู่ใน localStorage
            if (parsed.configJson && typeof parsed.configJson === "string") {
                try {
                    const unpacked = JSON.parse(parsed.configJson);
                    deepMergeConfig(parsed, unpacked);
                } catch (e) {}
                delete parsed.configJson;
            }

            // ล้างลิงก์ตัวอย่าง YOUR_CHANNEL ออกให้หมด และแทนที่ด้วยช่อง Blacklistxyx
            if (parsed.unlockTasks) {
                if (!parsed.unlockTasks.youtubeChannelUrl || parsed.unlockTasks.youtubeChannelUrl.includes("YOUR_CHANNEL")) {
                    parsed.unlockTasks.youtubeChannelUrl = "https://www.youtube.com/@Blacklistxyx?sub_confirmation=1";
                }
                if (!parsed.unlockTasks.latestVideoUrl || parsed.unlockTasks.latestVideoUrl.includes("YOUR_CHANNEL") || parsed.unlockTasks.latestVideoUrl.includes("dQw4w9WgXcQ")) {
                    parsed.unlockTasks.latestVideoUrl = "https://www.youtube.com/@Blacklistxyx";
                }
                parsed.unlockTasks.youtubeChannelName = window.isGlobalDomain() ? "Blacklistxyx Channel" : "ช่อง Blacklistxyx";
                if (window.isGlobalDomain()) {
                    parsed.unlockTasks.affiliateTitle = "Join Discord Community";
                    parsed.unlockTasks.latestVideoTitle = "Like & Comment Latest Showcase Video";
                }
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
                if (!parsed.lootlabsGate.provider || parsed.lootlabsGate.provider === "blackpass") {
                    parsed.lootlabsGate.provider = "shrinkme";
                }
                if (!parsed.lootlabsGate.shrinkmeUrl || parsed.lootlabsGate.shrinkmeUrl === "https://shrinkme.io/") {
                    parsed.lootlabsGate.shrinkmeUrl = "https://shrinkme.click/cBGgRn";
                }
                if (window.isGlobalDomain()) {
                    parsed.lootlabsGate.bypassMessage = "Please complete the support link to unlock access to the website.";
                } else if (parsed.lootlabsGate.provider === "shrinkme") {
                    parsed.lootlabsGate.bypassMessage = "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน ShrinkMe เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์ 24 ชั่วโมง";
                }
            }
            // อัปเดต firebaseConfig เสมอ
            parsed.firebaseConfig = SITE_CONFIG.firebaseConfig;
            if (window.isGlobalDomain()) {
                parsed.siteTagline = "Ultimate Roblox Script Hub - Safe, Updated & Free Keyless Exploits";
            }
            deepMergeConfig(SITE_CONFIG, parsed);
            if (SITE_CONFIG.lootlabsGate) {
                if (SITE_CONFIG.lootlabsGate.provider === "blackpass" || !SITE_CONFIG.lootlabsGate.provider) {
                    SITE_CONFIG.lootlabsGate.provider = "shrinkme";
                }
                SITE_CONFIG.lootlabsGate.shrinkmeUrl = "https://shrinkme.click/cBGgRn";
                if (!window.isGlobalDomain()) {
                    SITE_CONFIG.lootlabsGate.bypassMessage = "กรุณาเข้าใช้งานผ่านลิงก์สนับสนุน ShrinkMe เพื่อปลดล็อคการเข้าใช้งานเว็บไซต์ 24 ชั่วโมง";
                }
            }
            localStorage.setItem(storageKey, JSON.stringify(SITE_CONFIG));
        }
    } catch (e) {
        console.warn("Could not load custom config from localStorage", e);
    }
})();

