const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// แคช Discord CDN URL ของรูป QR Code (เมื่อมี URL แล้ว จะส่งผ่าน JSON เพียวๆ ใน 0.03 วินาที!)
let cachedQrUrl = process.env.PAYMENT_QR_URL || null;

/**
 * สร้าง Embed ข้อมูลชำระเงินและ QR Code (รองรับ Fast CDN Cache ส่งไวระดับมิลลิวินาที)
 */
function getPaymentPayload() {
  const paymentEmbed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('💳 ช่องทางการชำระเงิน')
    .setDescription(
      `• **ชื่อบัญชี:** \`${config.payment.promptpayName}\`\n` +
      `• **พร้อมเพย์:** \`${config.payment.promptpayNumber}\`\n` +
      (config.payment.bankName ? `• **ธนาคาร:** \`${config.payment.bankName}\`\n` : '') +
      `\n📱 สแกน QR ด้านล่างเพื่อโอนเงินได้เลยนะคะ\n` +
      `⚠️ โอนเสร็จแล้ว **ส่งรูปสลิปในห้องนี้** ได้เลยน้า ระบบจะตรวจสลิปให้อัตโนมัติค่ะ!`
    )
    .setFooter({ text: 'Fresshy shop • สแกนจ่ายได้ทุกธนาคาร' })
    .setTimestamp();

  // ⚡ INSTANT FAST MODE: หากมี CDN URL ในแคช ไม่ต้องส่งไฟล์ซ้ำ ส่ง JSON เพียวๆ ใน 0.03 วิ!
  if (cachedQrUrl) {
    paymentEmbed.setImage(cachedQrUrl);
    return { embeds: [paymentEmbed], files: [] };
  }

  const qrPath = path.join(__dirname, '..', 'assets', 'payment-qr.jpg');
  const files = [];

  if (fs.existsSync(qrPath)) {
    try {
      const qrAttachment = new AttachmentBuilder(qrPath, { name: 'payment-qr.jpg' });
      files.push(qrAttachment);
      paymentEmbed.setImage('attachment://payment-qr.jpg');
    } catch (err) {
      console.warn('[Payment Helper] Failed to attach QR image:', err.message);
    }
  }

  // ห้ามใส่ flags ใน payload เด็ดขาด เพื่อให้ส่งได้ทั้ง editReply และ send
  return { embeds: [paymentEmbed], files };
}

function cacheQrUrl(url) {
  if (url && typeof url === 'string') {
    cachedQrUrl = url;
    console.log('⚡ [Payment Helper]: บันทึก CDN URL ของ QR Code สำเร็จ ครั้งต่อไปจะส่งทันทีใน 0.03 วิ!');
  }
}

module.exports = { getPaymentPayload, cacheQrUrl };
