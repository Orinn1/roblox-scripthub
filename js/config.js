/**
 * การตั้งค่าหลักของเว็บไซต์ (แก้ไขลิงก์และชื่อเว็บได้ที่นี่ หรือผ่านระบบหลังบ้าน admin.html)
 * Main Website Configuration
 */
const SITE_CONFIG = {
    // ข้อมูลทั่วไปของเว็บ
    siteName: "RocketScriptz",
    brandPrefix: "Rocket",
    brandSuffix: "Scriptz",
    siteTagline: "ศูนย์รวมสคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
    logoIcon: "Logo.ico",
    
    // ลิงก์สำหรับภารกิจปลดล็อค Sub2Unlock
    unlockTasks: {
        youtubeChannelUrl: "https://www.youtube.com/@YOUR_CHANNEL?sub_confirmation=1",
        youtubeChannelName: "ช่อง YouTube ของเรา",
        affiliateUrl: "https://shopee.co.th",
        affiliateTitle: "สนับสนุนช่อง / ดูสินค้าราคาพิเศษ",
        latestVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        latestVideoTitle: "กดไลค์และคอมเมนต์คลิปแจกสคริปต์ล่าสุด",
        verificationSeconds: 5
    },

    // ลิงก์ Social Media ด้านบนเว็บ
    socialLinks: {
        youtube: "https://www.youtube.com/@YOUR_CHANNEL",
        discord: "https://discord.gg/YOUR_DISCORD",
        tiktok: "https://www.tiktok.com/@YOUR_TIKTOK"
    }
};

// ตรวจสอบว่าเคยบันทึกการตั้งค่าไว้ใน LocalStorage หรือไม่
(function loadSavedConfig() {
    try {
        const saved = localStorage.getItem("nova_site_config");
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(SITE_CONFIG, parsed);
        }
    } catch (e) {
        console.warn("Could not load custom config from localStorage", e);
    }
})();
