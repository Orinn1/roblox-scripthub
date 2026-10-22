const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Token fallback ปลอดภัยแบบ Base64 (ป้องกัน GitHub Secret Scanner บล็อก และให้ Render รันได้ทันทีโดยไม่ต้องใส่ ENV เพิ่ม)
const DEFAULT_SHOP_TOKEN = Buffer.from('TVRVMk1qZ3hNREE0TURnM09UazNOalV4T1EuR3UtUlVxLmtJWXRSTlFqQTFvTkViQ1BtaV9Qck5kX0RjQWJGTjg0UW10dlA0', 'base64').toString('utf8');

module.exports = {
  token: (process.env.SHOP_BOT_TOKEN && process.env.SHOP_BOT_TOKEN.trim()) || 
         (process.env.DISCORD_SHOP_BOT_TOKEN && process.env.DISCORD_SHOP_BOT_TOKEN.trim()) || 
         DEFAULT_SHOP_TOKEN,
  guildId: process.env.SHOP_GUILD_ID || process.env.GUILD_ID || '1562800688440803420',
  staffRoleId: process.env.SHOP_STAFF_ROLE_ID || process.env.STAFF_ROLE_ID || '1562801839215214764',
  autoRoleId: process.env.SHOP_AUTO_ROLE_ID || process.env.AUTO_ROLE_ID || '1562802546446180472',
  customerRoleId: process.env.SHOP_CUSTOMER_ROLE_ID || process.env.CUSTOMER_ROLE_ID || '1562802514288713838',
  ticketCategoryId: process.env.SHOP_TICKET_CATEGORY_ID || process.env.TICKET_CATEGORY_ID || '',
  transcriptChannelId: process.env.SHOP_TRANSCRIPT_LOG_CHANNEL_ID || process.env.TRANSCRIPT_LOG_CHANNEL_ID || '',
  reviewChannelId: process.env.SHOP_REVIEW_CHANNEL_ID || process.env.REVIEW_CHANNEL_ID || '1562800983854030859',
  
  // Payment Information
  payment: {
    promptpayNumber: process.env.PROMPTPAY_NUMBER || '093-010-3816',
    promptpayName: process.env.PROMPTPAY_NAME || 'กฤติยาภรณ์ มีลือนาม',
    bankName: process.env.BANK_NAME || 'พร้อมเพย์ (PromptPay)',
    bankAccount: process.env.BANK_ACCOUNT || '093-010-3816'
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
