const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  token: process.env.DISCORD_TOKEN || '',
  guildId: process.env.GUILD_ID || '',
  staffRoleId: process.env.STAFF_ROLE_ID || '',
  autoRoleId: process.env.AUTO_ROLE_ID || '1562802546446180472',
  customerRoleId: process.env.CUSTOMER_ROLE_ID || '',
  ticketCategoryId: process.env.TICKET_CATEGORY_ID || '',
  transcriptChannelId: process.env.TRANSCRIPT_LOG_CHANNEL_ID || '',
  reviewChannelId: process.env.REVIEW_CHANNEL_ID || '1562800983854030859',
  
  // Payment Information
  payment: {
    promptpayNumber: process.env.PROMPTPAY_NUMBER || 'ยังไม่ได้ระบุ',
    promptpayName: process.env.PROMPTPAY_NAME || 'ยังไม่ได้ระบุ',
    bankName: process.env.BANK_NAME || 'ธนาคารทั่วไป',
    bankAccount: process.env.BANK_ACCOUNT || 'ยังไม่ได้ระบุ'
  },

  // Color theme for embeds (Hex)
  colors: {
    primary: 0x5865F2,   // Blurple
    success: 0x57F287,   // Green
    warning: 0xFEE75C,   // Yellow
    danger: 0xED4245,    // Red
    info: 0x00B0FF       // Cyan
  }
};
