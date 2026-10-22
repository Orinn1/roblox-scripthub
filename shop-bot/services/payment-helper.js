const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * สร้าง Embed ข้อมูลชำระเงินแบบ Clean Text 100% (ไม่โหลดรูป ตอบกลับทันที 0.001 วินาที ไม่ต้องรอโหลด)
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
    .setFooter({ text: 'Fresshy shop • โอนเงินได้ทุกธนาคารตลอด 24 ชม.' })
    .setTimestamp();

  return { embeds: [paymentEmbed], files: [] };
}

module.exports = { getPaymentPayload };
