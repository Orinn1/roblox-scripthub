const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  OverwriteType
} = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const config = require('../config');

/**
 * สร้างห้องตั๋วใหม่สำหรับลูกค้า หรือคืนค่าห้องเดิมหากมีตั๋วเปิดอยู่แล้ว
 */
async function createTicketChannel(guild, user) {
  // 1. ตรวจสอบว่ามีตั๋วที่ยังเปิดอยู่แล้วหรือไม่
  const existingTicket = db.findOpenTicketByUser(user.id);
  if (existingTicket && existingTicket.channelId) {
    try {
      const existingChannel = await guild.channels.fetch(existingTicket.channelId).catch(() => null);
      if (existingChannel) {
        return { alreadyExists: true, channel: existingChannel };
      } else {
        // ห้องถูกลบไปแล้วจาก Discord ให้ปิดสถานะใน DB
        db.closeTicket(existingTicket.channelId, 'system_auto_cleanup');
      }
    } catch {}
  }

  // 2. ดึง Bot Member ID
  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
  const botId = botMember ? botMember.id : guild.client.user.id;

  // 3. กำหนดสิทธิ์ของห้องตั๋ว (Private Ticket)
  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: user.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory
      ]
    },
    {
      id: botId,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory
      ]
    }
  ];

  // เพิ่มสิทธิ์ให้ยศ Staff/แอดมินร้าน
  if (config.staffRoleId) {
    permissionOverwrites.push({
      id: config.staffRoleId,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages
      ]
    });
  }

  // 4. ตั้งชื่อห้องตั๋ว
  const nextNumber = db.getNextTicketNumber();
  const safeName = user.username.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 15) || 'user';
  const channelName = `ticket-${nextNumber}-${safeName}`;

  const channelOptions = {
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites,
    topic: `Ticket สำหรับคุณ ${user.tag || user.username} (ID: ${user.id})`
  };

  // หมวดหมู่ห้อง (Category) ถ้ามี
  if (config.ticketCategoryId) {
    try {
      const category = await guild.channels.fetch(config.ticketCategoryId).catch(() => null);
      if (category && category.type === ChannelType.GuildCategory) {
        channelOptions.parent = category.id;
      }
    } catch {}
  }

  // 5. สร้าง Channel บน Discord
  const channel = await guild.channels.create(channelOptions);

  // 6. บันทึกข้อมูลตั๋วลง Database
  const ticketRecord = db.createTicket(channel.id, user.id);

  // 7. เตรียม Welcome Embed & ปุ่มกด
  const welcomeEmbed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`🎫 ตั๋วสั่งซื้อ #${ticketRecord.ticketNumber}`)
    .setDescription(
      `สวัสดีค่าคุณ <@${user.id}> ✨\n\n` +
      `1️⃣ พิมพ์แจ้งสินค้า/สคริปต์ที่ต้องการสั่งซื้อได้เลยค่ะ\n` +
      `2️⃣ กดปุ่ม **[ 💳 ช่องทางชำระเงิน ]** ด้านล่างเพื่อดูบัญชีโอน\n` +
      `3️⃣ เมื่อโอนเสร็จแล้ว **ส่งรูปสลิปในห้องนี้** ได้ทันที ระบบจะตรวจสลิปให้อัตโนมัติค่ะ\n\n` +
      `💖 *แม่ค้าจะรีบเข้ามาตรวจสอบและจัดส่งของให้โดยเร็วที่สุดค่ะ~*`
    )
    .setFooter({ text: 'กดปุ่มด้านล่างเพื่อทำรายการ' })
    .setTimestamp();

  const buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_show_payment')
      .setLabel('ช่องทางชำระเงิน')
      .setEmoji('💳')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('ปิดตั๋ว')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary)
  );

  const staffMention = config.staffRoleId ? `<@&${config.staffRoleId}>` : '';
  const sendContent = `ยินดีต้อนรับคุณ <@${user.id}> ${staffMention}`.trim();

  // ส่งข้อความต้อนรับเข้าห้อง (มีระบบ Fallback หากส่งไฟล์รูป Banner ไม่สำเร็จ)
  const bannerPath = path.join(__dirname, '..', 'assets', 'ticket-banner.png');
  let sentSuccessfully = false;

  if (fs.existsSync(bannerPath)) {
    try {
      const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'ticket-banner.png' });
      welcomeEmbed.setImage('attachment://ticket-banner.png');
      await channel.send({
        content: sendContent,
        embeds: [welcomeEmbed],
        files: [bannerAttachment],
        components: [buttonsRow]
      });
      sentSuccessfully = true;
    } catch (bannerErr) {
      console.warn('[Ticket Manager] Banner attach error, sending plain embed:', bannerErr.message);
    }
  }

  if (!sentSuccessfully) {
    try {
      welcomeEmbed.setImage(null);
      await channel.send({
        content: sendContent,
        embeds: [welcomeEmbed],
        components: [buttonsRow]
      });
    } catch (sendErr) {
      console.error('[Ticket Manager] Failed to send welcome message:', sendErr.message);
    }
  }

  return { alreadyExists: false, channel, ticket: ticketRecord };
}

/**
 * สร้างไฟล์ Text ประวัติการสนทนา (Transcript)
 */
async function generateTranscript(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = Array.from(messages.values()).reverse();

    let transcript = `====================================================\n`;
    transcript += `TRANSCRIPT TICKET LOG: #${channel.name}\n`;
    transcript += `Channel ID: ${channel.id}\n`;
    transcript += `Date: ${new Date().toLocaleString('th-TH')}\n`;
    transcript += `====================================================\n\n`;

    for (const msg of sorted) {
      const time = new Date(msg.createdTimestamp).toLocaleString('th-TH');
      const authorName = msg.author?.tag || msg.author?.username || 'Unknown';
      const authorId = msg.author?.id || 'System';

      transcript += `[${time}] ${authorName} (${authorId}):\n`;
      if (msg.content) transcript += `Content: ${msg.content}\n`;

      if (msg.embeds && msg.embeds.length > 0) {
        msg.embeds.forEach(embed => {
          if (embed.title) transcript += `[Embed Title: ${embed.title}]\n`;
          if (embed.description) transcript += `[Embed Description: ${embed.description.replace(/\n/g, ' ')}]\n`;
        });
      }

      if (msg.attachments.size > 0) {
        msg.attachments.forEach(att => {
          transcript += `[Attachment: ${att.url}]\n`;
        });
      }
      transcript += `----------------------------------------------------\n`;
    }

    return Buffer.from(transcript, 'utf-8');
  } catch (error) {
    console.error('[Transcript Error]:', error.message || error);
    return null;
  }
}

module.exports = {
  createTicketChannel,
  generateTranscript
};
