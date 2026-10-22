const path = require('path');
const fs = require('fs');
const { scanQRCodeFromImage, extractSlipDetails } = require('./services/qr-scanner');
const db = require('./database');

async function testQr(imagePath) {
  const targetPath = imagePath || path.join(__dirname, 'assets', 'payment-qr.jpg');

  console.log('====================================================');
  console.log('🔍 ทดสอบระบบสแกน QR Code');
  console.log(`📁 ไฟล์รูปภาพ: ${targetPath}`);
  console.log('====================================================\n');

  if (!fs.existsSync(targetPath)) {
    console.error(`❌ ไม่พบไฟล์รูปภาพที่: ${targetPath}`);
    console.log('👉 การใช้งาน: node test-qr.js [path-ของรูปสลิป]');
    return;
  }

  const result = await scanQRCodeFromImage(targetPath);

  if (!result.success) {
    console.log(`❌ ผลลัพธ์: ไม่พบ QR Code หรือเกิดข้อผิดพลาด`);
    console.log(`สาเหตุ: ${result.message}`);
    return;
  }

  console.log('✅ พบ QR Code ในรูปภาพ!');
  console.log('----------------------------------------------------');
  console.log(`• ข้อมูลดิบ QR (Raw): ${result.rawQr}`);
  console.log(`• ธนาคาร (Bank):     ${result.bankName || 'ธนาคารทั่วไป (ไม่ระบุ)'}`);
  console.log(`• รหัสอ้างอิง (Ref ID): ${result.refId || 'N/A'}`);
  console.log(`• Hash (SHA-256):     ${result.hash}`);
  console.log(`• เป็น QR รับเงิน?:   ${result.isPaymentQR ? '⚠️ ใช่ (QR พร้อมเพย์ ไม่ใช่สลิป)' : '🧾 ไม่ใช่ (เป็นสลิปโอนเงิน)'}`);
  console.log('----------------------------------------------------\n');

  // ตรวจสอบในระบบฐานข้อมูล
  const existing = db.findSlipByHash(result.hash) || db.findSlipByRefId(result.refId);
  if (existing) {
    console.log(`⚠️ ผลตรวจสลิปซ้ำ: ตรวจพบสลิปนี้ในระบบแล้ว! (ส่งเมื่อ: ${existing.createdAt})`);
  } else {
    console.log(`🎉 ผลตรวจสลิปซ้ำ: ผ่านฉลุย! (ไม่เคยมีการส่งสลิปนี้มาก่อน)`);
  }
}

const inputArg = process.argv[2];
testQr(inputArg);
