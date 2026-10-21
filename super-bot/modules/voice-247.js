/**
 * 🎧 24/7 Voice Channel Manager Module
 * บอทสิงห้องพูดคุย Voice Channel ถาวรตลอด 24 ชม.
 * มีระบบ Reconnect อัตโนมัติเมื่อหลุด หรือเมื่อบอทรีสตาร์ท
 */
const { 
    joinVoiceChannel, 
    VoiceConnectionStatus, 
    entersState, 
    getVoiceConnection 
} = require('@discordjs/voice');

const { 
    save247Channel, 
    get247Channel, 
    getAll247Channels, 
    remove247Channel 
} = require('../database/db');

/**
 * สั่งให้บอทเข้าสิงห้อง Voice Channel และเปิดโหมด 24 ชม.
 */
async function joinVoice(client, guildId, channelId) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return { success: false, message: 'ไม่พบเซิร์ฟเวอร์' };

        const channel = guild.channels.cache.get(channelId);
        if (!channel || !channel.isVoiceBased()) {
            return { success: false, message: 'ไม่พบห้องพูดคุย Voice Channel ที่ระบุ' };
        }

        // เชื่อมต่อ Voice Channel
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        // บันทึกลงฐานข้อมูล SQLite
        save247Channel(guildId, channelId);

        // ดักจับเมื่อการเชื่อมต่อหลุด ให้พยายามต่อกลับอัตโนมัติ
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch {
                // ถ้าหลุดจริง ให้เช็คว่ายังเปิด 24 ชม. อยู่หรือไม่
                const savedChannelId = get247Channel(guildId);
                if (savedChannelId) {
                    console.log(`🔄 [24/7 Voice] กำลังเชื่อมต่อกลับห้อง ${savedChannelId} ในเซิร์ฟเวอร์ ${guild.name}...`);
                    setTimeout(() => {
                        joinVoice(client, guildId, savedChannelId);
                    }, 3000);
                } else {
                    try { connection.destroy(); } catch {}
                }
            }
        });

        return { success: true, channel };
    } catch (error) {
        console.error('❌ [24/7 Voice Join Error]:', error);
        return { success: false, message: error.message };
    }
}

/**
 * สั่งให้บอทออกจากห้อง Voice และปิดโหมด 24 ชม.
 */
function leaveVoice(client, guildId) {
    remove247Channel(guildId);
    const connection = getVoiceConnection(guildId);
    if (connection) {
        try {
            connection.destroy();
        } catch {}
        return true;
    }
    return false;
}

/**
 * ตรวจสอบและดึงบอทกลับเข้าห้อง Voice ทุกเซิร์ฟเวอร์ที่มีการตั้งค่าไว้ (รันตอนบอทเปิด)
 */
function startVoice247Manager(client) {
    console.log('🎧 [24/7 Voice] เริ่มต้นระบบสิงห้องพูดคุย Voice 24 ชม. อัตโนมัติ...');

    const checkAndReconnectAll = () => {
        try {
            const savedChannels = getAll247Channels() || [];
            // ล็อกห้องเริ่มต้นสำหรับเซิร์ฟเวอร์ Señorita (# Talk 1 ౨ৎ) ไม่ให้หลุดเวลา Render รีสตาร์ท
            if (!savedChannels.some(s => s.guildId === '1561808552232755220')) {
                savedChannels.push({
                    guildId: '1561808552232755220',
                    channelId: '1561808553361022984'
                });
            }

            for (const item of savedChannels) {
                const guild = client.guilds.cache.get(item.guildId);
                if (!guild) continue;

                const connection = getVoiceConnection(item.guildId);
                // ถ้ายังไม่มีการเชื่อมต่อ หรือหลุดไป ให้ต่อใหม่ทันที
                if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed || connection.state.status === VoiceConnectionStatus.Disconnected) {
                    joinVoice(client, item.guildId, item.channelId);
                }
            }
        } catch (err) {
            console.error('❌ [24/7 Voice Keep-Alive Error]:', err);
        }
    };

    // เชื่อมต่อรอบแรกหลังจากบอทเปิดขึ้นมา 6 วินาที
    setTimeout(checkAndReconnectAll, 6000);

    // ตรวจสอบ Keep-Alive ทุกๆ 30 วินาที ป้องกันคนเตะหรือ Discord รีเซ็ต Voice Gateway
    setInterval(checkAndReconnectAll, 30 * 1000);
}

module.exports = {
    joinVoice,
    leaveVoice,
    startVoice247Manager
};
