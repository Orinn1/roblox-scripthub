/**
 * 📩 Event: messageCreate
 * ดักจับข้อความเพื่อส่งเข้าสู่ระบบ Smart Anti-Scam & Anti-Raid
 */
const { handleAntiScamMessage } = require('../modules/anti-scam');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // ตรวจจับลิงก์ฟิชชิ่ง และภาพสแกม MrBeast / Casino
        await handleAntiScamMessage(message);
    }
};
