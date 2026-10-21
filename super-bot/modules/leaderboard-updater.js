/**
 * 🏆 Live Leaderboard Auto-Updater Module
 * กระดานผู้นำอัปเดตอัตโนมัติทุกๆ 1 ชั่วโมง
 * ข้อมูลสะสมถาวรใน SQLite ไม่มีการรีเซ็ตรายวัน
 */
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

const { 
    getTopCandies, 
    getTopVoiceMinutes, 
    getAllLeaderboardPanels 
} = require('../database/db');

function getMedal(index) {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `\`#${index + 1}\``;
}

/**
 * สร้าง Embed และ Components ของกระดานผู้นำ
 */
function generateLeaderboardData() {
    const topCandies = getTopCandies(10);
    const topVoice = getTopVoiceMinutes(10);

    let candyText = '';
    if (topCandies.length === 0) {
        candyText = '*ยังไม่มีใครตุนลูกอมเลยเตง มาเปิดก่อนใครได้นะ*';
    } else {
        candyText = topCandies.map((u, i) => `${getMedal(i)} <@${u.userId}> — **${u.candy}** เม็ด`).join('\n');
    }

    let voiceText = '';
    if (topVoice.length === 0) {
        voiceText = '*ยังไม่มีคนเปิดไมค์คุยเลย เหงาจังงง*';
    } else {
        voiceText = topVoice.map((u, i) => {
            const totalMins = u.total_voice_minutes || 0;
            const hrs = Math.floor(totalMins / 60);
            const mins = totalMins % 60;
            const timeStr = hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
            return `${getMedal(i)} <@${u.userId}> — **${timeStr}**`;
        }).join('\n');
    }

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('🏆 ทำเนียบตัวตึงประจำเซิร์ฟ (Live Leaderboard)')
        .setDescription(
            'ส่องอันดับคนคลั่งรักเซิร์ฟ ใครรวยลูกอมหรือสิงห้องคุยเก่งสุด มาดูกัน! 🔥\n' +
            '⚡ ข้อมูลรีเฟรชอัตโนมัติทุกๆ 1 ชั่วโมงน้า\n' +
            '♾️ สถิติสะสมยาวๆ ยิ่งอยู่นานยิ่งตึง ไม่มีรีเซ็ตทิ้งแน่นอน\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        )
        .addFields(
            { name: '🍬 10 อันดับเศรษฐีลูกอมตึงๆ', value: candyText, inline: true },
            { name: '🎙️ 10 อันดับสายสิงห้องคุย (คอลนานจัดดด)', value: voiceText, inline: true },
            { 
                name: '💡 ทริคปั๊มลูกอมง่ายๆ', 
                value: 'แค่นั่งชิลในห้องคุย (Voice) ก็รับลูกอมไปเลย 10 เม็ดทุกๆ 1 ชม. (บอทแจก 1 เม็ดทุก 6 นาที) ยิ่งสิงนานกระเป๋ายิ่งตุง!', 
                inline: false 
            }
        )
        .setFooter({ text: 'รีเฟรชออโต้ทุก 1 ชม. • หรือกดปุ่มรีเฟรชเช็คสดๆ ได้เลยวัยรุ่น' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('leaderboard_refresh')
            .setLabel('รีเฟรชส่องอันดับสดๆ')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Primary)
    );

    return { embeds: [embed], components: [row] };
}

/**
 * วนลูปอัปเดตข้อความกระดานผู้นำในทุกเซิร์ฟเวอร์
 */
async function updateAllLeaderboardPanels(client) {
    try {
        const panels = getAllLeaderboardPanels();
        if (!panels || panels.length === 0) return;

        const data = generateLeaderboardData();

        for (const panel of panels) {
            try {
                const channel = await client.channels.fetch(panel.channelId).catch(() => null);
                if (!channel || !channel.isTextBased()) continue;

                const message = await channel.messages.fetch(panel.messageId).catch(() => null);
                if (!message) continue;

                await message.edit(data).catch(() => {});
            } catch (err) {
                console.warn(`[Leaderboard] ไม่สามารถอัปเดตแผงในห้อง ${panel.channelId}:`, err.message);
            }
        }
    } catch (error) {
        console.error('❌ [Leaderboard Updater Error]:', error);
    }
}

/**
 * เริ่มต้นระบบอัปเดตกระดานผู้นำอัตโนมัติทุกๆ 1 ชั่วโมง (3,600,000 ms)
 */
function startLeaderboardAutoUpdater(client) {
    console.log('🏆 [Leaderboard] เริ่มต้นระบบอัปเดตกระดานผู้นำอัตโนมัติ (ทุก 1 ชั่วโมง)...');

    // อัปเดตรอบแรกหลังจากบอทเปิดขึ้นมา 5 วินาที
    setTimeout(() => {
        updateAllLeaderboardPanels(client);
    }, 5000);

    // วนลูปอัปเดตทุกๆ 1 ชั่วโมง (60 นาที)
    setInterval(() => {
        updateAllLeaderboardPanels(client);
    }, 60 * 60 * 1000);
}

module.exports = {
    generateLeaderboardData,
    updateAllLeaderboardPanels,
    startLeaderboardAutoUpdater
};
