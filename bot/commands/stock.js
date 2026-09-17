const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getBloxFruitsStock, createStockEmbed } = require('../bloxfruits-stock.js');
const botConfig = require('../config.js');
const db = require('../../db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('🍇 ตรวจสอบสถานะผลปีศาจในร้านค้า Blox Fruits (Live Dealer Stock)')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('โหมด: เช็คครั้งเดียว หรือ ตั้งเป็นกระดานสดอัปเดตตลอด 24 ชม. (พิมพ์ครั้งเดียวปล่อยยาว)')
                .setRequired(false)
                .addChoices(
                    { name: '⚡ เช็คผลรอบนี้ (ค่าเริ่มต้น)', value: 'check' },
                    { name: '🟢 กระดานสด 24 ชม. (พิมพ์ครั้งเดียวปล่อยยาว อัปเดตตลอด)', value: 'live' }
                )
        )
        .addStringOption(option =>
            option.setName('dealer')
                .setDescription('เลือกร้านค้าที่ต้องการเช็ค')
                .setRequired(false)
                .addChoices(
                    { name: '🌐 ทั้งหมด (ร้านปกติ & เกาะมายา)', value: 'all' },
                    { name: '🏪 พ่อค้าปกติ (Normal Dealer - รีเซ็ตทุก 4 ชม.)', value: 'normal' },
                    { name: '🏝️ พ่อค้าเกาะมายา (Mirage Dealer - รีเซ็ตทุก 2 ชม.)', value: 'mirage' }
                )
        ),

    async execute(interaction) {
        // หากเป็นการกดปุ่ม stock_refresh ให้ update message เดิม
        const isButton = interaction.isButton && interaction.isButton();
        const modeChoice = interaction.options?.getString('mode') || 'check';
        const targetLiveChannel = botConfig.stockLiveChannelId || '1549774966474674259';

        // ป้องกันไม่ให้ตั้งกระดานผลสดในห้องอื่น นอกจากห้องที่กำหนดไว้เท่านั้น
        if (!isButton && modeChoice === 'live' && interaction.channelId !== targetLiveChannel) {
            return interaction.reply({
                content: `⛔ **กระดานผลสด 24 ชม. (Live Stock) กำหนดให้ลงเฉพาะห้อง <#${targetLiveChannel}> เท่านั้นครับ**\n💡 *(คุณสามารถใช้โหมดเช็คปกติ \`/stock\` ในห้องนี้ หรือไปดูกระดานผลสดที่ห้องดังกล่าวได้ครับ)*`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (isButton) {
            await interaction.deferUpdate().catch(() => {});
        } else {
            await interaction.deferReply();
        }

        try {
            const dealerChoice = interaction.options?.getString('dealer') || 'all';
            const isLive = modeChoice === 'live';

            const stock = await getBloxFruitsStock(isButton); // ถ้ากดปุ่มให้ดึงสด
            const embed = createStockEmbed(stock, { isLive, dealer: dealerChoice });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('🌐 เว็บไซต์สคริปต์ฮับ')
                    .setStyle(ButtonStyle.Link)
                    .setURL(botConfig.websiteUrl || 'https://blacklistscripty.vercel.app'),
                new ButtonBuilder()
                    .setCustomId('stock_refresh')
                    .setLabel('🔄 รีเฟรชข้อมูล')
                    .setStyle(ButtonStyle.Secondary)
            );

            let message;
            if (isButton) {
                message = await interaction.editReply({ embeds: [embed], components: [row] });
            } else {
                message = await interaction.editReply({ embeds: [embed], components: [row] });
            }

            // ถ้าเลือกโหมด live ในห้องที่กำหนด ให้บันทึก Message ID ลงฐานข้อมูล
            if (isLive && !isButton) {
                try {
                    const panels = [{
                        channelId: targetLiveChannel,
                        messageId: message.id,
                        guildId: interaction.guildId || '',
                        dealer: dealerChoice,
                        createdAt: Date.now()
                    }];
                    db.saveConfig({ stock_live_panels: panels });

                    await interaction.followUp({
                        content: `✅ **ตั้งค่ากระดานผลสด 24 ชม. ในห้อง <#${targetLiveChannel}> สำเร็จ!**\n📌 ข้อความด้านบนนี้จะคอยแก้ไขและอัปเดตข้อมูลสดให้ตลอด 24 ชม. อัตโนมัติทุก 1 นาที คุณสามารถปล่อยยาวทิ้งไว้ในห้องนี้ได้เลยโดยไม่ต้องพิมพ์ใหม่ครับ! 🎉`,
                        flags: MessageFlags.Ephemeral
                    }).catch(() => {});
                } catch (saveErr) {
                    console.error('[Stock Save Panel Error]:', saveErr);
                }
            }
        } catch (err) {
            console.error('[Slash Command /stock error]:', err.message);
            const errPayload = { content: `⚠️ เกิดข้อผิดพลาดในการดึงข้อมูลสต็อกผลปีศาจ: ${err.message}` };
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(errPayload).catch(() => {});
            } else {
                await interaction.reply(errPayload).catch(() => {});
            }
        }
    }
};
