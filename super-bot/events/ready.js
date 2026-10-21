/**
 * 🚀 Event: ready
 * เรียกทำงานเมื่อบอทล็อกอินเข้าสู่ระบบ Discord สำเร็จ
 */
const { ActivityType, Events } = require('discord.js');
const { startVoiceCandyTracker } = require('../modules/candy-voice-tracker');
const { startLeaderboardAutoUpdater } = require('../modules/leaderboard-updater');
const { startVoice247Manager } = require('../modules/voice-247');

// รายการข้อความสถานะน่ารักๆ เปลี่ยนวนไปเรื่อยๆ อัตโนมัติ
const cuteStatuses = [
    '💖 วันนี้กินข้าวหรือยังเตง? อย่าลืมกินน้า',
    '🌸 แวะมาแจกความสดใส 300% ให้ทุกคนเลย',
    '🍬 นั่งแจกลูกอมหวานๆ ในห้องเสียงอยู่น้า',
    '✨ วันนี้ขอให้เป็นวันที่ใจดีกับเธอนะ',
    '🔮 สับไพ่รอทำนายดวงให้คนน่ารักอยู่จ้า',
    '🎀 แอบมองคนน่ารักในเซิร์ฟอยู่นะะะ',
    '🍀 ขอให้วันนี้หมุนกาชาไม่เกลือน้าวัยรุ่น',
    '🧸 แม่พระของเซนโย อยู่เคียงข้างเสมอน้า',
    '🍵 จิบคชาเขียวชิลๆ คอยดูแลเซิร์ฟให้',
    '💤 นั่งเหงารอเพื่อนๆ เข้าห้อง Voice มาคุยกัน',
    '💫 ถ้าเหนื่อยก็แวะมาพักใจในเซิร์ฟนี้นะ',
    '🎧 แอบฟังคนคุยกันในห้องคอล... ฟินจังง',
    '🍓 วันนี้ยิ้มหรือยัง? ยิ้มเยอะๆ น้าคนเก่ง',
    '🥺 เกลือไม่กลัว กลัวเธอไม่เข้าเซิร์ฟมากกว่า',
    '🌈 พลังบวกเต็มเปี่ยม พร้อมลุยไปด้วยกัน!'
];

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log('====================================================');
        console.log(`🤖 [Bot Ready] เข้าสู่ระบบสำเร็จในชื่อ: ${client.user.tag}`);
        console.log(`🏰 เซิร์ฟเวอร์ที่ดูแลอยู่: ${client.guilds.cache.size} เซิร์ฟเวอร์`);
        console.log(`👥 สมาชิกทั้งหมด: ${client.users.cache.size} คน`);
        console.log('====================================================');

        // ระบบวนลูปเปลี่ยนสถานะบอทน่ารักๆ อัตโนมัติทุกๆ 15 วินาที
        let statusIndex = 0;
        const updateCutePresence = () => {
            const statusText = cuteStatuses[statusIndex];
            client.user.setPresence({
                activities: [{ name: statusText, state: statusText, type: ActivityType.Custom }],
                status: 'online'
            });
            statusIndex = (statusIndex + 1) % cuteStatuses.length;
        };

        // เริ่มต้นแสดงผลทันที
        updateCutePresence();

        // สลับข้อความน่ารักๆ ทุก 15 วินาที
        setInterval(updateCutePresence, 15 * 1000);

        // เริ่มต้นระบบแจกลูกอมในห้องเสียง Voice Channel อัตโนมัติ (10 เม็ด/ชม.)
        startVoiceCandyTracker(client);

        // เริ่มต้นระบบอัปเดตข้อความกระดานผู้นำอัตโนมัติ (ทุก 1 ชม.)
        startLeaderboardAutoUpdater(client);

        // เริ่มต้นระบบสิงห้องพูดคุย Voice 24 ชม. อัตโนมัติ
        startVoice247Manager(client);
    }
};
