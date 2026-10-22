const { EmbedBuilder } = require('discord.js');
const config = require('../config');

// ลิงก์ตรงรูป QR Code โอนเงิน (ส่งไวระดับ 0.02 วินาที ไม่ต้องรออัปโหลดไฟล์!)
const QR_IMAGE_URL = process.env.PAYMENT_QR_URL || 'https://i.postimg.cc/jdnj5jvs/6cd7230b-c4ee-4ce7-90a6-b264ff960959.jpg';

/**
 * สร้าง Embed ข้อมูลชำระเงินพร้อมรูป QR Code จากลิงก์ตรง PostImages
 */
function getPaymentPayload() {
  const paymentEmbed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('💳 ช่องทางการชำระเงิน')
    .setDescription(
      `💸 **ข้อมูลบัญชีสำหรับโอนเงิน:**\n\n` +
      `📱 **พร้อมเพย์ (PromptPay):**\n` +
      `\`\`\`\n${config.payment.promptpayNumber}\n\`\`\`\n` +
      `👤 **ชื่อบัญชี:** \`${config.payment.promptpayName}\`\n` +
      (config.payment.bankName ? `🏛️ **ธนาคาร:** \`${config.payment.bankName}\`\n` : '') +
      `\n━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 แตะเลขพร้อมเพย์ด้านบนเพื่อคัดลอกไปโอนได้เลยค่ะ\n` +
      `⚠️ เมื่อโอนเงินเสร็จแล้ว **ส่งรูปสลิปในห้องนี้** ได้ทันที ระบบจะตรวจสลิปให้อัตโนมัติค่ะ ✨`
    )
    .setImage(QR_IMAGE_URL)
    .setFooter({ text: 'Fresshy shop • โอนเงินได้ทุกธนาคารตลอด 24 ชม.' })
    .setTimestamp();

  return { embeds: [paymentEmbed], files: [] };
}

module.exports = { getPaymentPayload };
