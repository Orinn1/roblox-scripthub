/**
 * ⚡ Event: interactionCreate
 * ศูนย์กลางดักจับการทำงานของ GUI ทุกประเภท (Commands, Buttons, Select Menus, Modals)
 * ⚠️ ทำงานแบบถาวร ไม่ใช้ Collector ที่หมดอายุ ทุกปุ่มใช้งานได้ตลอดแม้บอทรีสตาร์ท
 */
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder,
    PermissionsBitField 
} = require('discord.js');

const { 
    getCandyBalance, 
    consumeCandy, 
    saveGachaRole, 
    deleteGachaRole,
    rewardVoiceCandy 
} = require('../database/db');

const { spinGacha, getGachaRateList } = require('../modules/gacha-engine');
const { drawTarotCard } = require('../modules/horoscope-data');


module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {

        // =========================================================================
        // 1. SLASH COMMANDS DISPATCHER
        // =========================================================================
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ [Command Error: ${interaction.commandName}]:`, error);
                const replyMethod = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
                await interaction[replyMethod]({
                    content: '⚠️ อุ๊ย! เกิดข้อผิดพลาดตอนรันคำสั่ง ลองใหม่อีกทีนะเตง',
                    ephemeral: true
                }).catch(() => {});
            }
            return;
        }

        // =========================================================================
        // 2. BUTTONS DISPATCHER (แผงปุ่มกด GUI ถาวร)
        // =========================================================================
        if (interaction.isButton()) {
            const customId = interaction.customId;

            // -------------------------------------------------------------
            // 2.1 ตู้ที่ 1: ตู้เปิดไพ่ทาโรต์พยากรณ์ดวง (Tarot Card Reading)
            // -------------------------------------------------------------
            if (customId.startsWith('horoscope_topic:') || customId === 'horoscope_roll') {
                const topic = customId.startsWith('horoscope_topic:') ? customId.split(':')[1] : 'overall';
                const tarot = drawTarotCard(topic, interaction.user.username);

                const embed = new EmbedBuilder()
                    .setColor(tarot.colorHex)
                    .setTitle(tarot.topicTitle)
                    .setDescription(`🃏 **ไพ่ประจำตัวเตง:** \`${tarot.cardName}\`\n✨ **ระดับพลังงาน:** ${tarot.stars}`)
                    .addFields(
                        { name: tarot.fieldTitle, value: tarot.prediction, inline: false },
                        { name: '💡 ไพ่อยากบอกเตงว่า:', value: tarot.advice, inline: false },
                        { name: '🔢 เลขเด็ดนำโชค', value: `\`${tarot.luckyNumbers}\``, inline: true },
                        { name: '🎨 สีมงคลเรียกทรัพย์', value: tarot.auspiciousColor, inline: true }
                    )
                    .setThumbnail(tarot.cardImage)
                    .setFooter({ text: 'คำทำนายส่วนตัวของเตง • คนอื่นมองไม่เห็นน้า จุ๊ๆ 🤫' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // -------------------------------------------------------------
            // 2.5 ตู้ที่ 2: สุ่มกาชารับยศ (Role Gacha Spin)
            // -------------------------------------------------------------
            if (customId === 'gacha_spin') {
                const userId = interaction.user.id;
                const guildId = interaction.guild.id;
                const cost = 10;

                // เช็คลูกอมของเซิร์ฟเวอร์นี้
                const currentCandy = getCandyBalance(guildId, userId);
                if (currentCandy < cost) {
                    return interaction.reply({
                        content: `🍬 **ลูกอมไม่พออ่าเตง!**\nมีอยู่แค่ **${currentCandy}** เม็ดเอง แต่หมุนรอบนึงใช้ **${cost}** เม็ดน้า\n💡 *ทริคง่ายๆ: แค่ไปนั่งคุยในห้อง Voice ชิลๆ ครบ 1 ชม. ได้ฟรี 10 เม็ดเลย (1 เม็ดทุก 6 นาที) รีบไปตุนเร็ว!*`,
                        ephemeral: true
                    });
                }

                // หักลูกอมของเซิร์ฟเวอร์นี้
                const deducted = consumeCandy(guildId, userId, cost);
                if (!deducted) {
                    return interaction.reply({
                        content: '⚠️ หักลูกอมไม่สำเร็จง่ะ ระบบสะดุดแป๊บนึง ลองกดใหม่อีกทีนะเตง',
                        ephemeral: true
                    });
                }

                // สุ่มยศ
                const result = spinGacha(guildId);
                if (!result.success) {
                    // คืนลูกอมถ้าสุ่มไม่สำเร็จ (เช่น ตู้ว่าง)
                    const { rewardVoiceCandy } = require('../database/db');
                    rewardVoiceCandy(guildId, userId, cost);
                    return interaction.reply({
                        content: `⚠️ ${result.message}`,
                        ephemeral: true
                    });
                }

                const wonItem = result.item;
                const member = interaction.member;

                // มอบยศให้ผู้เล่น
                let roleGivenText = '';
                const role = interaction.guild.roles.cache.get(wonItem.roleId);
                if (role) {
                    try {
                        await member.roles.add(wonItem.roleId);
                        roleGivenText = `🎉 **แตกแล้วจ้าาา! ได้รับยศ:** <@&${wonItem.roleId}> ติดตัวไปเล้ยยย! เท่จัดดด ✨`;
                    } catch (err) {
                        roleGivenText = `⚠️ ได้รับสิทธิ์ยศ <@&${wonItem.roleId}> แต่บอทมอบยศให้ไม่ได้ง่ะ ทักสะกิดแอดมินด่วนๆ!`;
                    }
                } else {
                    roleGivenText = `⚠️ สุ่มได้ยศ **${wonItem.roleName}** แต่หาตัวยศในเซิร์ฟไม่เจออ่าเตง`;
                }

                const remainingCandy = getCandyBalance(guildId, userId);

                const spinEmbed = new EmbedBuilder()
                    .setColor(wonItem.rarity === 'Legendary' ? '#F1C40F' : (wonItem.rarity === 'Epic' ? '#9B59B6' : '#2ECC71'))
                    .setTitle('🎰 แตกล้นตู้! ผลการสุ่มกาชารับยศ')
                    .setDescription(
                        `${roleGivenText}\n\n` +
                        `⭐ **ระดับความแรร์:** \`${wonItem.rarity}\`\n` +
                        `📊 **เรทดรอป:** \`${wonItem.percent}%\`\n` +
                        `🍬 **ลูกอมคงเหลือ:** \`${remainingCandy}\` เม็ด`
                    )
                    .setThumbnail('https://media1.tenor.com/m/h2sWwX5P4WcAAAAC/gacha-pull.gif')
                    .setFooter({ text: 'ดวงกำลังมา! รอบหน้าอาจจะได้ตัวท็อปอีกนะวัยรุ่น 🔥' })
                    .setTimestamp();

                return interaction.reply({ embeds: [spinEmbed], ephemeral: true });
            }

            // -------------------------------------------------------------
            // 2.6 เช็คกระเป๋าลูกอม
            // -------------------------------------------------------------
            if (customId === 'gacha_balance') {
                const balance = getCandyBalance(interaction.guild.id, interaction.user.id);
                const spins = Math.floor(balance / 10);

                const embed = new EmbedBuilder()
                    .setColor('#F1C40F')
                    .setTitle('🍬 คลังลูกอมของเตง')
                    .setDescription(`ตอนนี้ตุนลูกอมไว้: **${balance}** เม็ด ✨\n🎰 หมุนกาชาต่อได้อีกจุกๆ **${spins}** รอบ`)
                    .setFooter({ text: 'สิงห้องคุย Voice ได้ฟรี 10 เม็ดทุกชั่วโมง นั่งยาวๆ ได้เลย' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // -------------------------------------------------------------
            // 2.7 ดูเรทและรางวัลในตู้กาชา
            // -------------------------------------------------------------
            if (customId === 'gacha_rates') {
                const rates = getGachaRateList(interaction.guild.id);
                if (rates.length === 0) {
                    return interaction.reply({
                        content: 'ℹ️ ตู้กาชายังว่างเปล่าอยู่น้า รอแอดมินมาลงของแป๊บ',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📋 ส่องเรทดรอปตู้กาชา (Gacha Drop Rates)')
                    .setDescription(
                        rates.map((r, i) => `${i + 1}. <@&${r.roleId}> | แรร์: **${r.rarity}** | เรทดรอป: **${r.percent}%**`).join('\n')
                    )
                    .setFooter({ text: 'คำนวณตามค่าน้ำหนักจริง (Weighted Random) ดวงล้วนๆ ไม่มีกั๊ก!' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // -------------------------------------------------------------
            // 2.8 แผงตั้งค่าตู้สุ่มหลังบ้าน (แอดมิน)
            // -------------------------------------------------------------
            if (customId === 'gacha_admin_btn') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({
                        content: '🚫 ตัวตึงแอดมินเท่านั้นถึงจะปรับได้น้าา สมาชิกทั่วไปอย่าซน!',
                        ephemeral: true
                    });
                }

                const adminEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('🛠️ แผงจัดการตู้กาชาหลังบ้าน (Gacha Backstage)')
                    .setDescription(
                        'เลือกยศจากเมนูด้านล่างนี้เพื่อ **ยัดยศลงตู้** หรือ **ปรับเรทดรอป** ได้เลยเตง\n' +
                        'หรือใช้คำสั่ง `/setup_gacha_admin` เพื่อวางแผงถาวรในห้องแอดมิน'
                    );

                const roleSelect = new RoleSelectMenuBuilder()
                    .setCustomId('gacha_add_role_select')
                    .setPlaceholder('👉 จิ้มเลือกยศที่อยากใส่ตู้กาชา...')
                    .setMinValues(1)
                    .setMaxValues(1);

                const row = new ActionRowBuilder().addComponents(roleSelect);

                return interaction.reply({
                    embeds: [adminEmbed],
                    components: [row],
                    ephemeral: true
                });
            }

            // -------------------------------------------------------------
            // 2.9 ปุ่มของแผงแอดมิน: ดูเรทในตู้กาชา
            // -------------------------------------------------------------
            if (customId === 'gacha_panel_list') {
                const rates = getGachaRateList(interaction.guild.id);
                if (rates.length === 0) {
                    return interaction.reply({
                        content: '⚠️ ตู้กาชายังโล่งอยู่เลยเตง! จิ้มเลือกยศที่เมนูด้านบนเพื่อเพิ่มยศได้ทันทีน้า',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📋 เรทตู้กาชาปัจจุบัน (Gacha Drop Rates)')
                    .setDescription(
                        rates.map((r, i) => `${i + 1}. <@&${r.roleId}> | แรร์: **${r.rarity}** | เรทดรอป: **${r.percent}%** (น้ำหนัก: ${r.weight})`).join('\n')
                    )
                    .setFooter({ text: `ยศทั้งหมดในตู้: ${rates.length} ยศ` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // -------------------------------------------------------------
            // 2.10 ปุ่มของแผงแอดมิน: ลบยศออกจากตู้
            // -------------------------------------------------------------
            if (customId === 'gacha_panel_remove_role') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({
                        content: '🚫 เฉพาะแอดมินเท่านั้นที่จะถอดยศได้น้า!',
                        ephemeral: true
                    });
                }

                const rates = getGachaRateList(interaction.guild.id);
                if (rates.length === 0) {
                    return interaction.reply({
                        content: '⚠️ ในตู้กาชายังไม่มียศให้ถอดเลยเตง',
                        ephemeral: true
                    });
                }

                const deleteMenu = new StringSelectMenuBuilder()
                    .setCustomId('gacha_delete_role_select')
                    .setPlaceholder('👉 จิ้มเลือกยศที่จะเตะออกจากตู้...')
                    .addOptions(
                        rates.slice(0, 25).map(r => ({
                            label: (r.roleName || `Role ${r.roleId}`).substring(0, 50),
                            description: `แรร์: ${r.rarity} | โอกาสออก: ${r.percent}%`,
                            value: r.roleId
                        }))
                    );

                const row = new ActionRowBuilder().addComponents(deleteMenu);
                return interaction.reply({
                    content: '🗑️ อยากถอดยศไหนออกจากตู้ จิ้มเลือกด้านล่างได้เลย:',
                    components: [row],
                    ephemeral: true
                });
            }

            // -------------------------------------------------------------
            // 2.11 ปุ่มของแผงแอดมิน: เสก/มอบลูกอม
            // -------------------------------------------------------------
            if (customId === 'gacha_panel_give_candy') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({
                        content: '🚫 เฉพาะแอดมินเท่านั้นที่จะเสกลูกอมได้นะเตง!',
                        ephemeral: true
                    });
                }

                const userSelect = new UserSelectMenuBuilder()
                    .setCustomId('gacha_give_candy_user_select')
                    .setPlaceholder('👉 เลือกสมาชิกที่อยากเปย์ลูกอมให้...')
                    .setMinValues(1)
                    .setMaxValues(1);

                const row = new ActionRowBuilder().addComponents(userSelect);
                return interaction.reply({
                    content: '🎁 เลือกเพื่อนหรือสมาชิกที่อยากเปย์ลูกอมให้จากเมนูด้านล่างนี้เล้ย:',
                    components: [row],
                    ephemeral: true
                });
            }

            // -------------------------------------------------------------
            // 2.12 ปุ่มรีเฟรชข้อมูลกระดานผู้นำ (Leaderboard Refresh)
            // -------------------------------------------------------------
            if (customId === 'leaderboard_refresh') {
                const { generateLeaderboardData } = require('../modules/leaderboard-updater');
                const data = generateLeaderboardData(interaction.guild?.id, interaction.guild?.name);
                return interaction.update(data).catch(() => {});
            }

            // -------------------------------------------------------------
            // 2.13 ปุ่มเปิด-ปิดระบบกันสแปม (Anti-Spam Toggle Button)
            // -------------------------------------------------------------
            if (customId === 'antispam_toggle') {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({
                        content: '🚫 ตัวตึงแอดมินเท่านั้นถึงจะเปิด-ปิดระบบกันสแปมได้น้าา สมาชิกทั่วไปอย่าซน!',
                        ephemeral: true
                    });
                }

                const { getGuildConfig, setAntiScamEnabled } = require('../database/db');
                const { generateAntiSpamPanel } = require('../modules/anti-scam');

                const currentConfig = getGuildConfig(interaction.guild.id);
                const isCurrentlyEnabled = currentConfig ? currentConfig.antiScamEnabled !== 0 : true;

                // สลับสถานะ (ถ้าเปิดอยู่ก็ปิด ถ้าปิดอยู่ก็เปิด)
                const newStatus = !isCurrentlyEnabled;
                setAntiScamEnabled(interaction.guild.id, newStatus);

                const updatedPanel = generateAntiSpamPanel(interaction.guild);

                return interaction.update(updatedPanel).catch(() => {});
            }

        }

        // =========================================================================
        // 3. SELECT MENUS DISPATCHER
        // =========================================================================
        if (interaction.isRoleSelectMenu()) {
            // เมื่อแอดมินเลือกยศเพื่อใส่ในตู้กาชา -> เปิด Modal ให้พิมพ์ตัวเลขเรท
            if (interaction.customId === 'gacha_add_role_select') {
                const roleId = interaction.values[0];
                const role = interaction.guild.roles.cache.get(roleId);

                const modal = new ModalBuilder()
                    .setCustomId(`gacha_modal_weight:${roleId}`)
                    .setTitle(`⚙️ ปรับเรท: @${role ? role.name : 'Role'}`.substring(0, 45));

                const weightInput = new TextInputBuilder()
                    .setCustomId('weight')
                    .setLabel('ค่าน้ำหนักเรท (เช่น 10, 25, 50 ยิ่งเยอะยิ่งออกง่าย)')
                    .setStyle(TextInputStyle.Short)
                    .setValue('15')
                    .setRequired(true);

                const rarityInput = new TextInputBuilder()
                    .setCustomId('rarity')
                    .setLabel('ระดับความแรร์ (Common / Rare / Epic / Legendary)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Common / Rare / Epic / Legendary')
                    .setValue('Rare')
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(weightInput),
                    new ActionRowBuilder().addComponents(rarityInput)
                );

                return interaction.showModal(modal);
            }
        }

        // =========================================================================
        // 3.2 STRING SELECT MENUS DISPATCHER
        // =========================================================================
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'horoscope_select_topic') {
                const topic = interaction.values[0];
                const tarot = drawTarotCard(topic, interaction.user.username);

                const embed = new EmbedBuilder()
                    .setColor(tarot.colorHex)
                    .setTitle(tarot.topicTitle)
                    .setDescription(`🃏 **ไพ่ประจำตัวเตง:** \`${tarot.cardName}\`\n✨ **ระดับพลังงาน:** ${tarot.stars}`)
                    .addFields(
                        { name: tarot.fieldTitle, value: tarot.prediction, inline: false },
                        { name: '💡 ไพ่อยากบอกเตงว่า:', value: tarot.advice, inline: false },
                        { name: '🔢 เลขเด็ดนำโชค', value: `\`${tarot.luckyNumbers}\``, inline: true },
                        { name: '🎨 สีมงคลเรียกทรัพย์', value: tarot.auspiciousColor, inline: true }
                    )
                    .setThumbnail(tarot.cardImage)
                    .setFooter({ text: 'คำทำนายส่วนตัวของเตง • คนอื่นมองไม่เห็นน้า จุ๊ๆ 🤫' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // เมื่อแอดมินเลือกลบยศออกจากตู้กาชา
            if (interaction.customId === 'gacha_delete_role_select') {
                const roleId = interaction.values[0];
                const success = deleteGachaRole(interaction.guild.id, roleId);
                return interaction.reply({
                    content: success 
                        ? `🗑️ เตะยศ <@&${roleId}> ออกจากตู้เรียบร้อยแล้ววัยรุ่น!` 
                        : `⚠️ ไม่พบยศ <@&${roleId}> ในตู้กาชาแล้วง่ะ`,
                    ephemeral: true
                });
            }
        }

        // =========================================================================
        // 3.3 USER SELECT MENUS DISPATCHER
        // =========================================================================
        if (interaction.isUserSelectMenu()) {
            if (interaction.customId === 'gacha_give_candy_user_select') {
                const targetUserId = interaction.values[0];
                const member = interaction.guild.members.cache.get(targetUserId);
                const username = member ? member.user.username : 'User';

                const modal = new ModalBuilder()
                    .setCustomId(`gacha_candy_amount_modal:${targetUserId}`)
                    .setTitle(`🎁 เปย์ลูกอมให้ ${username.substring(0, 20)}`);

                const amountInput = new TextInputBuilder()
                    .setCustomId('amount')
                    .setLabel('จำนวนลูกอม (ใส่เลขบวกเพื่อแจก / ติดลบเพื่อยึด)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('เช่น 50, 100 หรือ -20')
                    .setValue('50')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
                return interaction.showModal(modal);
            }
        }

        // =========================================================================
        // 4. MODALS DISPATCHER (ส่งข้อมูลฟอร์ม)
        // =========================================================================
        if (interaction.isModalSubmit()) {
            const customId = interaction.customId;

            // -------------------------------------------------------------
            // 4.1 บันทึกเรทยศในตู้กาชา (จาก Modal หลังบ้าน)
            // -------------------------------------------------------------
            if (customId.startsWith('gacha_modal_weight:')) {
                const roleId = customId.split(':')[1];
                const weightStr = interaction.fields.getTextInputValue('weight');
                const rarity = interaction.fields.getTextInputValue('rarity') || 'Normal';
                const role = interaction.guild.roles.cache.get(roleId);

                const weight = parseFloat(weightStr);
                if (isNaN(weight) || weight <= 0) {
                    return interaction.reply({
                        content: '❌ ตัวเลขค่าน้ำหนักต้องมากกว่า 0 นะเตง',
                        ephemeral: true
                    });
                }

                saveGachaRole(interaction.guild.id, roleId, role ? role.name : 'Role', weight, rarity);

                const rates = getGachaRateList(interaction.guild.id);
                const thisItem = rates.find(r => r.roleId === roleId);

                const embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('✅ อัปเดตเรทยศเรียบร้อยจ้า!')
                    .setDescription(`ยศ: <@&${roleId}>\nระดับความแรร์: **${rarity}**\nค่าน้ำหนัก: **${weight}**\nโอกาสดรอปโดยประมาณ: **${thisItem ? thisItem.percent : weight}%**`);

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // -------------------------------------------------------------
            // 4.4 มอบลูกอมให้สมาชิก (จาก Modal แผงแอดมิน)
            // -------------------------------------------------------------
            if (customId.startsWith('gacha_candy_amount_modal:')) {
                const targetUserId = customId.split(':')[1];
                const amountStr = interaction.fields.getTextInputValue('amount');
                const amount = parseInt(amountStr, 10);

                if (isNaN(amount)) {
                    return interaction.reply({
                        content: '❌ กรอกเป็นตัวเลขจำนวนเต็มเท่านั้นนะเตงงง',
                        ephemeral: true
                    });
                }

                const newBalance = rewardVoiceCandy(interaction.guild.id, targetUserId, amount);

                const embed = new EmbedBuilder()
                    .setColor('#F1C40F')
                    .setTitle('🎁 เปย์ลูกอมเรียบร้อย!')
                    .setDescription(`เปย์ลูกอมจำนวน **${amount > 0 ? '+' + amount : amount}** เม็ดให้ <@${targetUserId}> เรียบร้อย\n🍬 ตอนนี้มีลูกอมในกระเป๋า: **${newBalance}** เม็ด ✨`)
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};
