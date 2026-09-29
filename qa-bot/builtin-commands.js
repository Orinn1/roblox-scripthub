const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    version: djsVersion 
} = require('discord.js');
const { askGemini, splitDiscordMessage, clearSessionMemory, getFAQList } = require('./ai-service');
const config = require('./config');

const chatCommand = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('ชวน Mr.beast คุยเล่น หรือมาท้าทายให้โดนด่า! 🔥')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('ข้อความที่อยากคุยหรือบวกกับ Mr.beast')
                .setRequired(true)
        ),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        await interaction.deferReply();

        try {
            const isDM = !interaction.guild;
            const sessionId = isDM ? `dm_${interaction.user.id}` : `${interaction.channelId}_${interaction.user.id}`;
            const userName = interaction.user.displayName || interaction.user.username;
            
            const replyText = await askGemini(sessionId, message, userName);
            const chunks = splitDiscordMessage(replyText);

            if (chunks.length > 0) {
                await interaction.editReply({ 
                    content: `💬 **คุณ ${userName}:** ${message}\n\n🤖 **Mr.beast:** ${chunks[0]}` 
                });
            }

            for (let i = 1; i < chunks.length; i++) {
                await interaction.followUp({ content: chunks[i] });
            }
        } catch (error) {
            console.error('[Command: chat Error]', error);
            await interaction.editReply({ content: `❌ เกิดข้อผิดพลาดในการคุยกับ Mr.beast: ${error.message}` });
        }
    }
};

const askCommand = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('ถามปัญหาหรือเรื่องสคริปต์กับ Mr.beast (ระวังโดนด่านะ 55555)')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('คำถามที่ต้องการถาม')
                .setRequired(true)
        ),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        await interaction.deferReply();

        try {
            const sessionId = interaction.guild 
                ? `${interaction.channelId}_${interaction.user.id}` 
                : `dm_${interaction.user.id}`;
            const userName = interaction.user.displayName || interaction.user.username;
            const answer = await askGemini(sessionId, question, userName);

            const chunks = splitDiscordMessage(answer);

            const embed = new EmbedBuilder()
                .setColor(config.botColor)
                .setAuthor({ 
                    name: `คำถามจาก: ${userName}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setDescription(`❓ **คำถาม:**\n> ${question}\n\n🤖 **คำตอบจาก Mr.beast:**\n${chunks[0]}`)
                .setFooter({ text: `โมเดล: ${config.groqModel || config.geminiModel} • แท็ก @Mr.beast หรือใช้ /chat เพื่อคุยเล่น` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            for (let i = 1; i < chunks.length; i++) {
                await interaction.followUp({ content: chunks[i] });
            }
        } catch (error) {
            console.error('[Command: ask Error]', error);
            await interaction.editReply({ content: `❌ เกิดข้อผิดพลาดในการประมวลผล: ${error.message}` });
        }
    }
};

const faqCommand = {
    data: new SlashCommandBuilder()
        .setName('faq')
        .setDescription('แสดงรายการคำถามที่พบบ่อย (FAQ)'),
    async execute(interaction) {
        const faqs = getFAQList();

        if (faqs.length === 0) {
            return interaction.reply({
                content: 'ℹ️ ขณะนี้ยังไม่มีรายการ FAQ ในระบบค่ะ',
                ephemeral: true
            });
        }

        const options = faqs.map(item => ({
            label: item.question.length > 95 ? item.question.substring(0, 95) + '...' : item.question,
            description: item.answer.replace(/\n/g, ' ').substring(0, 95),
            value: item.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('faq_select')
            .setPlaceholder('คลิกเพื่อเลือกหัวข้อคำถามที่ต้องการดูคำตอบ...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor(config.botColor)
            .setTitle('📚 รวมคำถามที่พบบ่อย (FAQ)')
            .setDescription('กรุณาเลือกหัวข้อคำถามจากเมนูด้านล่างนี้เพื่อดูคำตอบได้ทันทีค่ะ หรือหากไม่พบคำตอบสามารถพิมพ์ถามในห้องแชทได้เลยค่ะ ✨')
            .setFooter({ text: 'Blacklist Script Hub • บริการตอบคำถามอัตโนมัติ' })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
};

const clearCommand = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('ล้างความจำและประวัติการสนทนาของ AI'),
    async execute(interaction) {
        const isDM = !interaction.guild;
        const userSessionKey = isDM ? `dm_${interaction.user.id}` : `${interaction.channelId}_${interaction.user.id}`;
        const clearedUser = clearSessionMemory(userSessionKey);
        const clearedChannel = clearSessionMemory(interaction.channelId);
        const cleared = clearedUser || clearedChannel;

        const embed = new EmbedBuilder()
            .setColor(config.botColor)
            .setTitle('🧹 ล้างประวัติการสนทนาเรียบร้อยแล้ว')
            .setDescription(cleared 
                ? 'AI ได้ลืมบทสนทนาก่อนหน้านี้ทั้งหมดแล้วจ้า! สามารถเริ่มชวนคุยหรือถามหัวข้อใหม่ได้ทันทีเลยนะ 555 ✨' 
                : 'ยังไม่มีประวัติการสนทนาก่อนหน้านี้ที่ถูกบันทึกไว้ค่ะ สามารถเริ่มพิมพ์คุยได้เลยนะคะ!')
            .setFooter({ text: 'AI พร้อมสำหรับคำถามใหม่แล้ว ✨' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

const botinfoCommand = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('ดูข้อมูลและสถานะการทำงานของบอท AI'),
    async execute(interaction) {
        const client = interaction.client;
        const uptime = Math.floor(client.uptime / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const uptimeStr = `${hours} ชม. ${minutes} นาที ${seconds} วินาที`;

        const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const activeModel = config.groqApiKey ? `Groq (${config.groqModel})` : `Gemini (${config.geminiModel})`;

        const embed = new EmbedBuilder()
            .setColor(config.botColor)
            .setTitle(`🤖 ข้อมูลบอท: ${client.user.username}`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🧠 สมองกล AI (Model)', value: `\`${activeModel}\``, inline: true },
                { name: '⚡ ความหน่วง (Ping)', value: `\`${client.ws.ping} ms\``, inline: true },
                { name: '⏱️ เวลาออนไลน์ (Uptime)', value: `\`${uptimeStr}\``, inline: true },
                { name: '🌐 จำนวนเซิร์ฟเวอร์', value: `\`${client.guilds.cache.size}\` เซิร์ฟเวอร์`, inline: true },
                { name: '💾 หน่วยความจำที่ใช้', value: `\`${memUsage} MB\``, inline: true },
                { name: '📦 Node / Discord.js', value: `\`${process.version}\` / \`v${djsVersion}\``, inline: true },
                { name: '🛡️ คูลดาวน์ต่อคำถาม', value: `\`${config.cooldownSeconds} วินาที\``, inline: true },
                { name: '💭 ความจำย้อนหลัง', value: `\`${config.maxHistoryTurns} บทสนทนา\``, inline: true }
            )
            .setFooter({ text: 'บอทตอบคำถามอัจฉริยะ พร้อมให้บริการ 24 ชม.' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

module.exports = [
    chatCommand,
    askCommand,
    faqCommand,
    clearCommand,
    botinfoCommand
];
