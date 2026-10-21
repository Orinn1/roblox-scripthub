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

const fs = require('fs');
const path = require('path');

const { 
    save247Channel, 
    get247Channel, 
    getAll247Channels, 
    remove247Channel 
} = require('../database/db');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'voice-247-config.json');

function loadPersistentVoiceConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        }
    } catch {}
    return {};
}

function savePersistentVoiceConfig(guildId, channelId) {
    try {
        const config = loadPersistentVoiceConfig();
        config[guildId] = channelId;
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {
        console.warn('[24/7 Voice] ไม่สามารถบันทึก config file ได้:', err.message);
    }
}

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

        // บันทึกลงฐานข้อมูล SQLite และไฟล์ Config
        save247Channel(guildId, channel.id);
        savePersistentVoiceConfig(guildId, channel.id);

        // ดักจับเมื่อการเชื่อมต่อหลุด ให้พยายามต่อกลับอัตโนมัติ
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch {
                // ถ้าหลุดจริง ให้เช็คห้องล่าสุดที่บันทึกไว้
                const fileConfig = loadPersistentVoiceConfig();
                const savedChannelId = get247Channel(guildId) || fileConfig[guildId];
                if (savedChannelId) {
                    console.log(`🔄 [24/7 Voice] กำลังเชื่อมต่อกลับห้องล่าสุด ${savedChannelId} ในเซิร์ฟเวอร์ ${guild.name}...`);
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
    try {
        const config = loadPersistentVoiceConfig();
        delete config[guildId];
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch {}
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
 * ตรวจสอบและดึงบอทกลับเข้าห้อง Voice ทุกเซิร์ฟเวอร์ที่มีการตั้งค่าไว้ (จำห้องล่าสุดเสมอ)
 */
function startVoice247Manager(client) {
    console.log('🎧 [24/7 Voice] เริ่มต้นระบบสิงห้องพูดคุย Voice 24 ชม. อัตโนมัติ (จำห้องล่าสุด)...');

    // 🎯 ดักจับ Event เมื่อมีคนลากย้ายบอท หรือบอทเปลี่ยนห้องเสียง ให้บันทึกเป็นห้องล่าสุดทันที
    client.on('voiceStateUpdate', (oldState, newState) => {
        if (newState.id === client.user.id) {
            // ถ้าบอทยังอยู่ในห้องเสียง (และห้องใหม่ไม่ว่างเปล่า)
            if (newState.channelId) {
                console.log(`🎧 [24/7 Voice] ตรวจพบบอทย้าย/เข้าห้องเสียงล่าสุด: ${newState.channelId} ในเซิร์ฟเวอร์ ${newState.guild.name}`);
                save247Channel(newState.guild.id, newState.channelId);
                savePersistentVoiceConfig(newState.guild.id, newState.channelId);
            }
        }
    });

    const checkAndReconnectAll = () => {
        try {
            const savedChannels = getAll247Channels() || [];
            const fileConfig = loadPersistentVoiceConfig();

            // รวบรวมทุก Guild ที่มีตั้งค่า หรือเป็นเซิร์ฟเวอร์ Señorita
            for (const guild of client.guilds.cache.values()) {
                const guildId = guild.id;
                let targetChannelId = get247Channel(guildId) || fileConfig[guildId];

                // ค่าเริ่มต้นกรณีเซิร์ฟเวอร์ Señorita ถ้ายังไม่มีข้อมูล ให้เข้า Talk 1
                if (!targetChannelId && guildId === '1561808552232755220') {
                    targetChannelId = '1561808553361022984'; // Talk 1 ౨ৎ
                }

                if (!targetChannelId) continue;

                const connection = getVoiceConnection(guildId);
                // ถ้ายังไม่มีการเชื่อมต่อ หรือหลุดไป ให้ดึงกลับเข้าห้องล่าสุดทันที
                if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed || connection.state.status === VoiceConnectionStatus.Disconnected) {
                    joinVoice(client, guildId, targetChannelId);
                }
            }
        } catch (err) {
            console.error('❌ [24/7 Voice Keep-Alive Error]:', err);
        }
    };

    // เชื่อมต่อรอบแรกหลังจากบอทเปิดขึ้นมา 6 วินาที
    setTimeout(checkAndReconnectAll, 6000);

    // ตรวจสอบ Keep-Alive ทุกๆ 20 วินาที ป้องกันคนเตะหรือการหลุด
    setInterval(checkAndReconnectAll, 20 * 1000);
}

module.exports = {
    joinVoice,
    leaveVoice,
    startVoice247Manager
};
