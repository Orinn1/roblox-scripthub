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
const { createTicketChannel, generateTranscript } = require('./services/ticket-manager');
const { getPaymentPayload } = require('./services/payment-helper');
const { scanQRCodeFromImage, THAI_BANKS } = require('./services/qr-scanner');
const { deployCommands } = require('./deploy-commands');

// ==========================================
// 🌐 STANDALONE WEB SERVER (สำหรับกรณีรันแยกเดี่ยว)
// ==========================================
if (require.main === module && !process.env.IS_CHILD_WORKER) {
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
    console.log(`🌐 [Shop Bot]: Standalone server listening on port ${PORT}`);
  });
}

// ==========================================
// 🤖 DISCORD CLIENT INITIALIZATION
// ==========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel]
});

// Bypass Gateway HTTP /gateway/bot to prevent Cloudflare 429 rate-limiting
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

  // ลงทะเบียน Slash Commands ในพื้นหลัง
  deployCommands(client.user.id).catch((err) => {
    console.warn('⚠️ [Shop Bot]: Deploy commands notice:', err.message);
  });
});

// ==========================================
// 👥 GUILD MEMBER ADD (AUTO-ROLE สมาชิกใหม่)
// ==========================================
client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;
  const roleId = config.autoRoleId;
  if (!roleId) return;

  try {
    const role = member.guild.roles.cache.get(roleId) || await member.guild.roles.fetch(roleId).catch(() => null);
    if (role) {
      await member.roles.add(role);
      console.log(`[Auto-Role] ✅ มอบยศ "${role.name}" ให้คุณ ${member.user.tag} เรียบร้อยแล้ว`);
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
      console.log(`📥 [Shop Bot]: คำสั่ง /${commandName} จาก ${interaction.user.tag}`);

      // /setup-ticket
      if (commandName === 'setup-ticket') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        if (!targetChannel || !targetChannel.isTextBased()) {
          return interaction.editReply({
            content: '❌ กรุณาเลือกห้องข้อความ (Text Channel) ที่ถูกต้องค่ะ'
          });
        }

        const panelEmbed = new EmbedBuilder()
          .setColor(config.colors.primary)
          .setTitle('🛒 สั่งซื้อสินค้า & สอบถาม')
          .setDescription(
            `กดปุ่ม [ 🎫 **เปิดตั๋วสั่งซื้อ** ] ด้านล่างได้เลยค่ะ ✨\n` +
            `🔒 ระบบจะสร้างห้องส่วนตัวให้คุยกับแม่ค้าโดยตรง ปลอดภัย 100%`
          )
          .setFooter({ text: 'Fresshy shop • ยินดีให้บริการตลอด 24 ชม.' })
          .setTimestamp();

        const ticketButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_open_ticket')
            .setLabel('เปิดตั๋วสั่งซื้อ')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
        );

        const bannerPath = path.join(__dirname, 'assets', 'ticket-banner.png');
        const files = [];
        if (fs.existsSync(bannerPath)) {
          try {
            const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'ticket-banner.png' });
            files.push(bannerAttachment);
            panelEmbed.setImage('attachment://ticket-banner.png');
          } catch {}
        }

        await targetChannel.send({
          embeds: [panelEmbed],
          files,
          components: [ticketButton]
        });

        return interaction.editReply({
          content: `✅ ส่งแผงเปิดตั๋วไปยังห้อง <#${targetChannel.id}> เรียบร้อยแล้วค่ะ!`
        });
      }

      // /payment-info
      if (commandName === 'payment-info') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const payload = getPaymentPayload();
        return interaction.editReply(payload);
      }

      // /shop-stats
      if (commandName === 'shop-stats') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const stats = db.getStats();
        const statsEmbed = new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle('📊 สถิติร้านค้า Fresshy Shop')
          .addFields(
            { name: '🎫 ตั๋วทั้งหมด', value: `${stats.totalTickets || 0} ใบ`, inline: true },
            { name: '🧾 สลิปทั้งหมด', value: `${stats.totalSlips || 0} ใบ`, inline: true },
            { name: '✅ อนุมัติสำเร็จ', value: `${stats.approvedSlips || 0} ใบ`, inline: true }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [statsEmbed] });
      }

      // /sync-auto-role
      if (commandName === 'sync-auto-role') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const roleId = config.autoRoleId;
        if (!roleId) {
          return interaction.editReply({ content: '❌ ไม่พบการตั้งค่า AUTO_ROLE_ID ในระบบค่ะ' });
        }

        try {
          const role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId).catch(() => null);
          if (!role) {
            return interaction.editReply({ content: `❌ ไม่พบยศ ID: \`${roleId}\` ในเซิร์ฟเวอร์นี้ค่ะ` });
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
            content: `✅ ซิงค์มอบยศ **${role.name}** ให้สมาชิกเรียบร้อยแล้วทั้งหมด ${count} คนค่ะ!`
          });
        } catch (err) {
          return interaction.editReply({ content: `❌ เกิดข้อผิดพลาด: ${err.message}` });
        }
      }
    }

    // ----------------------------------------
    // 2. BUTTON INTERACTIONS
    // ----------------------------------------
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // 🎫 ปุ่ม: เปิดตั๋วสั่งซื้อ
      if (customId === 'btn_open_ticket') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
          const result = await createTicketChannel(interaction.guild, interaction.user);
          if (result.alreadyExists) {
            return interaction.editReply({
              content: `⚠️ คุณมีห้องตั๋วที่ยังเปิดอยู่แล้วค่ะ: <#${result.channel.id}>\nกรุณาใช้ห้องเดิมในการติดต่อ หรือกดปิดตั๋วเดิมก่อนนะคะ`
            });
          }

          return interaction.editReply({
            content: `✅ สร้างห้องตั๋วของคุณเรียบร้อยแล้วค่ะ: <#${result.channel.id}>`
          });
        } catch (err) {
          console.error('[Create Ticket Error]:', err);
          return interaction.editReply({
            content: `❌ เกิดข้อผิดพลาดในการสร้างห้องตั๋ว: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`
          });
        }
      }

      // 💳 ปุ่ม: แสดงช่องทางชำระเงิน
      if (customId === 'ticket_show_payment') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const payload = getPaymentPayload();
        return interaction.editReply(payload);
      }

      // 🔒 ปุ่ม: ปิดตั๋ว
      if (customId === 'ticket_close') {
        await interaction.deferReply();
        const ticket = db.getTicketByChannel(interaction.channel.id);
        db.closeTicket(interaction.channel.id, interaction.user.id);

        // ล็อกสิทธิ์ไม่ให้ผู้ใช้พิมพ์ข้อความต่อ
        if (ticket && ticket.userId) {
          try {
            await interaction.channel.permissionOverwrites.edit(ticket.userId, {
              SendMessages: false
            });
          } catch {}
        }

        const closeEmbed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('🔒 ตั๋วนี้ถูกปิดการใช้งานแล้ว')
          .setDescription(
            `ตั๋วถูกปิดโดย <@${interaction.user.id}>\n` +
            `หากต้องการเก็บบันทึกประวัติการคุย สามารถกดปุ่ม **[ 📜 ดูประวัติ (DM) ]** ด้านล่างได้เลยค่ะ`
          )
          .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_transcript')
            .setLabel('ดูประวัติ (DM)')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('ticket_delete')
            .setLabel('ลบห้อง')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({
          embeds: [closeEmbed],
          components: [actionRow]
        });

        // ส่ง Transcript ไปยัง DM และห้อง Log ในพื้นหลัง
        db.markTranscriptSent(interaction.channel.id);
        handleTicketTranscript(interaction.channel, ticket, interaction.user).catch(console.error);
        return;
      }

      // 📜 ปุ่ม: ส่ง Transcript ไปยัง DM
      if (customId === 'ticket_transcript') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const ticket = db.getTicketByChannel(interaction.channel.id);
        const sent = await handleTicketTranscript(interaction.channel, ticket, interaction.user, true);

        return interaction.editReply({
          content: sent
            ? '📜 ส่งประวัติการสนทนาไปยังแชทส่วนตัว (DM) เรียบร้อยแล้วค่ะ!'
            : '⚠️ ไม่สามารถส่ง DM ได้ (กรุณาเปิดรับข้อความส่วนตัวจากสมาชิกในเซิร์ฟเวอร์ค่ะ)'
        });
      }

      // 🗑️ ปุ่ม: ลบห้องตั๋ว
      if (customId === 'ticket_delete') {
        const isStaff = checkIsStaff(interaction);
        const ticket = db.getTicketByChannel(interaction.channel.id);
        const isOwner = ticket && ticket.userId === interaction.user.id;

        if (!isStaff && !isOwner) {
          return interaction.reply({
            content: '❌ คุณไม่มีสิทธิ์ลบห้องนี้ (เฉพาะแอดมินหรือเจ้าของตั๋วเท่านั้น)',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.reply({ content: '🗑️ กำลังลบห้องตั๋ว...' });

        // หากยังไม่เคยส่ง Transcript ให้ส่ง 1 ครั้งก่อนลบ
        const currentTicket = db.getTicketByChannel(interaction.channel.id) || ticket;
        if (!currentTicket || !currentTicket.transcriptSent) {
          db.markTranscriptSent(interaction.channel.id);
          await handleTicketTranscript(interaction.channel, currentTicket, interaction.user).catch(console.error);
        }

        setTimeout(async () => {
          try {
            await interaction.channel.delete('Ticket deleted by user/staff');
          } catch (delErr) {
            console.error('[Delete Channel Error]:', delErr.message);
          }
        }, 1200);
        return;
      }

      // ✅ ปุ่ม: อนุมัติสลิป (เฉพาะแอดมิน/Staff)
      if (customId.startsWith('slip_approve:')) {
        const isStaff = checkIsStaff(interaction);
        if (!isStaff) {
          return interaction.reply({
            content: '❌ คุณไม่มีสิทธิ์กดอนุมัติสลิป (เฉพาะแอดมินหรือผู้ดูแลร้านเท่านั้น)',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferUpdate();

        const slipId = customId.split(':')[1];
        const updatedSlip = db.updateSlipStatus(slipId, 'approved', interaction.user.id);
        if (!updatedSlip || updatedSlip.alreadyUpdated) return;

        // มอบยศลูกค้า (Customer Role) อัตโนมัติ
        let roleGivenText = '';
        if (config.customerRoleId && interaction.guild) {
          try {
            const member = await interaction.guild.members.fetch(updatedSlip.senderId).catch(() => null);
            if (member) {
              await member.roles.add(config.customerRoleId);
              roleGivenText = `\n🎁 มอบยศลูกค้า <@&${config.customerRoleId}> ให้เรียบร้อยแล้วค่ะ!`;
            }
          } catch (rErr) {
            console.warn('[Give Customer Role Error]:', rErr.message);
          }
        }

        const approvedEmbed = new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle('✅ สลิปได้รับการอนุมัติเรียบร้อยแล้ว')
          .setDescription(
            `• **สถานะ:** ตรวจสอบผ่านสำเร็จ\n` +
            `• **ผู้อนุมัติ:** <@${interaction.user.id}>\n` +
            `• **ผู้โอน:** <@${updatedSlip.senderId}>\n` +
            `• **เลขอ้างอิง:** \`${updatedSlip.refId || 'N/A'}\``
          )
          .setTimestamp();

        await interaction.editReply({
          embeds: [approvedEmbed],
          components: []
        });

        const reviewChannelMention = config.reviewChannelId ? `<#${config.reviewChannelId}>` : 'ห้องรีวิว';

        return interaction.channel.send({
          content:
            `🎉 **ยืนยันการชำระเงินสำเร็จเรียบร้อย!** ขอบคุณคุณ <@${updatedSlip.senderId}> ที่อุดหนุนทางร้านนะคะ ✨${roleGivenText}\n\n` +
            `💬 **คุณลูกค้าสามารถพิมพ์แจ้งรายละเอียดสินค้า/สคริปต์ได้เลยค่ะ เดี๋ยวแม่ค้าจะรีบส่งของให้เยย~ 💖**\n\n` +
            `🌟 *เมื่อได้รับสินค้าแล้ว ฝากแวะไปให้คะแนนหรือรีวิวที่ ${reviewChannelMention} ให้เค้าด้วยน้า ขอบคุณมากๆ ค่า!*`
        });
      }

      // ❌ ปุ่ม: ปฏิเสธสลิป (เฉพาะแอดมิน/Staff)
      if (customId.startsWith('slip_reject:')) {
        const isStaff = checkIsStaff(interaction);
        if (!isStaff) {
          return interaction.reply({
            content: '❌ คุณไม่มีสิทธิ์ปฏิเสธสลิป (เฉพาะแอดมินหรือผู้ดูแลร้านเท่านั้น)',
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferUpdate();

        const slipId = customId.split(':')[1];
        const updatedSlip = db.updateSlipStatus(slipId, 'rejected', interaction.user.id);
        if (!updatedSlip || updatedSlip.alreadyUpdated) return;

        const rejectedEmbed = new EmbedBuilder()
          .setColor(config.colors.danger)
          .setTitle('❌ สลิปถูกปฏิเสธ')
          .setDescription(
            `• **สถานะ:** ไม่ผ่านการตรวจสอบ\n` +
            `• **ผู้ดำเนินการ:** <@${interaction.user.id}>\n` +
            `• **ผู้ส่ง:** <@${updatedSlip.senderId}>`
          )
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
    console.error('[Shop Bot Interaction Error]:', err);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ', flags: MessageFlags.Ephemeral });
      } else if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ' });
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

  // ตรวจสอบว่ารูปนี้ถูกส่งในห้อง Ticket ที่กำลังเปิดอยู่หรือไม่
  const ticket = db.getTicketByChannel(message.channel.id);
  if (!ticket || ticket.status !== 'open') return;

  console.log(`📸 [Slip Detection]: พบรูปภาพส่งในห้อง #${message.channel.name} จาก ${message.author.tag}`);

  let scanningMsg = null;
  try {
    scanningMsg = await message.reply({ content: '🔍 กำลังตรวจสอบ QR Code ในสลิปโอนเงิน...' });
  } catch {}

  try {
    const qrResult = await scanQRCodeFromImage(imageAttachment.url);

    if (!qrResult.success) {
      if (scanningMsg) {
        await scanningMsg.edit({
          content: `⚠️ ${qrResult.message || 'ไม่พบ QR Code ในรูปภาพ กรุณาใช้สลิปโอนเงินที่มี Mini QR Code ชัดเจนค่ะ'}`
        }).catch(() => {});
      }
      return;
    }

    // กรณีเป็น QR Code พร้อมเพย์สำหรับรับเงิน ไม่ใช่สลิป
    if (qrResult.isPaymentQR) {
      if (scanningMsg) {
        await scanningMsg.edit({
          content: '⚠️ รูปภาพนี้เป็น **QR Code สำหรับโอนเงิน/รับเงิน** ค่ะ ไม่ใช่สลิปหลักฐานการโอนเงิน กรุณาส่งสลิปที่ได้หลังจากโอนเงินสำเร็จแล้วนะคะ'
        }).catch(() => {});
      }
      return;
    }

    // 1. ตรวจสอบสลิปซ้ำ (Anti-Reuse) ด้วย SHA256 Hash
    const duplicateByHash = db.findSlipByHash(qrResult.hash);
    if (duplicateByHash) {
      const staffMention = config.staffRoleId ? `<@&${config.staffRoleId}>` : '';
      const dupEmbed = new EmbedBuilder()
        .setColor(config.colors.danger)
        .setTitle('🚨 ตรวจพบสลิปซ้ำ! (DUPLICATE SLIP DETECTED)')
        .setDescription(
          `สลิปใบนี้ **เคยถูกใช้งานในระบบไปแล้ว** ❌\n\n` +
          `• **ผู้ส่งครั้งนี้:** <@${message.author.id}>\n` +
          `• **ผู้ส่งครั้งก่อน:** <@${duplicateByHash.senderId}>\n` +
          `• **ใช้งานครั้งแรกเมื่อ:** <t:${Math.floor(new Date(duplicateByHash.createdAt).getTime() / 1000)}:R>\n` +
          `• **รหัสอ้างอิง:** \`${duplicateByHash.refId || 'N/A'}\``
        )
        .setFooter({ text: 'ระบบป้องกันการใช้สลิปซ้ำ 100%' })
        .setTimestamp();

      if (scanningMsg) await scanningMsg.delete().catch(() => {});
      return message.channel.send({
        content: `🚨 **แจ้งเตือนแอดมิน** ${staffMention}`,
        embeds: [dupEmbed]
      });
    }

    // 2. ตรวจสอบสลิปซ้ำด้วยเลขอ้างอิงธนาคาร (Ref ID)
    if (qrResult.refId) {
      const duplicateByRef = db.findSlipByRefId(qrResult.refId);
      if (duplicateByRef) {
        const staffMention = config.staffRoleId ? `<@&${config.staffRoleId}>` : '';
        const dupEmbed = new EmbedBuilder()
          .setColor(config.colors.danger)
          .setTitle('🚨 ตรวจพบสลิปซ้ำจากเลขอ้างอิง!')
          .setDescription(
            `สลิปที่มีเลขอ้างอิง \`${qrResult.refId}\` **เคยถูกใช้งานไปแล้ว** ❌\n\n` +
            `• **ผู้ส่งครั้งนี้:** <@${message.author.id}>\n` +
            `• **ผู้ส่งครั้งก่อน:** <@${duplicateByRef.senderId}>\n` +
            `• **ใช้งานเมื่อ:** <t:${Math.floor(new Date(duplicateByRef.createdAt).getTime() / 1000)}:R>`
          )
          .setFooter({ text: 'ระบบป้องกันการใช้สลิปซ้ำ 100%' })
          .setTimestamp();

        if (scanningMsg) await scanningMsg.delete().catch(() => {});
        return message.channel.send({
          content: `🚨 **แจ้งเตือนแอดมิน** ${staffMention}`,
          embeds: [dupEmbed]
        });
      }
    }

    // 3. บันทึกสลิปใหม่ลงฐานข้อมูล
    const bankName = (qrResult.bankCode && THAI_BANKS[qrResult.bankCode]) || 'ธนาคารไทย (QR PromptPay)';
    const savedSlip = db.saveSlip({
      hash: qrResult.hash,
      refId: qrResult.refId,
      rawQr: qrResult.rawQr,
      senderId: message.author.id,
      channelId: message.channel.id,
      bankCode: qrResult.bankCode,
      bankName: bankName,
      imageUrl: imageAttachment.url
    });

    if (scanningMsg) await scanningMsg.delete().catch(() => {});

    // 4. ส่ง Embed ให้แอดมิน/Staff ตรวจสอบและกดอนุมัติ
    const staffMention = config.staffRoleId ? `<@&${config.staffRoleId}>` : '';
    const reviewEmbed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🧾 พบสลิปโอนเงินใหม่ (รอการอนุมัติ)')
      .setDescription(
        `สลิปใบนี้ **ผ่านการตรวจสอบ ไม่เคยถูกใช้งานมาก่อน** ✅\n\n` +
        `• **ผู้ส่งสลิป:** <@${message.author.id}> (\`${message.author.tag}\`)\n` +
        `• **ธนาคารต้นทาง:** \`${bankName}\`\n` +
        `• **เลขอ้างอิงสลิป:** \`${qrResult.refId || 'ตรวจพบจาก QR Hash'}\`\n` +
        `• **เวลาส่ง:** <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .setImage(imageAttachment.url)
      .setFooter({ text: `Slip ID: ${savedSlip.id} • กดปุ่มด้านล่างเพื่อดำเนินการ` })
      .setTimestamp();

    const actionButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`slip_approve:${savedSlip.id}`)
        .setLabel('อนุมัติสลิป')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`slip_reject:${savedSlip.id}`)
        .setLabel('ปฏิเสธสลิป')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({
      content: `🔔 **พบสลิปใหม่ รอแอดมินตรวจสอบ** ${staffMention}`,
      embeds: [reviewEmbed],
      components: [actionButtons]
    });

  } catch (error) {
    console.error('[Slip Handler Error]:', error);
    if (scanningMsg) {
      await scanningMsg.edit({ content: '❌ เกิดข้อผิดพลาดในการตรวจสอบสลิป กรุณาแจ้งแอดมินค่ะ' }).catch(() => {});
    }
  }
});

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================
function checkIsStaff(interaction) {
  if (!interaction.member) return false;

  // ตรวจสอบสิทธิ์ Administrator
  if (interaction.member.permissions?.has?.(PermissionFlagsBits.Administrator)) {
    return true;
  }

  // ตรวจสอบ Staff Role ID
  if (config.staffRoleId) {
    if (interaction.member.roles?.cache) {
      if (interaction.member.roles.cache.has(config.staffRoleId)) return true;
    } else if (Array.isArray(interaction.member.roles)) {
      if (interaction.member.roles.includes(config.staffRoleId)) return true;
    }
  }

  return false;
}

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
      } catch {}
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
    console.error('[handleTicketTranscript Error]:', err.message);
    return false;
  }
}

// ==========================================
// 🔑 START BOT
// ==========================================
if (!config.token) {
  console.log('❌ ยังไม่ได้ใส่ DISCORD_TOKEN ในไฟล์ shop-bot/.env');
} else {
  console.log(`🐰 [Shop Bot]: กำลังเชื่อมต่อ Discord...`);
  client.login(config.token)
    .then(() => {
      console.log(`🐰 [Shop Bot]: เข้าสู่ระบบสำเร็จ`);
    })
    .catch(err => {
      console.error('❌ ไม่สามารถเข้าสู่ระบบ Discord ได้:', err.message);
    });
}

module.exports = { client };
