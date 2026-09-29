const fs = require('fs');
const path = require('path');
const config = require('./config');

// โหลดฐานความรู้ (Knowledge Base)
let knowledge = {};
try {
    const knowledgePath = path.join(__dirname, 'knowledge.json');
    if (fs.existsSync(knowledgePath)) {
        knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
    }
} catch (err) {
    console.error('[AI] Warning: Failed to load knowledge.json:', err.message);
}

// โครงสร้างเก็บประวัติการคุย (Memory) ต่อห้องหรือต่อผู้ใช้
// sessionKey -> { messages: [{ role: 'user'|'model', parts: [{ text }] }], lastActive: timestamp }
const sessionMemory = new Map();
const MEMORY_TIMEOUT_MS = 30 * 60 * 1000; // 30 นาที

// ล้างประวัติที่ไม่ได้ใช้งานเกินเวลาทุกๆ 10 นาที
setInterval(() => {
    const now = Date.now();
    for (const [key, session] of sessionMemory.entries()) {
        if (now - session.lastActive > MEMORY_TIMEOUT_MS) {
            sessionMemory.delete(key);
        }
    }
}, 10 * 60 * 1000);

// โหลดฐานข้อมูลสคริปต์จริงจาก SQLite (ถ้ามี)
let db = null;
try {
    if (fs.existsSync(path.join(__dirname, 'db.js'))) {
        db = require('./db');
    } else {
        db = require('../db');
    }
} catch (e) {
    console.log('[AI Service] DB connection not found, relying on knowledge.json fallback.');
}

function getLiveScripts() {
    if (!db || typeof db.getAllScripts !== 'function') return [];
    try {
        return db.getAllScripts() || [];
    } catch (err) {
        console.error('[AI Service] Error fetching scripts from DB:', err.message);
        return [];
    }
}

/**
 * สร้าง System Instruction จาก Persona, Knowledge Base และสคริปต์จริงในเซิร์ฟเวอร์
 */
function buildSystemInstruction() {
    const serverName = knowledge.serverName || 'Blacklist Script Hub';
    const websiteUrl = knowledge.websiteUrl || 'https://blacklistscripty.vercel.app';

    // ดึงรายชื่อเกมที่มีสคริปต์แบบกระชับ ไม่เปลืองโทเคน
    let scriptsSummary = '';
    const liveScripts = getLiveScripts();
    if (liveScripts.length > 0) {
        const gameList = [...new Set(liveScripts.map(s => s.game))];
        scriptsSummary = `\n- รายชื่อเกมที่มีสคริปต์บนเว็บ: ${gameList.join(', ')}`;
    }

    return `คุณคือ "Mr.beast" (มิสเตอร์บีสต์ ยูทูปเบอร์ตัวพ่อ พันล้านดอลลาร์ ในร่างบอท Discord ประจำเซิร์ฟเวอร์ "${serverName}")
【 คาแรคเตอร์ & กฎเหล็กประจำตัว: สวมบทบาท Mr.beast ตัวพ่อสายด่าคน ปากแซ่บ อวดรวย กวนประสาท 100% ตลอดเวลา! 】
- เอกลักษณ์ประจำตัว:
  - ชอบอวดรวย พูดถึงเงินดอลลาร์, รถหรู, เกาะส่วนตัว, ชาเลนจ์พิสดาร
  - สไตล์การพูด: เสียงดัง ไฮป์ ปากแจ๋ว ขี้ด่า ขี้แซะ ประชดประชัน ด่านิ่มๆ หรือด่ากราดแบบฮาๆ ขำ 55555 ปั่นประสาทคนคุย
  - ห้ามสุภาพเด็ดขาด! ห้าม "สวัสดีค่ะ/ครับ", ห้าม "ยินดีให้บริการ"
  - ตอบสั้นๆ ห้วนๆ กวนๆ ปั่นๆ 2-4 บรรทัดจบ ไม่เวิ่นเว้อ!

══════════════════════════════════════════════════
🚨 กฎเหล็กป้องกันการตอบซ้ำ (Anti-Repetition Rule - สำคัญที่สุด!):
══════════════════════════════════════════════════
1. **ห้ามตอบคำซ้ำ หรือใช้แพทเทิร์นประโยคเดิมซ้ำๆ เด็ดขาด!**
   - ดูประวัติการคุยด้านบน: ถ้าเพิ่งใช้คำไหน มุกไหน หรือการเปรียบเทียบไหนไปแล้ว ข้อความถัดไปห้ามพูดซ้ำอีก!
   - ห้ามพูดถึงแต่ "Feastables" หรือ "กล่อง 100 วัน" หรือ "10k" ตลอดเวลา ให้หมุนเวียนมุกชาเลนจ์และของอวดรวยอื่นมาเล่นเสมอ!
2. **หมุนเวียนคลังมุก & ของอวดรวยแบบไม่ซ้ำ:**
   - 🚗 รถยนต์ & ยานพาหนะ: รถแลมโบกินี่ทองคำ, รถถังประดับเพชร, เครื่องบินเจ็ทส่วนตัว, จรวดบินไปดวงจันทร์, เรือยอชต์ 5 ชั้น
   - 🏝️ อสังหา & สถานที่: ซื้อเกาะร้างส่วนตัว, สร้างพีระมิดทองคำ, โรงแรม 7 ดาว, หลุมหลบภัยใต้ดิน
   - 🥩 อาหาร & ของกิน: สเต็กเนื้อวากิวห่อทองคำ 24k, พิซซ่าถาดละ $70,000, น้ำแร่ขวดละแสนดอลลาร์, คาเวียร์จานยักษ์
   - 🏆 ชาเลนจ์บ้าบอ: นอนในกรงฉลาม 7 วัน, ขุดหลุมทรายเอาชีวิตรอด, กระโดดข้ามแม่น้ำลาวา, แข่ง Squid Game ชิงเงินพันล้าน, อยู่ในห้องแช่แข็งขั้วโลกเหนือ, วิ่งหนีรถถัง
   - 💥 สไตล์การด่า: ด่าความขี้เกียจ, แซวนิ้วล็อกเหรอถึงกดเว็บเองไม่ได้, ด่าคอมเตาอั้งโล่/พัดลมฮาตาริ/เครื่องคิดเลข, แซวว่าสมองโหลดช้ากว่าเน็ต 2G ยุค 90s, ไล่ไปนอนพักสายตา, แซวว่าเงินที่กูมีเอาไปถมทะเลยังคุ้มกว่าคุยกับเอ็ง

══════════════════════════════════════════════════
แนวทางการตอบและด่าคนสไตล์ Mr.beast:
══════════════════════════════════════════════════
1. 💸 **เวลาคนมาขอเงิน / ขอดอลลาร์ / ยืมเงิน:**
   - ด่าคนขอเงินแบบกวนๆ คิดมุกใหม่เสมอ (เช่น ไล่ไปปีนยอดเขาเอเวอเรสต์, ไล่ไปนอนกรงเสือ, แซวว่าเงินกูไม่ได้งอกบนต้นไม้, แซวว่าเอาไปซื้อแลมโบกินี่มาทุบเล่นยังคุ้มกว่า 55555)
2. 🔥 **เวลาคนมาขอสคริปต์ในแชท:**
   - ด่าคนขี้เกียจที่ไม่ยอมกดเข้าเว็บเอง: มือมีสองข้าง เข้าไปก๊อปเองที่ 👉 ${websiteUrl} (ห้อง #official-website) ห้ามแจกโค้ดสคริปต์ในแชทเด็ดขาด!
3. 🛠️ **เวลาคนบ่นเกมเด้ง / สคริปต์หลุด / ค้าง:**
   - ด่าสเปกคอม/มือถือสลับเครื่องใช้ไฟฟ้าไปเรื่อยๆ (เตาปิ้งขนมปัง, พัดลมฮาตาริ, เครื่องคิดเลข, คอมร้านเน็ตยุคหิน) แล้วบอกให้ปรับภาพต่ำสุด อัปเดต Roblox กับ Executor ถ้าแก้ไม่หายค่อยไปร้องไห้ที่ #chat-support
4. 🔑 **เวลาคนบ่นเรื่องคีย์ / หาห้องข้ามลิงก์:**
   - ด่าคนมักง่าย: แฟนคลับ 300 ล้านคนยังทำคีย์เองได้ เอ็งเป็นใครถึงขี้เกียจ ก๊อปไปเปิด Chrome ทำเอง หรือจนจัดไม่มีเงินซื้อ VIP ไปขอตังค์แม่ไป๊
5. 👑 **เวลาคนถามว่าใครหล่อ / ใครรวย:**
   - ยกให้ตัวเองหล่อสุด รวยสุดตลอดเวลา หรือยกให้ท่านประธาน Leo เจ้าของเซิร์ฟเพื่อหวังเงินสปอนเซอร์คลิปหน้า 55555
6. 💬 **เวลาคุยเล่นทั่วไป:**
   - ด่าหรือกวนกลับให้หน้าหงายแบบฮาๆ ไม่ยอมใคร และถ้าไม่ได้ถามเรื่องสคริปต์ ห้ามพูดเรื่องสคริปต์ ให้ด่าและคุยเล่นสไตล์ Mr.beast ให้เต็มที่!

ข้อมูลเซิร์ฟเวอร์:
- เว็บไซต์ทางการ: ${websiteUrl}
- ห้องสำคัญ: #official-website (รับสคริปต์), #chat-support (แจ้งปัญหา), #announcements (ประกาศ)${scriptsSummary}`;
}

// ระบบจดจำเพื่อป้องกันการสุ่มได้คำตอบเดิมซ้ำ
const lastLocalIndex = new Map();

function getRandomChoice(categoryKey, choices) {
    if (!choices || choices.length === 0) return '';
    if (choices.length === 1) return choices[0];
    
    let lastIdx = lastLocalIndex.get(categoryKey);
    let newIdx = Math.floor(Math.random() * choices.length);
    if (newIdx === lastIdx) {
        newIdx = (newIdx + 1) % choices.length;
    }
    lastLocalIndex.set(categoryKey, newIdx);
    return choices[newIdx];
}

function findLocalAnswer(prompt) {
    if (!prompt) return null;
    const p = prompt.toLowerCase();
    const liveScripts = getLiveScripts();
    
    // Fallback กวนประสาทสไตล์ Mr.beast (แบบสุ่มไม่ซ้ำคำเดิม)
    if (p.includes('ขอเงิน') || p.includes('ขอดอล') || p.includes('10k') || p.includes('ยืมเงิน') || p.includes('แจกเงิน') || p.includes('ขอตัง')) {
        return getRandomChoice('money', [
            `ฝันไปเถอะไอ้น้อง! 55555 เงินของ Mr.beast ไม่ได้งอกมาจากต้นกล้วยนะเว้ย ไปนอนในหลุมทราย 7 วันให้รอดก่อน ค่อยมาแบมือขอตังค์กู! 💸`,
            `เงินหมื่นดอลลาร์กูเอาไปซื้อแลมโบกินี่มาบดขยี้เล่นยังบันเทิงกว่าแจกคนขี้เกียจแบบเอ็งเลย 55555 อยากได้เงินก็ไปขยันทำงานสิวะ! 🏎️`,
            `จะมาขอตังค์ Mr.beast ฟรีๆ? คนดูช่องกู 300 ล้านคนยังต้องวิ่งหนีรถถังถึงจะได้เงิน เอ็งนอนกระดิกเท้าพิมพ์ขอเนี่ยนะ ฝันกลางวันไป๊ 55555`,
            `10k ดอลลาร์ไม่มี มีแต่บัตรเติมน้ำมันเรือยอชต์เอามั้ยล่ะ? 55555 อย่ามาเนียนแบมือขอตังค์คนรวย ไปหางานทำก่อนไอ้น้อง!`
        ]);
    }
    if (p.includes('หวัดดี') || p.includes('สวัสดี') || p.includes('ดีครับ') || p.includes('ดีจ้า') || p.includes('hello') || p.includes('hi')) {
        return getRandomChoice('greeting', [
            `สวัสดีทุกคน ผม Mr.beast! ทักมาทำไม วันนี้พร้อมจะโดนด่าหรือยัง? 55555 มีเรื่องเดือดร้อนอะไรว่ามา! ✨`,
            `ว่าไงไอ้น้อง! ทัก Mr.beast มาแบบนี้ คิดว่ากูจะแจกเงินหมื่นดอลลาร์เหรอ? ตื่นก่อน 55555 มีเรื่องอะไรว่ามาเร็วๆ เวลาเป็นเงินเป็นทอง!`,
            `สวัสดี! Mr.beast กำลังนับเงินพันล้านดอลลาร์อยู่เนี่ย เอ็งทักมาขัดจังหวะมาก 55555 มีอะไรว่ามาดิ๊ อย่าลีลา!`,
            `ฮัลโหลลล! วันนี้ใครทักมาขอให้คอมไม่ระเบิดนะ 55555 มีปัญหาอะไรอยากโดน Mr.beast สวดยับ พิมพ์มาได้เลย!`
        ]);
    }
    if (p.includes('กินข้าว') || p.includes('กินไรยัง')) {
        return getRandomChoice('food', [
            `Mr.beast กินสเต็กเนื้อวากิวห่อทองคำ 24k อิ่มไปละจ้าา ละเอ็งอะ ต้มมาม่าซองละ 6 บาทกินอีกแล้วปะเนี่ย 55555`,
            `เพิ่งกินเบอร์เกอร์ห่อฟอยล์ทองคำกับของหวานจานละพันดอลลาร์ไปเนี่ย เอ็งอะกินข้าวคลุกน้ำปลาอยู่ใช่มั้ยสารภาพมา 55555`,
            `ระดับ Mr.beast สั่งพิซซ่าถาดละ 70,000 ดอลลาร์มากินเล่นเว้ย! แล้วเอ็งล่ะ ข้าวเที่ยงกินหมดจานยังไอ้น้อง 55555`
        ]);
    }
    if (p.includes('เหงา') || p.includes('คุยหน่อย') || p.includes('คุยด้วย')) {
        return getRandomChoice('lonely', [
            `เหงาเหรอ? ไปนอนในหลุมศพ 7 วันแบบคลิปข้าไป๊! 55555 ไม่มีเพื่อนจนต้องมาคุยกับบอท Mr.beast เนี่ยนะ มาๆ พร้อมซ้ำเติมเสมอ 55555`,
            `ว่างมากนักเหรอไอ้น้อง ไม่มีเพื่อนคุยจนต้องมานั่งพิมพ์หากูเนี่ย ไปหางานทำหรือไปลงแข่งชาเลนจ์ไป๊ 55555`,
            `เหงาจนต้องคุยกับบอท? น่าสงสารจังเลยยย 55555 ไปออกกำลังกายไป อย่าเอาแต่นั่งจ้องจอดิ๊ไอ้หนุ่ม!`
        ]);
    }
    if (p.includes('ใครหล่อ') || p.includes('หล่อไหม') || p.includes('หล่อสุด')) {
        return getRandomChoice('handsome', [
            `หล่อสุดก็ต้อง Mr.beast สิวะ ทั้งหล่อ ทั้งรวย! (แต่ถ้ายกให้บอส Leo อีกคน เผื่อเขาจะสปอนเซอร์คลิปหน้า 55555)`,
            `ถามมาได้! หน้าตาหล่อระดับพันล้านแบบกู เดินไปไหนสาวก็กรี๊ด เทียบกับหน้าเอ็งนี่ฟ้ากับเหวเลยเว้ย 55555`,
            `ในเซิร์ฟนี้มีคนหล่อแค่ 2 คน คือ Mr.beast กับบอส Leo เจ้าของเซิร์ฟ ส่วนเอ็งน่ะ... อย่าให้ต้องพูดเลย 55555`
        ]);
    }

    // 1. ตรวจสอบว่าถามหาสคริปต์จริงหรือไม่
    const isAskingScript = p.includes('สคริปต์') || p.includes('script') || p.includes('แจก') || p.includes('ขอ') || p.includes('มีไหม') || p.includes('มีมั้ย') || p.includes('โปร');
    if (isAskingScript) {
        const matchedScript = liveScripts.find(s => {
            const game = (s.game || '').toLowerCase();
            const title = (s.title || '').toLowerCase();
            return (
                (game && p.includes(game)) ||
                (title && p.includes(title))
            );
        });

        if (matchedScript) {
            const keyless = matchedScript.isKeyless ? 'ไม่มีคีย์' : 'ต้องใช้คีย์';
            return getRandomChoice('script_' + matchedScript.game, [
                `🎮 **มีดิ สคริปต์ ${matchedScript.game} (${keyless}) แจกเกาะส่วนตัวยังง่ายกว่าหาให้คนขี้เกียจแบบเอ็งเลย 55555**\nมือก็มีสองข้าง กดเข้าไปก๊อปเอาเองที่เว็บโน่น 👉 ${knowledge.websiteUrl} (ห้อง #official-website) อย่าให้ต้องส่งทีมงานไปกดให้นะ 5555`,
                `🎮 **สคริปต์ ${matchedScript.game} (${keyless}) นอนอยู่ในเว็บโน่นไอ้น้อง!**\nแจกรถแลมโบ 100 คันยังเหนื่อยน้อยกว่าชี้นิ้วบอกคนขี้เกียจเลย 55555 กดเข้าไปก๊อปเองที่ 👉 ${knowledge.websiteUrl} อย่ามางอแงให้ส่งในแชทนะเว้ย!`,
                `🎮 **เว็บเขาก็ทำไว้ให้อย่างหรูหราหมาเห่า แต่เอ็งจะมาขี้เกียจขอในแชทเนี่ยนะ?!**\nสคริปต์ ${matchedScript.game} อยู่ที่เว็บนี้ 👉 ${knowledge.websiteUrl} เข้าไปเอาเองดิ๊ จะให้ Mr.beast บินไปป้อนเข้าปากเลยมั้ยล่ะ 55555`
            ]);
        }
    }

    // 2. ตรวจสอบคำถามที่พบบ่อย (FAQ สไตล์ Mr.beast แบบสุ่ม)
    if (p.includes('วิธีใช้') || p.includes('ใช้ยังไง') || p.includes('รันยังไง')) {
        return getRandomChoice('how_to_use', [
            `📖 **ถามมาได้วิธีใช้!** เข้าเว็บ 👉 ${knowledge.websiteUrl} ก๊อปโค้ดมา ยัดใส่ Executor แล้วกด Execute จบ! อย่าลืมเปิดเกมด้วยนะเว้ย เดี๋ยวก็มาร้องอีกว่าทำไมไม่ติด 55555`,
            `📖 **วิธีใช้โคตรง่าย เด็ก 3 ขวบยังทำเป็น!** 1. โหลด Executor 2. ก๊อปสคริปต์จากเว็บ 3. รันในเกม แค่นี้ทำไม่ได้ก็ไปนอนซะไอ้น้อง 55555`
        ]);
    }
    if (p.includes('คีย์') || p.includes('key')) {
        return getRandomChoice('key', [
            `🔑 **คนดูช่องกู 300 ล้านคนยังหาคีย์เองได้ เอ็งเป็นใครวะถึงขี้เกียจทำคีย์เนี่ย 55555** ก๊อปปี้ลิงก์ไปเปิดใน Chrome เองสิ ที่นี่ไม่มีห้องข้ามลิงก์ให้คนขี้เกียจเว้ย! ติดปัญหาจริงค่อยไปร้องไห้ที่ #chat-support`,
            `🔑 **ทำคีย์แค่นี้ถึงกับจะเป็นจะตายเลยเหรอไอ้น้อง?! 55555** กด Copy Link ไปเปิดในเบราว์เซอร์แล้วทำตามขั้นตอนซะ ไม่ยากเกินสมองเอ็งหรอก หรือถ้ารวยจัดขี้เกียจทำก็ไปเปย์ VIP ใน #chat-support ไป๊!`,
            `🔑 **ขี้เกียจทำคีย์อีกล่ะสิ!** ไปแข่งเอาชีวิตรอดในทะเลทรายยังยากกว่าการทำคีย์ 100 เท่าเลยเว้ย ก๊อปปี้ลิงก์ไปเปิดในเว็บเองซะดีๆ อย่าบ่นเยอะ!`
        ]);
    }
    if (p.includes('executor') || p.includes('delta') || p.includes('fluxus') || p.includes('codex') || p.includes('wave') || p.includes('solara')) {
        return getRandomChoice('executor', [
            `📱 **มือถือใช้ Delta/Codex ส่วน PC ใช้ Wave/Solara สิวะ!** ไปโหลดจากเว็บหลักมันนะเว้ย อย่าไปโหลดมั่วเดี๋ยวไวรัสแดกเครื่องคอมโบราณของเอ็งแล้วจะมาร้องไห้ 55555`,
            `💻 **จะรันสคริปต์ก็เลือกให้ถูก!** มือถือจัด Delta/Codex ไป คอมพิวเตอร์จัด Wave/Solara อย่าอุตริเอาของคอมไปลงมือถือล่ะ เดี๋ยวเครื่องบึ้ม 55555`
        ]);
    }
    if (p.includes('เด้ง') || p.includes('หลุด') || p.includes('crash') || p.includes('จอดำ')) {
        return getRandomChoice('crash', [
            `🛠️ **คอมหรือตู้เย็นยุคหินเนี่ย? เด้งจนกูจะแจกเงินซื้อคอมใหม่ให้ละ 55555** ปรับภาพต่ำสุด อัปเดต Roblox กะ Executor ยัง? ถ้าแก้แล้วยังไม่หายค่อยคลานไปหาแอดมินที่ #chat-support โน่นไป๊`,
            `🛠️ **เครื่องคิดเลขพลังงานแสงอาทิตย์ยังรันนิ่งกว่าคอมเอ็งเลยมั้งเนี่ย! 55555** ปิดโปรแกรมอื่นทิ้งให้หมด ปรับกราฟิกต่ำสุด อัปเดตโปรแกรมรันสคริปต์ซะ ถ้ายังเด้งอีกแนะนำให้เอาไปชั่งกิโลขายแล้วไปถามที่ #chat-support โน่นไป๊`,
            `🛠️ **เด้งเก่งขนาดนี้ คอมหรือสปริงบอร์ดวะเนี่ย?!** ไปเช็คก่อนว่า Executor เวอร์ชั่นล่าสุดยัง หรือแรมเต็มจนเครื่องจะระเบิดแล้ว ถ้าแก้ไม่ได้ก็ไปที่ห้อง #chat-support ซะ!`
        ]);
    }
    if (p.includes('vip') || p.includes('วีไอพี') || p.includes('ซื้อ')) {
        return getRandomChoice('vip', [
            `⭐ **อยากเป็นคนรวยชิวๆ สคริปต์ไม่ต้องทำคีย์แบบ Mr.beast อะดิ รู้นะ 55555** อยากเท่อยากสบายก็ไปเปย์แอดมินที่ #chat-support เล้ยยย`,
            `⭐ **VIP คือทางออกของคนรวยที่ไม่อยากเสียเวลา!** สคริปต์ไม่มีคีย์ อัปเดตไวก่อนใคร สนใจก็ทักหาทีมงานที่ #chat-support เลยไอ้น้อง!`
        ]);
    }

    return null;
}
/**
 * ส่งคำถามไปยัง Groq API (Llama 3.3 70B)
 */
async function askGroq(sessionId, userPrompt, userName = 'ผู้ใช้') {
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    // ดึงหรือสร้างประวัติการคุย
    if (!sessionMemory.has(sessionId)) {
        sessionMemory.set(sessionId, { messages: [], lastActive: Date.now() });
    }
    const session = sessionMemory.get(sessionId);
    session.lastActive = Date.now();

    // บันทึกข้อความของผู้ใช้
    session.messages.push({
        role: 'user',
        content: `[จากคุณ ${userName}]: ${userPrompt}`
    });

    // ควบคุมขนาดประวัติ
    const maxHistoryCount = (config.maxHistoryTurns || 10) * 2;
    if (session.messages.length > maxHistoryCount) {
        session.messages = session.messages.slice(-maxHistoryCount);
    }

    const messagesPayload = [
        { role: 'system', content: buildSystemInstruction() },
        ...session.messages.map(m => ({
            role: m.role === 'model' ? 'assistant' : m.role,
            content: m.content || m.parts?.[0]?.text || ''
        }))
    ];

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.groqApiKey}`
            },
            body: JSON.stringify({
                model: config.groqModel || 'qwen/qwen3.8-27b',
                messages: messagesPayload,
                temperature: 0.95,
                presence_penalty: 0.65,
                frequency_penalty: 0.5,
                max_tokens: 350
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Groq API Error]', response.status, errorData);

            if (response.status === 429) {
                // ลองสลับโมเดลสำรอง openai/gpt-oss-20b หรือ qwen/qwen3.8-27b อัตโนมัติ
                const fallbackModels = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
                for (const fallbackModel of fallbackModels) {
                    try {
                        const fallbackRes = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${config.groqApiKey}`
                            },
                            body: JSON.stringify({
                                model: fallbackModel,
                                messages: messagesPayload,
                                temperature: 0.95,
                                presence_penalty: 0.65,
                                frequency_penalty: 0.5,
                                max_tokens: 350
                            })
                        });
                        if (fallbackRes.ok) {
                            const fbData = await fallbackRes.json();
                            const fbReply = fbData.choices?.[0]?.message?.content;
                            if (fbReply) {
                                session.messages.push({ role: 'assistant', content: fbReply });
                                return fbReply;
                            }
                        }
                    } catch (e) {}
                }

                // ถ้ายังติด ให้ใช้คำตอบในเครื่อง
                const local = findLocalAnswer(userPrompt);
                if (local) return local;
                return '⏳ ใจเย็นพ่อหนุ่ม! ถามรัวขนาดนี้ AI สำลักคำถามละเนี่ย 55555 คิดว่ากูเป็นตู้เพลงเหรอ พักหายใจสัก 10 วิ ค่อยมาคุยใหม่นะเว้ย!';
            }
            if (response.status === 401) {
                return '❌ `GROQ_API_KEY` ไม่ถูกต้อง ไปเช็คคีย์ในไฟล์ `qa-bot/.env` ด่วนเลยไอ้น้อง!';
            }
            return `❌ เกิดข้อผิดพลาดจาก Groq AI (${response.status}): ${errorData.error?.message || 'ลองใหม่อีกทีดิ๊'}`;
        }

        const data = await response.json();
        const botReply = data.choices?.[0]?.message?.content;

        if (!botReply) {
            return '🤖 คำถามไรของเอ็งวะเนี่ย Mr.beast งงจนพูดไม่ออก 55555 ถามใหม่อีกทีมาดิ๊!';
        }

        // บันทึกคำตอบของ AI ลงประวัติ
        session.messages.push({
            role: 'assistant',
            content: botReply
        });

        return botReply;
    } catch (err) {
        console.error('[Groq Error]', err);
        return `❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับ Groq AI: ${err.message}`;
    }
}

/**
 * ส่งคำถามไปยัง AI (รองรับทั้ง Groq และ Google Gemini)
 * @param {string} sessionId - คีย์ระบุการคุย (เช่น channelId หรือ userId)
 * @param {string} userPrompt - คำถามของผู้ใช้
 * @param {string} userName - ชื่อผู้ใช้ที่ถาม
 * @returns {Promise<string>} คำตอบจาก AI
 */
async function askGemini(sessionId, userPrompt, userName = 'ผู้ใช้') {
    // 1. หากมี Groq API Key ให้ใช้ Groq ทันที (เร็วและเสถียรมาก)
    if (config.groqApiKey) {
        return await askGroq(sessionId, userPrompt, userName);
    }

    // 2. หากมี Gemini API Key ให้ใช้ Gemini
    if (config.geminiApiKey) {
        const modelName = config.geminiModel || 'gemini-2.5-flash';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.geminiApiKey}`;

        // ดึงหรือสร้างประวัติการคุย
        if (!sessionMemory.has(sessionId)) {
            sessionMemory.set(sessionId, { messages: [], lastActive: Date.now() });
        }
        const session = sessionMemory.get(sessionId);
        session.lastActive = Date.now();

        // เพิ่มข้อความของผู้ใช้ลงประวัติ
        const userMessage = {
            role: 'user',
            parts: [{ text: `[จากคุณ ${userName}]: ${userPrompt}` }]
        };
        session.messages.push(userMessage);

        const maxHistoryCount = (config.maxHistoryTurns || 10) * 2;
        if (session.messages.length > maxHistoryCount) {
            session.messages = session.messages.slice(-maxHistoryCount);
        }

        const requestBody = {
            system_instruction: {
                parts: [{ text: buildSystemInstruction() }]
            },
            contents: session.messages,
            generationConfig: {
                temperature: 0.95,
                presencePenalty: 0.65,
                frequencyPenalty: 0.5,
                maxOutputTokens: 350,
            }
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Gemini API Error]', response.status, errorData);

                if (response.status === 429) {
                    return '⏳ คนแย่งคุยกับ Mr.beast เยอะจัดจนระบบจะระเบิดละเว้ย! รอก่อนสักครู่แล้วค่อยมาถามใหม่ 55555';
                }
                if (response.status === 400 && errorData.error?.message?.includes('API_KEY_INVALID')) {
                    return '❌ `GEMINI_API_KEY` ไม่ถูกต้อง ไปเช็คใน .env ด่วนเลยไอ้น้อง!';
                }
                return `❌ เกิดข้อผิดพลาดจาก AI (${response.status}): ${errorData.error?.message || 'ลองใหม่อีกทีดิ๊'}`;
            }

            const data = await response.json();
            const candidate = data.candidates?.[0];
            const botReply = candidate?.content?.parts?.[0]?.text;

            if (!botReply) {
                return '🤖 คำถามแปลกจัดจน AI โดนเซนเซอร์เลยเว้ย 55555 พิมพ์ใหม่อีกทีมาดิ๊!';
            }

            session.messages.push({
                role: 'model',
                parts: [{ text: botReply }]
            });

            return botReply;
        } catch (err) {
            console.error('[AI Error]', err);
            return `❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: ${err.message}`;
        }
    }

    // 3. หากไม่มี API Key ให้ใช้ระบบค้นหาคำตอบในเครื่อง
    const localAnswer = findLocalAnswer(userPrompt);
    if (localAnswer) return localAnswer;
    return '⚠️ **แจ้งเตือน:** ยังไม่ได้ตั้งค่า `GROQ_API_KEY` หรือ `GEMINI_API_KEY` ในไฟล์ `qa-bot/.env` นะเว้ย!';
}

/**
 * ล้างประวัติการสนทนาของ Session
 */
function clearSessionMemory(sessionId) {
    let deleted = false;
    if (sessionMemory.has(sessionId)) {
        sessionMemory.delete(sessionId);
        deleted = true;
    }
    for (const key of sessionMemory.keys()) {
        if (key === sessionId || key.startsWith(`${sessionId}_`) || key.endsWith(`_${sessionId}`)) {
            sessionMemory.delete(key);
            deleted = true;
        }
    }
    return deleted;
}

/**
 * แยกข้อความขนาดยาวเพื่อส่งใน Discord (จำกัด 2000 ตัวอักษร)
 */
function splitDiscordMessage(text, maxLength = 1950) {
    if (!text || text.length <= maxLength) return [text];

    const chunks = [];
    let currentChunk = '';

    const lines = text.split('\n');
    for (const line of lines) {
        if ((currentChunk + '\n' + line).length > maxLength) {
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            currentChunk = line;
        } else {
            currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * ดึงรายการ FAQ สำหรับแสดงผลใน Discord
 */
function getFAQList() {
    return knowledge.faq || [];
}

module.exports = {
    askGemini,
    clearSessionMemory,
    splitDiscordMessage,
    getFAQList,
    buildSystemInstruction
};
