/**
 * ====================================================================
 * BIO LINK WEBSITE CONFIGURATION (slat.cc / guns.lol Style)
 * ====================================================================
 * คุณสามารถแก้ไขข้อมูลส่วนตัว, ลิงก์โซเชียล, รูปโปรไฟล์ และเพลง ได้ที่ไฟล์นี้!
 */

const BIO_CONFIG = {
    // ข้อมูลผู้ใช้
    profile: {
        username: "Blacklistxyx",
        displayName: "Blacklist",
        handle: "@Blacklistxyx",
        verified: true,
        avatar: "https://i.postimg.cc/QMT9KvP4/Holy-Grail-Smoking-GIF.gif",
        banner: "", // ปล่อยว่างเพื่อใช้ธีม Cyber Gradient
        bio: "Roblox Script Developer • YouTuber & Content Creator\nยินดีต้อนรับสู่พื้นที่รวมผลงานและช่องทางการติดต่อของฉัน",
        location: "Thailand 🇹🇭",
        discordTag: "Blacklistxyx", // ชื่อ Discord สำหรับกดคัดลอก
        badges: [
            { icon: "shield-check", text: "Developer", color: "#38bdf8" },
            { icon: "crown", text: "Creator", color: "#f59e0b" },
            { icon: "zap", text: "Verified", color: "#10b981" }
        ]
    },

    // ลิงก์ผลงานและโซเชียลมีเดีย
    links: [
        {
            id: "scripthub",
            title: "BlacklistScript Hub (เว็บไซต์ทางการ)",
            subtitle: "ศูนย์รวมสคริปต์ Roblox อัปเดตล่าสุด ปลอดภัย ปลดล็อคฟรี",
            icon: "cpu",
            url: "https://th.blacklisthub.workers.dev/",
            highlight: true,
            color: "#38bdf8",
            badge: "POPULAR"
        },
        {
            id: "youtube",
            title: "YouTube Channel (@Blacklistxyx)",
            subtitle: "คลิปแจกสคริปต์ สอนใช้งาน และอัปเดตระบบใหม่ทุกวัน",
            icon: "youtube",
            url: "https://www.youtube.com/@Blacklistxyx",
            highlight: false,
            color: "#ef4444",
            badge: "SUBSCRIBE"
        },
        {
            id: "discord",
            title: "Discord Community Hub",
            subtitle: "เข้าร่วมพูดคุย แจ้งปัญหา และรับสิทธิพิเศษ VIP ประจำเซิร์ฟเวอร์",
            icon: "message-square",
            url: "https://discord.gg/6MTUP78KF6",
            highlight: false,
            color: "#818cf8",
            badge: "JOIN US"
        }
    ],

    // เพลงพื้นหลัง (เล่นตอนกด Click to Enter)
    music: {
        enabled: true,
        title: "Cyber Ambient Nights",
        artist: "Blacklist Vibes",
        // ลิงก์ไฟล์เสียง mp3 (สามารถเปลี่ยนเป็นลิงก์เพลงของคุณได้ตามต้องการ)
        src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
        volume: 0.45,
        autoplayOnEnter: true
    },

    // ธีมและเอฟเฟกต์ตกแต่ง
    theme: {
        accentColor: "#38bdf8",
        glassBlur: 24, // px
        particles: true, // เปิด/ปิด ละอองดาวบนพื้นหลัง
        tiltEffect: true, // เปิด/ปิด เอฟเฟกต์การ์ดเอียง 3D ตามเมาส์
        splashText: "[ CLICK ANYWHERE TO ENTER ]",
        splashSubtitle: "แตะหน้าจอเพื่อเข้าสู่เว็บไซต์และเปิดเสียงเพลง"
    }
};

// Export สำหรับทั้งเบราว์เซอร์และ Node
if (typeof module !== "undefined" && module.exports) {
    module.exports = BIO_CONFIG;
}
