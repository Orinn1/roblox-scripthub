const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

/**
 * สร้าง Embed ข้อมูลชำระเงินและ QR Code (ไม่รวม flags ใน payload ป้องกัน Discord REST 400)
 */
function getPaymentPayload() {
  const qrPath = path.join(__dirname, '..', 'assets', 'payment-qr.jpg');
  const files = [];

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

module.exports = { getPaymentPayload };
