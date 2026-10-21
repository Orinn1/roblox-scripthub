/**
 * 🎰 Role Gacha Engine (Weighted Random Algorithm)
 * ระบบคำนวณการสุ่มกาชารับยศตามเปอร์เซ็นต์และน้ำหนัก (Weighted Random)
 */
const { getGachaPool } = require('../database/db');

/**
 * คำนวณการสุ่มยศจากตู้กาชาของเซิร์ฟเวอร์
 */
function spinGacha(guildId) {
    const pool = getGachaPool(guildId);

    if (!pool || pool.length === 0) {
        return {
            success: false,
            message: 'ยังไม่มีการตั้งค่ายศในตู้กาชาของเซิร์ฟเวอร์นี้ (กรุณาแจ้งแอดมิน)'
        };
    }

    // คำนวณผลรวมของน้ำหนักทั้งหมด
    const totalWeight = pool.reduce((sum, item) => sum + Number(item.weight), 0);

    if (totalWeight <= 0) {
        return {
            success: false,
            message: 'ค่าน้ำหนักเรทในตู้กาชาไม่ถูกต้อง กรุณาติดต่อแอดมิน'
        };
    }

    // สุ่มตัวเลขระหว่าง 0 ถึง totalWeight
    const random = Math.random() * totalWeight;
    let accumulatedWeight = 0;

    for (const item of pool) {
        accumulatedWeight += Number(item.weight);
        if (random <= accumulatedWeight) {
            // คำนวณเปอร์เซ็นต์ที่แท้จริง
            const realPercent = ((Number(item.weight) / totalWeight) * 100).toFixed(2);
            return {
                success: true,
                item: {
                    ...item,
                    percent: realPercent
                }
            };
        }
    }

    // Fallback เผื่อทศนิยมปัดเศษ
    const lastItem = pool[pool.length - 1];
    return {
        success: true,
        item: {
            ...lastItem,
            percent: ((Number(lastItem.weight) / totalWeight) * 100).toFixed(2)
        }
    };
}

/**
 * ดึงรายการเรทและโอกาสออกของทุกยศในตู้
 */
function getGachaRateList(guildId) {
    const pool = getGachaPool(guildId);
    if (!pool || pool.length === 0) return [];

    const totalWeight = pool.reduce((sum, item) => sum + Number(item.weight), 0);

    return pool.map(item => ({
        roleId: item.roleId,
        roleName: item.roleName,
        weight: item.weight,
        rarity: item.rarity,
        percent: totalWeight > 0 ? ((Number(item.weight) / totalWeight) * 100).toFixed(2) : '0.00'
    }));
}

module.exports = {
    spinGacha,
    getGachaRateList
};
