const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('setup-ticket')
    .setDescription('ส่งแผงข้อความสำหรับกดเปิดตั๋วสั่งซื้อ (Ticket Panel)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('ห้องที่ต้องการให้ส่งแผงตั๋ว (เช่น 🎫 • เปิดตั๋วสั่งซื้อ)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('shop-stats')
    .setDescription('ดูสถิติร้านค้า (จำนวนตั๋ว และ สลิปที่ตรวจสอบ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('payment-info')
    .setDescription('แสดงข้อมูลช่องทางการชำระเงินของร้านค้า'),

  new SlashCommandBuilder()
    .setName('sync-auto-role')
    .setDescription('มอบยศเริ่มต้น (Auto-Role) ให้กับสมาชิกทุกคนที่อยู่ในเซิร์ฟเวอร์ตอนนี้')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

async function deployCommands(clientId = null, targetGuildId = null) {
  if (!config.token) {
    console.error('❌ ไม่พบ DISCORD_TOKEN ในไฟล์ .env กรุณากรอกโทเคนก่อนรัน deploy');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    const id = clientId || await getClientId(rest);
    const gid = targetGuildId || config.guildId;

    if (gid) {
      await rest.put(
        Routes.applicationGuildCommands(id, gid),
        { body: commands.map(cmd => cmd.toJSON()) }
      );
      console.log(`✅ ลงทะเบียนคำสั่งสำเร็จในเซิร์ฟเวอร์ Guild ID: ${gid}`);
    } else {
      await rest.put(
        Routes.applicationCommands(id),
        { body: commands.map(cmd => cmd.toJSON()) }
      );
      console.log('✅ ลงทะเบียนคำสั่งแบบ Global สำเร็จ (อาจใช้เวลาอัปเดต 1-5 นาที)');
    }
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ deploy commands:', error.message || error);
  }
}

async function getClientId(rest) {
  const user = await rest.get(Routes.user());
  return user.id;
}

if (require.main === module) {
  deployCommands();
}

module.exports = { commands, deployCommands };
