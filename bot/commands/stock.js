const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBloxFruitsStock, getRarityIcon, getRarityColor } = require('../bloxfruits-stock.js');
const botConfig = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('🍇 ตรวจสอบสถานะผลปีศาจในร้านค้า Blox Fruits (Live Dealer Stock)')
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
        await interaction.deferReply({ ephemeral: false });

        try {
            const dealerChoice = interaction.options?.getString('dealer') || 'all';
            const stock = await getBloxFruitsStock(false);

            const normalResetUnix = Math.floor(stock.normal.resetsAt / 1000);
            const mirageResetUnix = Math.floor(stock.mirage.resetsAt / 1000);

            // ตรวจสอบว่ามีผลระดับสูง (Legendary / Mythical) วางจำหน่ายหรือไม่
            const highTierNormal = stock.normal.fruits.filter(f => f.rarity === 'Legendary' || f.rarity === 'Mythical');
            const highTierMirage = stock.mirage.fruits.filter(f => f.rarity === 'Legendary' || f.rarity === 'Mythical');

            let embedColor = 0x38bdf8;
            if (highTierNormal.length > 0 || highTierMirage.length > 0) {
                embedColor = 0xa855f7; // สีม่วงเข้มแสดงว่ามีผลแรร์เข้า
            }

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle('🍇 ตรวจสอบผลปีศาจในร้านค้า Blox Fruits (Live Stock)')
                .setDescription(
                    `ข้อมูลสต็อกผลปีศาจแบบเรียลไทม์จากระบบร้านค้า Blox Fruits\n` +
                    (highTierNormal.length > 0 || highTierMirage.length > 0
                        ? `🔥 **ผลยอดฮิตเข้าแล้ว:** ${[...highTierNormal, ...highTierMirage].map(f => `**${f.name}**`).join(', ')}`
                        : `💡 *Tip: ผลจะหมุนเวียนอัตโนมัติเมื่อถึงเวลารีเซ็ต*`)
                )
                .setThumbnail('https://i.postimg.cc/cHdrRJVP/Rocket.png')
                .setFooter({ text: 'BlacklistScriptx • ระบบติดตามผลปีศาจ Blox Fruits อัตโนมัติ' })
                .setTimestamp();

            // แสดงส่วนของ Normal Dealer
            if (dealerChoice === 'all' || dealerChoice === 'normal') {
                const normalList = stock.normal.fruits.map(f => {
                    const icon = getRarityIcon(f.rarity);
                    const beli = typeof f.beliPrice === 'number' ? `$${f.beliPrice.toLocaleString()}` : '-';
                    const robux = typeof f.robuxPrice === 'number' ? `R$ ${f.robuxPrice}` : '-';
                    const tag = (f.rarity === 'Mythical' || f.rarity === 'Legendary') ? ' ⭐' : '';
                    return `${icon} **${f.name}**${tag} \`[${f.rarity}]\` — 💵 ${beli} | 🪙 ${robux}`;
                }).join('\n');

                embed.addFields({
                    name: `🏪 พ่อค้าปกติ (Normal Dealer) — รีเซ็ต: <t:${normalResetUnix}:R>`,
                    value: normalList || 'ไม่มีผลวางจำหน่ายในขณะนี้',
                    inline: false
                });
            }

            // แสดงส่วนของ Mirage Dealer
            if (dealerChoice === 'all' || dealerChoice === 'mirage') {
                const mirageList = stock.mirage.fruits.map(f => {
                    const icon = getRarityIcon(f.rarity);
                    const beli = typeof f.beliPrice === 'number' ? `$${f.beliPrice.toLocaleString()}` : '-';
                    const robux = typeof f.robuxPrice === 'number' ? `R$ ${f.robuxPrice}` : '-';
                    const tag = (f.rarity === 'Mythical' || f.rarity === 'Legendary') ? ' ⭐' : '';
                    return `${icon} **${f.name}**${tag} \`[${f.rarity}]\` — 💵 ${beli} | 🪙 ${robux}`;
                }).join('\n');

                embed.addFields({
                    name: `🏝️ พ่อค้าเกาะมายา (Mirage Dealer) — รีเซ็ต: <t:${mirageResetUnix}:R>`,
                    value: mirageList || 'ไม่มีผลวางจำหน่ายในขณะนี้',
                    inline: false
                });
            }

            // Action Buttons
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

            return interaction.editReply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error('[Slash Command /stock error]:', err.message);
            return interaction.editReply({
                content: `⚠️ เกิดข้อผิดพลาดในการดึงข้อมูลสต็อกผลปีศาจ: ${err.message}`
            });
        }
    }
};
