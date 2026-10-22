const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  AttachmentBuilder,
  MessageFlags
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const http = require('http');
const config = require('./config');
const db = require('./database');
const { scanQRCodeFromImage } = require('./services/qr-scanner');
const { createTicketChannel, generateTranscript } = require('./services/ticket-manager');
const { deployCommands } = require('./deploy-commands');

// ==========================================
// 🌐 KEEP-ALIVE WEB SERVER (สำหรับ Render 24/7 เมื่อรันแยกเดี่ยว)
// ==========================================
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'online',
      bot: client.user ? client.user.tag : 'connecting',
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString()
    }));
  }).listen(PORT, () => {
    console.log(`🌐 Standalone keep-alive server is listening on port ${PORT} (Render ready)`);
  });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel]
});

// Bypass HTTP /gateway/bot to prevent Cloudflare/Render 429 rate-limiting
try {
  const { WebSocketManager } = require('@discordjs/ws');
  WebSocketManager.prototype.fetchGatewayInformation = async function() {
    return {
      url: 'wss://gateway.discord.gg',
      shards: 1,
      session_start_limit: { total: 1000, remaining: 999, reset_after: 0, max_concurrency: 1 }
    };
  };
} catch (e) {}

client.on('error', (err) => {
  console.error('⚠️ [Shop Bot Client Error]:', err.message || err);
});

client.on('shardError', (err) => {
  console.warn('⚠️ [Shop Bot Shard Error]:', err.message || err);
});

client.on('debug', (info) => {
  if (info.includes('Heartbeat') || info.includes('Connect') || info.includes('Identify') || info.includes('Session') || info.includes('Rate limit') || info.includes('429') || info.includes('Handshake')) {
    console.log(`🐰 [Shop Bot Debug]: ${info}`);
  }
});

// ==========================================
// 🚀 BOT READY EVENT
// ==========================================
client.once('ready', async () => {
  console.log('==================================================');
  console.log(`🐰 [Shop Bot Ready]: เข้าสู่ระบบในชื่อ: ${client.user.tag} (ID: ${client.user.id})`);
  console.log(`🏰 ประจำการอยู่ใน: ${client.guilds.cache.size} เซิร์ฟเวอร์`);
  console.log('==================================================');

  client.user.setPresence({
    activities: [{ name: '🎫 สั่งซื้อสินค้า & เช็คสลิป', type: 3 }],
    status: 'online'
  });

  // รันคำสั่ง Slash Commands ในพื้นหลังไม่บล็อกระบบ
  deployCommands(client.user.id).catch(() => {
    console.log('💡 Deploy commands will run when needed.');
  });
});

// เมื่อบอทถูกเชิญเข้าเซิร์ฟเวอร์ใหม่
client.on('guildCreate', async (guild) => {
  console.log(`🎉 บอทถูกเชิญเข้าเซิร์ฟเวอร์: ${guild.name} (ID: ${guild.id})`);
  try {
    await deployCommands(client.user.id, guild.id);
    console.log(`✅ ลงทะเบียน Slash Commands เข้า ${guild.name} สำเร็จ!`);
  } catch (err) {
    console.error('❌ Failed to deploy commands on guildCreate:', err.message);
  }
});

// ==========================================
// 👥 GUILD MEMBER ADD (AUTO-ROLE สมาชิกใหม่ทุกคน)
// ==========================================
client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;

  const roleId = config.autoRoleId;
  if (!roleId) return;

  try {
    const role = member.guild.roles.cache.get(roleId) || await member.guild.roles.fetch(roleId).catch(() => null);
    if (role) {
      await member.roles.add(role);
      console.log(`[Auto-Role] ✅ มอบยศ "${role.name}" ให้คุณ ${member.user.tag} (ID: ${member.id}) เรียบร้อยแล้ว`);
    } else {
      console.log(`[Auto-Role Warning] ⚠️ ไม่พบยศ ID: ${roleId} ในเซิร์ฟเวอร์ ${member.guild.name}`);
    }
  } catch (error) {
    console.error(`[Auto-Role Error] ไม่สามารถมอบยศให้ ${member.user.tag}:`, error.message);
  }
});

// ==========================================
// ⚡ INTERACTION CREATE (SLASH COMMANDS & BUTTONS)
// ==========================================
client.on('interactionCreate', async (interaction) => {
  try {
    // ----------------------------------------
    // 1. SLASH COMMANDS
    // ----------------------------------------
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      console.log(`📥 [Shop Bot]: ได้รับคำสั่ง /${commandName} จาก ${interaction.user.tag}`);

      // /setup-ticket
      if (commandName === 'setup-ticket') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        if (!targetChannel || !targetChannel.isTextBased()) {
          return interaction.editReply({
            content: '❌ กรุณาเลือกห้องข้อความ (Text Channel) ที่ถูกต้องค่ะ'
          });
        }

        const bannerPath = path.join(__dirname, 'assets', 'ticket-banner.png');
        const files = [];

        const panelEmbed = new EmbedBuilder()
          .setColor(config.colors.primary)
          .setTitle('🛒 สั่งซื้อสินค้า & สอบถาม')
          .setDescription(
            `กดปุ่ม **[ 🎫 เปิดตั๋วสั่งซื้อ ]** ด้านล่างได้เลยค่ะ ✨\n` +
            `🔒 *ระบบจะสร้างห้องส่วนตัวให้คุยกับแม่ค้าโดยตรง ปลอดภัย 100%*`
          )
          .setFooter({ text: 'Fresshy shop • ยินดีให้บริการตลอด 24 ชม.' })
          .setTimestamp();

        if (fs.existsSync(bannerPath)) {
          const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'ticket-banner.png' });
          files.push(bannerAttachment);
          panelEmbed.setImage('attachment://ticket-banner.png');
        }

        const ticketButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_open_ticket')
            .setLabel('เปิดตั๋วสั่งซื้อ')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
        );

        await targetChannel.send({
          embeds: [panelEmbed],
          files,
          components: [ticketButton]
        });

        return interaction.editReply({
          content: `✅ ส่งแผงตั๋วไปยังห้อง <#${targetChannel.id}> แล้วค่ะ!`
        });
      }

      // /shop-stats
      if (commandName === 'shop-stats') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const stats = db.getStats();
        const statsEmbed = new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle('📊 สถิติร้านค้า')
          .addFields(
            { name: '🎫 ตั๋วทั้งหมด', value: `${stats.totalTickets || 0} ใบ`, inline: true },
            { name: '🧾 สลิปทั้งหมด', value: `${stats.totalSlips || 0} ใบ`, inline: true },
            { name: '✅ อนุมัติสำเร็จ', value: `${stats.approvedSlips || 0} ใบ`, inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [statsEmbed] });
      }

      // /payment-info
      if (commandName === 'payment-info') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const payload = getPaymentPayload();
        return interaction.editReply(payload);
      }

      // /sync-auto-role (ซิงค์ยศเริ่มต้นให้สมาชิกทุกคนที่อยู่ในเซิร์ฟเวอร์)
      if (commandName === 'sync-auto-role') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const roleId = config.autoRoleId;
        if (!roleId) {
          return interaction.editReply({
            content: '❌ ไม่พบการตั้งค่า AUTO_ROLE_ID ในไฟล์ .env ค่ะ'
          });
        }

        try {
          const role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId).catch(() => null);
          if (!role) {
            return interaction.editReply({
              content: `❌ ไม่พบยศ ID: \`${roleId}\` ในเซิร์ฟเวอร์นี้ค่ะ กรุณาตรวจสอบ ID อีกครั้ง`
            });
          }

          const members = await interaction.guild.members.fetch();
          let count = 0;
          for (const [, member] of members) {
            if (!member.user.bot && !member.roles.cache.has(role.id)) {
              try {
                await member.roles.add(role);
                count++;
              } catch {}
            }
          }

          return interaction.editReply({
            content: `✅ มอบยศ **${role.name}** ให้สมาชิกในเซิร์ฟเวอร์เรียบร้อยแล้วทั้งหมด ${count} คนค่ะ!`
          });
        } catch (err) {
          console.error('[Sync Auto-Role Error]:', err);
          return interaction.editReply({
            content: `❌ เกิดข้อผิดพลาดในการมอบยศ: ${err.message}`
          });
        }
      }
    }

    // ----------------------------------------
    // 2. BUTTON INTERACTIONS
    // ----------------------------------------
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // 🎫 ปุ่ม: เปิดตั๋วสั่งซื้อ (ป้องกันการสแปมตั๋วซ้ำ)
      if (customId === 'btn_open_ticket') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
          const result = await createTicketChannel(interaction.guild, interaction.user);
          if (result.alreadyExists) {
            return interaction.editReply({
              content: `⚠️ คุณมีห้องตั๋วที่ยังเปิดอยู่แล้วค่ะ: <#${result.channel.id}>\nกรุณาใช้ห้องเดิมในการติดต่อ หรือกดปิดตั๋วเดิมก่อนนะคะ`
            });
          }

          return interaction.editReply({
            content: `✅ สร้างห้องตั๋วของคุณแล้วค่ะ: <#${result.channel.id}>`
          });
        } catch (err) {
          console.error('[Create Ticket Error]:', err);
          return interaction.editReply({
            content: '❌ เกิดข้อผิดพลาดในการสร้างห้องตั๋ว กรุณาลองใหม่อีกครั้งค่ะ'
          });
        }
      }

      // 💳 ปุ่ม: แสดงช่องทางชำระเงิน
      if (customId === 'ticket_show_payment') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const payload = getPaymentPayload();
        return interaction.editReply(payload);
      }

      // 🔒 ปุ่ม: ปิดตั๋ว
      if (customId === 'ticket_close') {
        await interaction.deferReply();
        const ticket = db.getTicketByChannel(interaction.channel.id);
        db.closeTicket(interaction.channel.id, interaction.user.id);

        // ปิดสิทธิ์ไม่ให้ลูกค้าพิมพ์ข้อความต่อในห้องที่ปิดแล้ว
        if (ticket && ticket.userId) {
          try {
            await interaction.channel.permissionOverwrites.edit(ticket.userId, {
              SendMessages: false
            });
          } catch {}
        }

        const closeEmbed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('🔒 ปิดตั๋วเรียบร้อยแล้ว')
          .setDescription(
            `ตั๋วนี้ถูกปิดโดย <@${interaction.user.id}>\n` +
            `📜 *ประวัติการสนทนาถูกส่งต่อไปยัง DM และห้องบันทึกประวัติเรียบร้อยแล้วค่ะ*`
          );

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_transcript')
            .setLabel('ขอรับประวัติทาง DM')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('ticket_delete')
            .setLabel('ลบห้องทันที')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({
          embeds: [closeEmbed],
          components: [actionRow]
        });

        // ส่ง Transcript เข้า DM และห้องบันทึก Log และบันทึกสถานะเพื่อไม่ให้ส่งซ้ำตอนกดลบห้อง
        db.markTranscriptSent(interaction.channel.id);
        handleTicketTranscript(interaction.channel, ticket, interaction.user).catch(console.error);
        return;
      }

      // 📜 ปุ่ม: บันทึก Transcript ไปยัง DM แบบกดเอง
      if (customId === 'ticket_transcript') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const ticket = db.getTicketByChannel(interaction.channel.id);
        const sent = await handleTicketTranscript(interaction.channel, ticket, interaction.user, true);

        return interaction.editReply({
          content: sent
            ? '📜 ส่งประวัติการสนทนาไปยังแชทส่วนตัว (DM) เรียบร้อยแล้วค่ะ!'
            : '⚠️ ไม่สามารถส่ง DM ได้ (กรุณาเปิดรับข้อความส่วนตัวจากสมาชิกในเซิร์ฟเวอร์ค่ะ)'
        });
      }

      // 🗑️ ปุ่ม: ลบห้องตั๋ว (ปลอดภัย ไม่ส่ง DM ซ้ำ)
      if (customId === 'ticket_delete') {
        const isStaff = checkIsStaff(interaction);
        const ticket = db.getTicketByChannel(interaction.channel.id);
        const isOwner = ticket && ticket.userId === interaction.user.id;

        if (!isStaff && !isOwner) {
          return interaction.reply({
            content: '❌ คุณไม่มีสิทธิ์ลบห้องนี้ (เฉพาะแอดมินหรือเจ้าของตั๋วเท่านั้น)',
            flags: [MessageFlags.Ephemeral]
          });
        }

        await interaction.reply({ content: '🗑️ กำลังเตรียมลบห้อง...' });

        // หากยังไม่ได้ส่ง Transcript (กรณีลบห้องโดยไม่เคยกดปิดตั๋วมาก่อน) ให้ส่ง 1 ครั้ง
        const currentTicket = db.getTicketByChannel(interaction.channel.id) || ticket;
        if (!currentTicket || !currentTicket.transcriptSent) {
          db.markTranscriptSent(interaction.channel.id);
          await handleTicketTranscript(interaction.channel, currentTicket, interaction.user).catch(console.error);
        }

        try {
          await interaction.channel.delete('Ticket deleted');
        } catch (err) {
          console.error('[Delete Channel Error]:', err);
        }
        return;
      }

      // ✅ ปุ่ม: อนุมัติสลิป (เฉพาะแอดมิน/Staff)
      if (customId.startsWith('slip_approve:')) {
        const isStaff = checkIsStaff(interaction);
        if (!isStaff) {
          return interaction.reply({
            content: '❌ คุณไม่มีสิทธิ์กดอนุมัติสลิป (เฉพาะแอดมินหรือผู้ดูแลร้านเท่านั้น)',
            flags: [MessageFlags.Ephemeral]
          });
        }

        await interaction.deferUpdate();

        const slipId = customId.split(':')[1];
        const updatedSlip = db.updateSlipStatus(slipId, 'approved', interaction.user.id);
        if (!updatedSlip) return;

        if (updatedSlip.alreadyUpdated) {
          return interaction.followUp({
            content: '⚠️ สลิปนี้ได้รับการประมวลผลไปแล้วค่ะ',
            flags: [MessageFlags.Ephemeral]
          });
        }

        // มอบยศลูกค้า (ถ้าตั้งค่าไว้)
        let roleGivenText = '';
        if (config.customerRoleId && updatedSlip.senderId) {
          try {
            const member = await interaction.guild.members.fetch(updatedSlip.senderId);
            if (member && !member.roles.cache.has(config.customerRoleId)) {
              await member.roles.add(config.customerRoleId);
              roleGivenText = `\n🎖️ **มอบยศลูกค้าให้คุณ <@${updatedSlip.senderId}> เรียบร้อยแล้ว!**`;
            }
          } catch (e) {
            console.log('Customer role add error:', e.message);
          }
        }

        const bankInfoText = updatedSlip.bankName ? `• **ธนาคาร:** ${updatedSlip.bankName}\n` : '';

        // อัปเดต Embed ข้อความสลิปให้ถูกต้องและชัดเจน
        const approvedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(config.colors.success)
          .setTitle('✅ ยืนยันยอดเงินสำเร็จ (อนุมัติแล้ว)')
          .setDescription(
            bankInfoText +
            `• **รหัสธุรกรรม:** \`${updatedSlip.refId}\`\n` +
            `• **ผู้ส่ง:** <@${updatedSlip.senderId}>\n` +
            `• **สถานะ:** ✅ **อนุมัติเรียบร้อย** โดย <@${interaction.user.id}>`
          )
          .setFields([])
          .setFooter({ text: 'อนุมัติเรียบร้อยแล้ว' })
          .setTimestamp();

        await interaction.editReply({
          embeds: [approvedEmbed],
          components: []
        });

        const reviewChannelMention = config.reviewChannelId ? `<#${config.reviewChannelId}>` : 'ห้องรีวิว';

        return interaction.channel.send({
          content:
            `🎉 **ยืนยันการชำระเงินสำเร็จเรียบร้อย!** ขอบคุณคุณ <@${updatedSlip.senderId}> ที่อุดหนุนทางร้านนะคะ ✨${roleGivenText}\n\n` +
            `💬 **คุณลูกค้าสามารถบอกชื่อ Server, ลิงก์ VIP หรือข้อมูลอื่นๆ ได้เลยนะคะ เดี๋ยวแม่ค้าจะรีบเข้าไปส่งของให้เยย~ 💖**\n\n` +
            `🌟 *เมื่อได้รับสินค้าแล้ว ฝากแวะไปให้คะแนนหรือรีวิวที่ห้อง ${reviewChannelMention} ให้เค้าด้วยน้า ขอบคุณมากๆ ค่า!*`
        });
      }

      // ❌ ปุ่ม: ปฏิเสธสลิป (เฉพาะแอดมิน/Staff)
      if (customId.startsWith('slip_reject:')) {
        const isStaff = checkIsStaff(interaction);
        if (!isStaff) {
          return interaction.reply({
            content: '❌ คุณไม่มีสิทธิ์ปฏิเสธสลิป (เฉพาะแอดมินหรือผู้ดูแลร้านเท่านั้น)',
            flags: [MessageFlags.Ephemeral]
          });
        }

        await interaction.deferUpdate();

        const slipId = customId.split(':')[1];
        const updatedSlip = db.updateSlipStatus(slipId, 'rejected', interaction.user.id);
        if (!updatedSlip) return;

        if (updatedSlip.alreadyUpdated) {
          return interaction.followUp({
            content: '⚠️ สลิปนี้ได้รับการประมวลผลไปแล้วค่ะ',
            flags: [MessageFlags.Ephemeral]
          });
        }

        const bankInfoText = updatedSlip.bankName ? `• **ธนาคาร:** ${updatedSlip.bankName}\n` : '';

        const rejectedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(config.colors.danger)
          .setTitle('❌ สลิปถูกปฏิเสธ (ไม่ผ่าน)')
          .setDescription(
            bankInfoText +
            `• **รหัสธุรกรรม:** \`${updatedSlip.refId}\`\n` +
            `• **ผู้ส่ง:** <@${updatedSlip.senderId}>\n` +
            `• **สถานะ:** ❌ **ปฏิเสธโดย <@${interaction.user.id}>** (ยอดเงินไม่เข้า หรือสลิปไม่ถูกต้อง)`
          )
          .setFields([])
          .setFooter({ text: 'สลิปนี้ถูกปฏิเสธ' })
          .setTimestamp();

        await interaction.editReply({
          embeds: [rejectedEmbed],
          components: []
        });

        return interaction.channel.send({
          content: `⚠️ สลิปของท่านถูกปฏิเสธโดยแอดมิน <@${interaction.user.id}> กรุณาตรวจสอบยอดเงินหรือติดต่อแอดมินอีกครั้งค่ะ`
        });
      }
    }
  } catch (err) {
    console.error('[Interaction Error]:', err);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ', flags: [MessageFlags.Ephemeral] });
      }
    } catch {}
  }
});

// ==========================================
// 📸 MESSAGE CREATE (ตรวจจับรูปสลิปในห้องตั๋ว)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild || !message.channel) return;

  const imageAttachment = message.attachments.find(att =>
    (att.contentType && att.contentType.startsWith('image/')) ||
    /\.(png|jpe?g|webp)$/i.test(att.name || '')
  );

  if (!imageAttachment) return;

  // ตรวจสอบว่ารูปถูกส่งในห้อง Ticket หรือไม่ (ปลอดภัยเมื่อ channel.name เป็น undefined)
  const isTicketChannel =
    (message.channel.name && message.channel.name.startsWith('ticket-')) ||
    db.getTicketByChannel(message.channel.id);

  if (!isTicketChannel) return;

  try {
    await message.react('🔍').catch(() => {});

    const qrResult = await scanQRCodeFromImage(imageAttachment.url);

    // 1. ถ้าไม่พบ QR Code
    if (!qrResult.success) {
      await message.reactions.removeAll().catch(() => {});
      await message.react('❓').catch(() => {});
      return;
    }

    // 2. ถ้าผู้ใช้ส่ง QR Code รับเงิน (PromptPay) เข้ามาแทนที่จะเป็นสลิปโอน
    if (qrResult.isPaymentQR) {
      await message.reactions.removeAll().catch(() => {});
      await message.react('⚠️').catch(() => {});

      const paymentQrNotice = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('⚠️ รูปภาพนี้คือ "QR Code สำหรับชำระเงิน"')
        .setDescription(
          `รูปที่คุณส่งมาคือ **QR Code พร้อมเพย์สำหรับรับเงิน** ไม่ใช่สลิปหลักฐานการโอนเงินค่ะ\n\n` +
          `👉 **วิธีที่ถูกต้อง:**\n` +
          `1. สแกน QR เพื่อโอนเงินในแอปธนาคาร\n` +
          `2. บันทึกรูปสลิปจากแอปธนาคารหลังจากโอนเงินสำเร็จแล้ว\n` +
          `3. ส่งรูปสลิปที่มี **Mini QR Code** เข้ามาในห้องนี้อีกครั้งนะคะ ✨`
        )
        .setFooter({ text: 'ระบบตรวจจับสลิปอัตโนมัติ' })
        .setTimestamp();

      return message.reply({ embeds: [paymentQrNotice] });
    }

    // 3. พบ QR Code สลิปโอนเงิน
    await message.reactions.removeAll().catch(() => {});
    await message.react('🧾').catch(() => {});

    // 4. ตรวจสอบ "สลิปซ้ำ" (Anti-Reuse Check)
    const existingSlip = db.findSlipByHash(qrResult.hash) || db.findSlipByRefId(qrResult.refId);

    if (existingSlip) {
      const duplicateEmbed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle('⚠️ ตรวจพบสลิปซ้ำในระบบ!')
        .setDescription(
          `❌ สลิปนี้เคยใช้งานไปแล้วค่ะ ไม่อนุญาตให้นำสลิปเดิมมาส่งซ้ำน้า\n\n` +
          (existingSlip.bankName ? `• **ธนาคาร:** ${existingSlip.bankName}\n` : '') +
          `• **รหัสธุรกรรม:** \`${existingSlip.refId || 'N/A'}\`\n` +
          `• **ส่งเมื่อ:** <t:${Math.floor(new Date(existingSlip.createdAt).getTime() / 1000)}:R>`
        )
        .setFooter({ text: 'ระบบตรวจจับสลิปอัตโนมัติ' })
        .setTimestamp();

      return message.reply({ embeds: [duplicateEmbed] });
    }

    // 5. สลิปใหม่
    const newSlip = db.saveSlip({
      hash: qrResult.hash,
      refId: qrResult.refId,
      rawQr: qrResult.rawQr,
      bankCode: qrResult.bankCode,
      bankName: qrResult.bankName,
      senderId: message.author.id,
      channelId: message.channel.id
    });

    const bankInfoText = newSlip.bankName ? `• **ธนาคาร:** ${newSlip.bankName}\n` : '';

    const slipEmbed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle('🧾 ได้รับสลิปแล้ว (รอแม่ค้ากดยืนยัน)')
      .setDescription(
        bankInfoText +
        `• **รหัสธุรกรรม:** \`${newSlip.refId}\`\n` +
        `• **ผู้ส่ง:** <@${message.author.id}>\n` +
        `• **สลิปซ้ำ:** ✅ ผ่าน (ไม่ซ้ำ)\n\n` +
        `⏳ *รอแม่ค้าตรวจสอบสักครู่นะคะ*`
      )
      .setThumbnail(imageAttachment.url)
      .setFooter({ text: 'ตรวจสอบยอดเงินจริงก่อนกดอนุมัติ' })
      .setTimestamp();

    const staffActionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`slip_approve:${newSlip.id}`)
        .setLabel('อนุมัติยอดเงิน')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`slip_reject:${newSlip.id}`)
        .setLabel('ปฏิเสธ')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

    const staffMention = config.staffRoleId ? `<@&${config.staffRoleId}>` : '';
    return message.reply({
      content: `🔔 แจ้งเตือนยอดโอนใหม่ค่ะ ${staffMention}`,
      embeds: [slipEmbed],
      components: [staffActionRow]
    });
  } catch (error) {
    console.error('[Slip Handler Error]:', error);
  }
});

// Helper: ตรวจสอบว่าผู้ใช้มีสิทธิ์ Staff หรือไม่
function checkIsStaff(interaction) {
  if (!interaction.member) return false;

  // ตรวจสอบสิทธิ์ Administrator
  if (interaction.member.permissions?.has?.(PermissionFlagsBits.Administrator)) {
    return true;
  }

  // ตรวจสอบ Staff Role ID ทั้งแบบ GuildMember และ API Member
  if (config.staffRoleId) {
    if (interaction.member.roles?.cache) {
      if (interaction.member.roles.cache.has(config.staffRoleId)) return true;
    } else if (Array.isArray(interaction.member.roles)) {
      if (interaction.member.roles.includes(config.staffRoleId)) return true;
    }
  }

  return false;
}

// Helper: ส่ง Transcript ไปยัง DM และส่งไปยังห้อง Transcript Log Channel ของร้าน
async function handleTicketTranscript(channel, ticket, actor, dmOnly = false) {
  try {
    const buffer = await generateTranscript(channel);
    if (!buffer) return false;

    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });
    const userIds = new Set();
    if (ticket && ticket.userId) userIds.add(ticket.userId);
    if (actor && actor.id) userIds.add(actor.id);

    let dmSent = false;
    for (const uId of userIds) {
      try {
        const u = await channel.client.users.fetch(uId);
        if (u) {
          await u.send({
            content: `📜 **ประวัติการสนทนาห้อง #${channel.name}**\nขอบคุณที่ใช้บริการร้าน Fresshy shop นะคะ 💖`,
            files: [attachment]
          });
          dmSent = true;
        }
      } catch (err) {
        console.log(`[DM Warning] Could not DM user ${uId}:`, err.message);
      }
    }

    // ส่งเข้า Transcript Log Channel ของร้านค้า (ถ้ามีการตั้งค่าไว้)
    if (!dmOnly && config.transcriptChannelId && channel.guild) {
      try {
        const logChannel = await channel.guild.channels.fetch(config.transcriptChannelId).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle(`📜 บันทึกประวัติตั๋ว: #${channel.name}`)
            .addFields(
              { name: '🎫 ผู้เปิดตั๋ว', value: ticket?.userId ? `<@${ticket.userId}>` : 'ไม่ระบุ', inline: true },
              { name: '🔒 ผู้ปิด/ลบตั๋ว', value: actor?.id ? `<@${actor.id}>` : 'ไม่ระบุ', inline: true }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed], files: [attachment] });
        }
      } catch (logErr) {
        console.error('[Transcript Log Channel Error]:', logErr.message);
      }
    }

    return dmSent;
  } catch (err) {
    console.error('[handleTicketTranscript Error]:', err);
    return false;
  }
}

// Helper: สร้างข้อมูลชำระเงินพร้อมรูป QR
function getPaymentPayload() {
  const qrPath = path.join(__dirname, 'assets', 'payment-qr.jpg');
  const files = [];

  const paymentEmbed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('💳 ช่องทางการชำระเงิน')
    .setDescription(
      `• **ชื่อบัญชี:** \`${config.payment.promptpayName}\`\n` +
      `• **พร้อมเพย์:** \`${config.payment.promptpayNumber}\`\n\n` +
      `📱 สแกน QR ด้านล่างเพื่อโอนเงินได้เลยนะคะ\n` +
      `⚠️ โอนแล้ว **ส่งสลิปในห้องนี้** ได้เลยน้า บอทตรวจให้อัตโนมัติค่ะ!`
    )
    .setFooter({ text: 'Fresshy shop • สแกนจ่ายได้ทุกธนาคาร' })
    .setTimestamp();

  if (fs.existsSync(qrPath)) {
    const qrAttachment = new AttachmentBuilder(qrPath, { name: 'payment-qr.jpg' });
    files.push(qrAttachment);
    paymentEmbed.setImage('attachment://payment-qr.jpg');
  }

  return { embeds: [paymentEmbed], files, flags: [MessageFlags.Ephemeral] };
}

// ==========================================
// 🔑 START BOT
// ==========================================
if (!config.token) {
  console.log('⚠️ ==============================================================');
  console.log('❌ ยังไม่ได้ใส่ DISCORD_TOKEN ในไฟล์ shop-bot/.env');
  console.log('👉 กรุณาสร้างไฟล์ shop-bot/.env แล้วกรอก DISCORD_TOKEN ให้เรียบร้อยครับ');
  console.log('==============================================================');
} else {
  console.log(`🐰 [Shop Bot]: กำลังเริ่มเชื่อมต่อ Discord (Token: ${config.token.slice(0, 10)}... ยาว ${config.token.length} ตัวอักษร)...`);
  client.login(config.token)
    .then(() => {
      console.log(`🐰 [Shop Bot]: Login Promise สำเร็จ กำลังรอ Event Ready...`);
    })
    .catch(err => {
      console.error('❌ ไม่สามารถเข้าสู่ระบบ Discord ได้ กรุณาตรวจสอบ Token อีกครั้ง:', err.message);
    });
}

module.exports = { client };
