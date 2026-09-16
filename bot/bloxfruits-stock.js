const { EmbedBuilder } = require('discord.js');

let cachedStock = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // แคช 2 นาที

// สัญลักษณ์อีโมจิแยกตามความหายากของผล
const RARITY_ICONS = {
    'Common': '⚪',
    'Uncommon': '🟢',
    'Rare': '🔵',
    'Legendary': '🟣',
    'Mythical': '🔴'
};

const RARITY_COLORS = {
    'Common': 0xa0a0a0,
    'Uncommon': 0x22c55e,
    'Rare': 0x3b82f6,
    'Legendary': 0xa855f7,
    'Mythical': 0xef4444
};

function parseBalancedJson(str, startIndex = 0) {
    const start = str.indexOf('{', startIndex);
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < str.length; i++) {
        const char = str[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (char === '\\') {
            escape = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (char === '{') depth++;
            else if (char === '}') {
                depth--;
                if (depth === 0) {
                    const jsonStr = str.slice(start, i + 1);
                    return JSON.parse(jsonStr);
                }
            }
        }
    }
    return null;
}

function extractStockFromHtml(html) {
    try {
        const marker = '\\"initialSnapshot\\":';
        const startIdx = html.indexOf(marker);
        if (startIdx !== -1) {
            const chunk = html.slice(startIdx + marker.length, startIdx + 40000);
            const unescaped = chunk.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            return parseBalancedJson(unescaped, 0);
        }

        const unescapedMarker = '"initialSnapshot":';
        const uIdx = html.indexOf(unescapedMarker);
        if (uIdx !== -1) {
            return parseBalancedJson(html, uIdx + unescapedMarker.length);
        }

        return null;
    } catch (err) {
        console.error('[BloxFruits Stock] Parsing error:', err.message);
        return null;
    }
}

/**
 * ดึงข้อมูลผลไม้ในร้านค้าปัจจุบัน
 * @param {boolean} forceRefresh - บังคับดึงข้อมูลใหม่โดยไม่ใช้แคช
 */
async function getBloxFruitsStock(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedStock && (now - lastFetchTime < CACHE_TTL_MS)) {
        return cachedStock;
    }

    try {
        const res = await fetch('https://bloxfruitsvalues.com/stock', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'th,en-US;q=0.9,en;q=0.8'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const html = await res.text();
        const data = extractStockFromHtml(html);

        if (!data || !data.normal) {
            throw new Error('Could not parse stock snapshot');
        }

        cachedStock = {
            normal: {
                startedAt: data.normal.window?.startedAt || (now - 3600000),
                resetsAt: data.normal.window?.resetsAt || (now + 10800000),
                periodMs: data.normal.window?.periodMs || 14400000,
                fruits: data.normal.fruits || []
            },
            mirage: {
                startedAt: data.mirage?.window?.startedAt || (now - 1800000),
                resetsAt: data.mirage?.window?.resetsAt || (now + 5400000),
                periodMs: data.mirage?.window?.periodMs || 7200000,
                fruits: data.mirage?.fruits || []
            },
            fetchedAt: now
        };

        lastFetchTime = now;
        return cachedStock;
    } catch (err) {
        console.warn(`⚠️ [BloxFruits Stock] ดึงข้อมูลสดไม่สำเร็จ (${err.message}) กำลังใช้ข้อมูลสำรอง...`);
        if (cachedStock) return cachedStock;

        // Fallback data หากเชื่อมต่อไม่ได้
        return {
            normal: {
                startedAt: now - 3600000,
                resetsAt: now + 10800000,
                periodMs: 14400000,
                fruits: [
                    { name: 'Rocket', rarity: 'Common', beliPrice: 5000, robuxPrice: 50 },
                    { name: 'Spin', rarity: 'Common', beliPrice: 7500, robuxPrice: 75 },
                    { name: 'Flame', rarity: 'Uncommon', beliPrice: 250000, robuxPrice: 550 },
                    { name: 'Dark', rarity: 'Uncommon', beliPrice: 500000, robuxPrice: 950 }
                ]
            },
            mirage: {
                startedAt: now - 1800000,
                resetsAt: now + 5400000,
                periodMs: 7200000,
                fruits: [
                    { name: 'Rocket', rarity: 'Common', beliPrice: 5000, robuxPrice: 50 },
                    { name: 'Dark', rarity: 'Uncommon', beliPrice: 500000, robuxPrice: 950 },
                    { name: 'Light', rarity: 'Rare', beliPrice: 650000, robuxPrice: 1100 },
                    { name: 'Magma', rarity: 'Rare', beliPrice: 960000, robuxPrice: 1300 }
                ]
            },
            isFallback: true,
            fetchedAt: now
        };
    }
}

function getRarityIcon(rarity) {
    return RARITY_ICONS[rarity] || '⚪';
}

function getRarityColor(rarity) {
    return RARITY_COLORS[rarity] || 0x38bdf8;
}

function createStockEmbed(stock, { isLive = false, dealer = 'all' } = {}) {
    const normalResetUnix = Math.floor(stock.normal.resetsAt / 1000);
    const mirageResetUnix = Math.floor(stock.mirage.resetsAt / 1000);

    const highTierNormal = stock.normal.fruits.filter(f => f.rarity === 'Legendary' || f.rarity === 'Mythical');
    const highTierMirage = stock.mirage.fruits.filter(f => f.rarity === 'Legendary' || f.rarity === 'Mythical');

    let embedColor = 0x38bdf8;
    if (highTierNormal.length > 0 || highTierMirage.length > 0) {
        embedColor = 0xa855f7; // ม่วงเข้มเมื่อมีผลแรร์
    }

    const title = isLive 
        ? '🍇 [กระดานสด 24 ชม.] ร้านค้าผลปีศาจ Blox Fruits (Live Stock)' 
        : '🍇 ตรวจสอบผลปีศาจในร้านค้า Blox Fruits (Live Stock)';

    const description = isLive
        ? `🟢 **กระดานอัปเดตอัตโนมัติ 24 ชม.** *(ข้อความนี้จะแก้ไขและอัปเดตข้อมูลสดให้ตลอดโดยไม่ต้องพิมพ์ใหม่)*\n` +
          (highTierNormal.length > 0 || highTierMirage.length > 0
            ? `🔥 **ผลยอดฮิตเข้าแล้ว:** ${[...highTierNormal, ...highTierMirage].map(f => `**${f.name}**`).join(', ')}`
            : `💡 ข้อมูลจะรีเซ็ตอัตโนมัติตามเวลาร้านค้าในเกม`)
        : `ข้อมูลสต็อกผลปีศาจแบบเรียลไทม์จากระบบร้านค้า Blox Fruits\n` +
          (highTierNormal.length > 0 || highTierMirage.length > 0
            ? `🔥 **ผลยอดฮิตเข้าแล้ว:** ${[...highTierNormal, ...highTierMirage].map(f => `**${f.name}**`).join(', ')}`
            : `💡 *Tip: ผลจะหมุนเวียนอัตโนมัติเมื่อถึงเวลารีเซ็ต*`);

    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(title)
        .setDescription(description)
        .setThumbnail('https://i.postimg.cc/cHdrRJVP/Rocket.png')
        .setFooter({ 
            text: isLive 
                ? 'BlacklistScriptx • กระดานสดอัปเดตอัตโนมัติ 24 ชม. | อัปเดตล่าสุด' 
                : 'BlacklistScriptx • ระบบติดตามผลปีศาจ Blox Fruits อัตโนมัติ' 
        })
        .setTimestamp();

    if (dealer === 'all' || dealer === 'normal') {
        const normalList = stock.normal.fruits.map(f => {
            const icon = getRarityIcon(f.rarity);
            const beli = typeof f.beliPrice === 'number' ? `$${f.beliPrice.toLocaleString()}` : '-';
            const robux = typeof f.robuxPrice === 'number' ? `R$ ${f.robuxPrice}` : '-';
            const tag = (f.rarity === 'Mythical' || f.rarity === 'Legendary') ? ' ⭐' : '';
            return `${icon} **${f.name}**${tag} \`[${f.rarity}]\` — 💵 ${beli} | 🪙 ${robux}`;
        }).join('\n');

        embed.addFields({
            name: `🏪 พ่อค้าปกติ (Normal Dealer) — รีเซ็ตใน: <t:${normalResetUnix}:R> (<t:${normalResetUnix}:T>)`,
            value: normalList || 'ไม่มีผลวางจำหน่ายในขณะนี้',
            inline: false
        });
    }

    if (dealer === 'all' || dealer === 'mirage') {
        const mirageList = stock.mirage.fruits.map(f => {
            const icon = getRarityIcon(f.rarity);
            const beli = typeof f.beliPrice === 'number' ? `$${f.beliPrice.toLocaleString()}` : '-';
            const robux = typeof f.robuxPrice === 'number' ? `R$ ${f.robuxPrice}` : '-';
            const tag = (f.rarity === 'Mythical' || f.rarity === 'Legendary') ? ' ⭐' : '';
            return `${icon} **${f.name}**${tag} \`[${f.rarity}]\` — 💵 ${beli} | 🪙 ${robux}`;
        }).join('\n');

        embed.addFields({
            name: `🏝️ พ่อค้าเกาะมายา (Mirage Dealer) — รีเซ็ตใน: <t:${mirageResetUnix}:R> (<t:${mirageResetUnix}:T>)`,
            value: mirageList || 'ไม่มีผลวางจำหน่ายในขณะนี้',
            inline: false
        });
    }

    return embed;
}

module.exports = {
    getBloxFruitsStock,
    getRarityIcon,
    getRarityColor,
    createStockEmbed,
    RARITY_ICONS
};

