const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const config = require('../config');

async function createTicketChannel(guild, user) {
  // Check if user already has an active open ticket
  const existingTicket = db.findOpenTicketByUser(user.id);
  if (existingTicket && existingTicket.channelId) {
    try {
      const existingChannel = await guild.channels.fetch(existingTicket.channelId).catch(() => null);
      if (existingChannel) {
        return { alreadyExists: true, channel: existingChannel };
      } else {
        // Channel was deleted manually from Discord, close it in DB
        db.closeTicket(existingTicket.channelId, 'system_auto_cleanup');
      }
    } catch {}
  }

  // Setup permission overwrites
  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory
      ]
    },
    {
      id: guild.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles
      ]
    }
  ];

  // Add staff role permissions if configured
  if (config.staffRoleId) {
    permissionOverwrites.push({
      id: config.staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages
      ]
    });
  }

  // Create channel name (ticket-0001-username)
  const nextNumber = db.getNextTicketNumber();
  const safeName = user.username.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 15) || 'user';
  const channelName = `ticket-${nextNumber}-${safeName}`;

  const channelOptions = {
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites,
    topic: `Ticket สำหรับคุณ ${user.tag || user.username} (ID: ${user.id})`
  };

  // If category ID is set and exists
  if (config.ticketCategoryId) {
    try {
      const category = await guild.channels.fetch(config.ticketCategoryId).catch(() => null);
      if (category && category.type === ChannelType.GuildCategory) {
        channelOptions.parent = category.id;
      }
    } catch {}
  }

  const channel = await guild.channels.create(channelOptions);

  // Save ticket to database
  const ticketRecord = db.createTicket(channel.id, user.id);

  const bannerPath = path.join(__dirname, '..', 'assets', 'ticket-banner.png');
  const files = [];

  // Welcome Embed
  const welcomeEmbed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`🎫 ตั๋วสั่งซื้อ #${ticketRecord.ticketNumber}`)
    .setDescription(
      `สวัสดีค่าคุณ <@${user.id}> ✨\n\n` +
      `1️⃣ พิมพ์แจ้งสินค้า/สคริปต์ที่ต้องการ\n` +
      `2️⃣ กดปุ่ม **[ 💳 ช่องทางชำระเงิน ]** ด้านล่าง\n` +
      `3️⃣ โอนแล้ว **ส่งสลิปในห้องนี้** ได้เลยค่ะ\n\n` +
      `💖 *แม่ค้าจะรีบเข้ามาส่งของให้เยย~*`
    )
    .setFooter({ text: 'กดปุ่มด้านล่างเพื่อทำรายการ' })
    .setTimestamp();

  if (fs.existsSync(bannerPath)) {
    const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'ticket-banner.png' });
    files.push(bannerAttachment);
    welcomeEmbed.setImage('attachment://ticket-banner.png');
  }

  // Action Buttons for open ticket (Close & Payment)
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

  // Send ping and embed
  const staffMention = config.staffRoleId ? `<@&${config.staffRoleId}>` : '';
  await channel.send({
    content: `ยินดีต้อนรับคุณ <@${user.id}> ${staffMention}`,
    embeds: [welcomeEmbed],
    files,
    components: [buttonsRow]
  });

  return { alreadyExists: false, channel };
}

/**
 * Generate transcript text of channel messages
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
    console.error('[Transcript Error]:', error);
    return null;
  }
}

module.exports = {
  createTicketChannel,
  generateTranscript
};
