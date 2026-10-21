/**
 * 🍬 Voice Candy Auto-Reward System
 * ตรวจสอบสมาชิกที่อยู่ในห้องพูดคุย (Voice Channels) ทุกๆ 1 นาที
 * อัตรา: 1 ชั่วโมง ได้รับ 10 เม็ด (1 เม็ด ทุกๆ 6 นาที สะสมถาวร)
 * (ยกเว้นห้อง AFK หรือคนที่ปิดหูฟัง selfDeaf/serverDeaf)
 */
const { trackVoiceMinute } = require('../database/db');

function startVoiceCandyTracker(client) {
    console.log('🍬 [Voice Candy] เริ่มต้นระบบแจกลูกอมในห้องเสียง (อัตรา 10 เม็ด / 1 ชั่วโมง)...');

    setInterval(async () => {
        try {
            let totalCandiesAwarded = 0;

            for (const guild of client.guilds.cache.values()) {
                const afkChannelId = guild.afkChannelId;

                // วนลูปดูทุกห้องเสียงในเซิร์ฟเวอร์
                const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased());

                for (const channel of voiceChannels.values()) {
                    // ข้ามห้อง AFK
                    if (channel.id === afkChannelId) continue;

                    // สมาชิกในห้องเสียง
                    const validMembers = channel.members.filter(member => {
                        if (member.user.bot) return false; // ไม่แจกบอท
                        if (member.voice.selfDeaf || member.voice.serverDeaf) return false; // ปิดหูฟังไม่ได้รับ
                        return true;
                    });

                    for (const member of validMembers.values()) {
                        const result = trackVoiceMinute(member.id);
                        if (result.rewarded) {
                            totalCandiesAwarded++;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ [Voice Candy Error]:', error);
        }
    }, 60 * 1000); // ตรวจสอบทุก 1 นาที
}

module.exports = { startVoiceCandyTracker };
