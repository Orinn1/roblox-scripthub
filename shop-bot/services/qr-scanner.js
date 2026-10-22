const crypto = require('crypto');
const Jimp = require('jimp');
const jsQR = require('jsqr');

const THAI_BANKS = {
  '002': 'ธนาคารกรุงเทพ (BBL)',
  '004': 'ธนาคารกสิกรไทย (KBANK)',
  '006': 'ธนาคารกรุงไทย (KTB)',
  '011': 'ทีเอ็มบีธนชาต (TTB)',
  '014': 'ธนาคารไทยพาณิชย์ (SCB)',
  '025': 'ธนาคารกรุงศรีอยุธยา (BAY)',
  '069': 'ธนาคารเกียรตินาคินภัทร (KKP)',
  '022': 'ธนาคารซีไอเอ็มบีไทย (CIMB)',
  '067': 'ธนาคารทิสโก้ (TISCO)',
  '071': 'ธนาคารไทยเครดิต (TCRB)',
  '073': 'ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)',
  '030': 'ธนาคารออมสิน (GSB)',
  '034': 'ธ.ก.ส. (BAAC)',
  '033': 'ธนาคารอาคารสงเคราะห์ (GHB)',
  '066': 'ธนาคารอิสลามแห่งประเทศไทย (ISBT)',
  '107': 'ทรูมันนี่ วอลเล็ท (TrueMoney)'
};

/**
 * Parse EMVCo Tag-Length-Value (TLV) string format commonly used by PromptPay & Thai Banks
 */
function parseEMVCo(data) {
  const result = {};
  if (!data || typeof data !== 'string') return result;
  let index = 0;

  while (index < data.length) {
    if (index + 4 > data.length) break;
    const tag = data.substring(index, index + 2);
    const length = parseInt(data.substring(index + 2, index + 4), 10);
    index += 4;

    if (isNaN(length) || length < 0 || index + length > data.length) break;
    const value = data.substring(index, index + length);
    index += length;

    result[tag] = value;
  }
  return result;
}

/**
 * Extract Bank Slip details from QR Code raw data
 */
function extractSlipDetails(rawQr) {
  const hash = crypto.createHash('sha256').update(rawQr).digest('hex');
  let refId = null;
  let bankCode = null;
  let isPaymentQR = false;

  try {
    const tags = parseEMVCo(rawQr);

    // 1. ตรวจสอบว่าคือ QR Code รับเงิน (PromptPay) หรือไม่
    // Tag 29 คือ AID A000000677010111
    if (tags['29']) {
      const tag29 = parseEMVCo(tags['29']);
      if (tag29['00'] === 'A000000677010111' && (tags['01'] === '11' || !tags['62'])) {
        isPaymentQR = true;
      }
    }

    // 2. ตรวจสอบสลิปแบบ Direct Mini QR (กสิกรไทย KBank, SCB, KTB) ที่เริ่มด้วย Tag 00
    // เช่น 0041000600000101030040220...
    if (tags['00']) {
      const sub00 = parseEMVCo(tags['00']);
      if (sub00['01'] && sub00['01'].length === 3) {
        bankCode = sub00['01'];
      }
      if (sub00['02']) {
        refId = sub00['02'];
      }
    }

    // 3. ตรวจสอบสลิปมาตรฐาน Tag 30 (AID: A000000677010112)
    if (tags['30']) {
      const tag30 = parseEMVCo(tags['30']);
      if (tag30['01']) bankCode = tag30['01'];
      if (tag30['02']) refId = tag30['02'];
    }

    // 4. ตรวจสอบ Tag 62 (Additional Data Field)
    if (tags['62'] && !refId) {
      const subTags = parseEMVCo(tags['62']);
      if (subTags['05']) refId = subTags['05'];
      else if (subTags['07']) refId = subTags['07'];
      else if (subTags['01']) refId = subTags['01'];
    }

    // 5. ตรวจสอบ Tag อื่นๆ ในกรณีไม่พบ
    if (!isPaymentQR && !refId) {
      for (const t of ['31']) {
        if (tags[t]) {
          const sub = parseEMVCo(tags[t]);
          if (sub['02']) {
            refId = sub['02'];
            break;
          }
        }
      }
    }
  } catch (err) {
    // Parsing error ignored, fall back to hash
  }

  // หากไม่มีรหัสอ้างอิงเฉพาะ ให้ใช้รหัสย่อจาก Hash
  if (!refId) {
    refId = `REF-${hash.substring(0, 12).toUpperCase()}`;
  }

  const bankName = bankCode ? (THAI_BANKS[bankCode] || `ธนาคารรหัส ${bankCode}`) : null;

  return {
    rawQr,
    hash,
    refId,
    bankCode,
    bankName,
    isPaymentQR,
    scannedAt: new Date().toISOString()
  };
}

/**
 * Scan an image buffer or URL for QR codes
 * Uses multiple preprocessing filters if initial scan fails
 */
async function scanQRCodeFromImage(imageBufferOrUrl) {
  try {
    let input = imageBufferOrUrl;

    // If input is an HTTP(S) URL, download it safely with modern fetch to avoid Discord CDN issues
    if (typeof imageBufferOrUrl === 'string' && /^https?:\/\//i.test(imageBufferOrUrl)) {
      const response = await fetch(imageBufferOrUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DiscordBot/1.0'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: HTTP ${response.status} ${response.statusText}`);
      }
      const arrayBuf = await response.arrayBuffer();
      input = Buffer.from(arrayBuf);
    }

    const image = await Jimp.read(input);

    // Pass 1: Original Image
    let qr = scanBitmap(image.bitmap);
    if (qr) {
      return { success: true, ...extractSlipDetails(qr.data) };
    }

    // Pass 2: Greyscale + Contrast Boost (Handles camera shots/dim lighting)
    const cloned = image.clone();
    cloned.greyscale().contrast(0.3);
    qr = scanBitmap(cloned.bitmap);
    if (qr) {
      return { success: true, ...extractSlipDetails(qr.data) };
    }

    // Pass 3: Proportional Resize for high-resolution mobile screenshots
    const maxDim = Math.max(image.bitmap.width, image.bitmap.height);
    if (maxDim > 1400) {
      const scale = 1200 / maxDim;
      const targetW = Math.round(image.bitmap.width * scale);
      const targetH = Math.round(image.bitmap.height * scale);
      const resized = image.clone().resize(targetW, targetH).greyscale();
      qr = scanBitmap(resized.bitmap);
      if (qr) {
        return { success: true, ...extractSlipDetails(qr.data) };
      }
    }

    return {
      success: false,
      reason: 'QR_NOT_FOUND',
      message: 'ไม่พบ QR Code ในรูปภาพ กรุณาใช้สลิปโอนเงินที่มี Mini QR Code ชัดเจน'
    };
  } catch (error) {
    console.error('[QR Scanner Error]:', error.message || error);
    return {
      success: false,
      reason: 'SCAN_ERROR',
      message: 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่อีกครั้ง'
    };
  }
}

function scanBitmap(bitmap) {
  try {
    const { width, height, data } = bitmap;
    return jsQR(new Uint8ClampedArray(data), width, height, {
      inversionAttempts: 'attemptBoth'
    });
  } catch {
    return null;
  }
}

module.exports = {
  scanQRCodeFromImage,
  extractSlipDetails,
  parseEMVCo,
  THAI_BANKS
};
