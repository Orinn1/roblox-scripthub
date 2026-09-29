const { 
    Client, 
    GatewayIntentBits, 
    Collection, 
    Partials, 
    ActivityType, 
    EmbedBuilder 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { askGemini, splitDiscordMessage, getFAQList } = require('./ai-service');

// สร้าง Client พร้อมกำหนด Intents ที่จำเป็น
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

// โหลดคำสั่ง Slash Commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

try {
    if (fs.existsSync(commandsPath)) {
        const stat = fs.statSync(commandsPath);
        if (stat.isDirectory()) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(commandsPath, file);
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                    }
                } catch (cmdErr) {
                    console.error(`[Command Load Error] ${file}:`, cmdErr.message);
                }
            }
        } else {
            console.warn('[Warning] พบไฟล์ชื่อ "commands" แต่ไม่ใช่โฟลเดอร์ (กรุณาลบไฟล์นี้บนโฮสต์แล้วสร้างเป็นโฟลเดอร์)');
        }
    }
} catch (fsErr) {
    console.warn('[Command Loader Notice]', fsErr.message);
}

// หากไม่พบคำสั่งจากโฟลเดอร์ commands ให้โหลด Built-in Commands สำรองทันที (บอทไม่ดับ 100%)
if (client.commands.size === 0) {
    try {
        const builtinCommands = require('./builtin-commands');
        for (const cmd of builtinCommands) {
            if (cmd && 'data' in cmd && 'execute' in cmd) {
                client.commands.set(cmd.data.name, cmd);
            }
        }
        console.log(`[Commands] โหลดคำสั่ง Built-in สำรองสำเร็จ (${client.commands.size} คำสั่ง)`);
    } catch (builtinErr) {
        console.error('[Builtin Commands Error]', builtinErr.message);
    }
}

// ระบบป้องกันสแปม (User Cooldowns)
const userCooldowns = new Map();

// Event: เมื่อบอทออนไลน์พร้อมทำงาน
client.once('ready', () => {
    console.log('====================================================');
    console.log(`🤖 บอท AI ออนไลน์แล้วในชื่อ: ${client.user.tag}`);
    const activeModel = config.groqApiKey ? `Groq (${config.groqModel})` : `Gemini (${config.geminiModel})`;
    console.log(`🧠 ใช้โมเดล: ${activeModel}`);
    console.log(`🌐 เซิร์ฟเวอร์ที่เชื่อมต่อ: ${client.guilds.cache.size} เซิร์ฟเวอร์`);
    console.log(`💬 แชทส่วนตัว (DM): ${config.allowDmChat ? 'เปิดใช้งาน (ทักแชทคุยเล่นได้ทันที)' : 'ปิดใช้งาน'}`);
    if (config.qaChannelIds.length > 0) {
        console.log(`💬 ห้อง Q&A ตอบอัตโนมัติ: ${config.qaChannelIds.join(', ')}`);
    }
    if (config.chatChannelIds && config.chatChannelIds.length > 0) {
        console.log(`💬 ห้องคุยเล่นอัตโนมัติ: ${config.chatChannelIds.join(', ')}`);
    }
    console.log(`💬 โหมดทั่วไป: ตอบเมื่อมีคนทักใน DM, แท็ก @${client.user.username}, หรือตอบกลับ (Reply)`);
    console.log('====================================================');

    // ตั้งค่าสถานะบอท (Rich Presence)
    client.user.setPresence({
        activities: [{
            name: 'ทัก DM หรือแท็ก @Mr.beast เพื่อโดนด่า 💵🔥',
            type: ActivityType.Custom
        }],
        status: 'online'
    });
});

// Event: จัดการ Slash Commands และ Select Menus
client.on('interactionCreate', async interaction => {
    try {
        // จัดการ Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            await command.execute(interaction);
            return;
        }

        // จัดการ Select Menu ของ FAQ
        if (interaction.isStringSelectMenu() && interaction.customId === 'faq_select') {
            const selectedId = interaction.values[0];
            const faqs = getFAQList();
            const faqItem = faqs.find(f => f.id === selectedId);

            if (!faqItem) {
                return interaction.reply({ content: '❌ ไม่พบข้อมูลหัวข้อนี้ค่ะ', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.botColor)
                .setTitle(`📌 ${faqItem.question}`)
                .setDescription(faqItem.answer)
                .setFooter({ text: 'มีข้อสงสัยเพิ่มเติม สามารถพิมพ์คุยกับ AI ได้เลยนะคะ!' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } catch (error) {
        console.error('[Interaction Error]', error);
        const replyPayload = { content: '❌ เกิดข้อผิดพลาดในการประมวลผลคำสั่งค่ะ', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyPayload).catch(() => {});
        } else {
            await interaction.reply(replyPayload).catch(() => {});
        }
    }
});

// Event: ตรวจจับข้อความในแชทเพื่อตอบคำถาม / คุยเล่น
client.on('messageCreate', async message => {
    // ไม่ตอบบอทด้วยกันเอง หรือข้อความระบบ
    if (message.author.bot || message.system) return;

    const isDM = !message.guild;
    const isMentioned = message.mentions.has(client.user.id) && 
                        !message.mentions.everyone && 
                        !message.content.includes('@here');

    const isQABoundChannel = config.qaChannelIds.includes(message.channelId);
    const isChatBoundChannel = (config.chatChannelIds || []).includes(message.channelId);

    // ตรวจสอบว่าเป็นการ Reply ข้อความของบอทหรือไม่
    let isReplyToBot = false;
    if (message.reference && message.reference.messageId) {
        try {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            if (referencedMessage && referencedMessage.author.id === client.user.id) {
                isReplyToBot = true;
            }
        } catch (e) {
            // ไม่สามารถดึงข้อความอ้างอิงได้
        }
    }

    // เงื่อนไขในการตอบ:
    // 1. ส่งมาใน DM ส่วนตัว (และเปิด allowDmChat)
    // 2. มีคนแท็ก @บอท ในเซิร์ฟเวอร์
    // 3. เป็นการ Reply ตอบกลับข้อความบอท
    // 4. อยู่ในห้อง Q&A หรือห้อง Chat ที่ระบุไว้ใน config
    const shouldRespond = (isDM && config.allowDmChat) ||
                          isMentioned || 
                          isReplyToBot || 
                          isQABoundChannel || 
                          isChatBoundChannel;

    if (!shouldRespond) {
        return;
    }

    // ดึงเนื้อหาคำถามโดยตัดแท็กบอทออก
    let cleanPrompt = message.content
        .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
        .trim();

    // หากอยู่ในห้องกำหนดเฉพาะ แต่เป็นคำสั่งของบอทอื่นที่มี prefix นำหน้า (เช่น !help, ?play, -skip, .ban) ให้ข้าม
    if ((isQABoundChannel || isChatBoundChannel) && !isMentioned && !isReplyToBot && !isDM) {
        if (/^[!/?\-\+\$\.\>\~]/.test(cleanPrompt)) {
            return;
        }
    }

    const userName = message.author.displayName || message.author.username;

    // หากแท็กมาเฉยๆ ไม่มีข้อความ
    if (!cleanPrompt) {
        if (isDM) {
            return message.reply({
                content: `แท็ก Mr.beast มาทำไมวะคุณ **${userName}**! ทักมาเฉยๆ ไม่มีคำถาม คิดว่าเรียกฟรีเหรอ นาทีละ $10,000 นะเว้ย 55555 มีเรื่องอะไรอยากคุยหรืออยากโดนด่าว่ามา!`
            });
        }
        return message.reply({
            content: `แท็ก Mr.beast มีไรวะคุณ **${userName}**! อยู่ดีๆ ก็แท็กมาคิดว่ากูว่างเหรอ 55555 มีปัญหาเรื่องสคริปต์หรืออยากคุยเล่นก็พิมพ์มา หรือใช้คำสั่ง \`/chat\` / \`/ask\` ก็ได้นะเว้ย!`
        });
    }

    // ตรวจสอบ Cooldown ป้องกันสแปม
    const now = Date.now();
    const cooldownMs = (config.cooldownSeconds || 3) * 1000;
    const userLastTime = userCooldowns.get(message.author.id) || 0;

    if (now - userLastTime < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - (now - userLastTime)) / 1000);
        const warnMsg = await message.reply({
            content: `⏳ เห้ยไอ้น้อง **${userName}**! รอก่อนอีก ${remainingSec} วินาที ถามรัวเป็นปืนกลขนาดนี้คิดว่ากูเป็นตู้เพลงหยอดเหรียญเหรอ 55555`
        });
        setTimeout(() => warnMsg.delete().catch(() => {}), 4000);
        return;
    }
    userCooldowns.set(message.author.id, now);

    // แสดงสถานะ "กำลังพิมพ์..." (Typing indicator)
    try {
        await message.channel.sendTyping();
    } catch (e) {
        // บางห้องอาจไม่มีสิทธิ์ sendTyping
    }

    try {
        // ส่งให้ AI ประมวลผล (แยก Session ต่อผู้ใช้ในห้อง หรือใน DM เพื่อจำบริบทได้แม่นยำ)
        const sessionId = isDM 
            ? `dm_${message.author.id}` 
            : `${message.channelId}_${message.author.id}`;

        const responseText = await askGemini(sessionId, cleanPrompt, userName);

        // จัดการแบ่งข้อความกรณีคำตอบยาวเกิน 2,000 ตัวอักษร
        const chunks = splitDiscordMessage(responseText);

        // ตรวจสอบว่าเปิดโหมดตอบเฉพาะบุคคลหรือไม่ (Private Reply เฉพาะในเซิร์ฟเวอร์)
        if (config.privateReply && !isDM) {
            try {
                // ส่งคำตอบเข้า Direct Message (DM) ของผู้ใช้โดยตรง (คนอื่นในห้องไม่เห็น)
                for (const chunk of chunks) {
                    await message.author.send({ content: chunk });
                }
                const notify = await message.reply({ 
                    content: `📩 ส่งคำตอบไปให้คุณ **${userName}** ในแชทส่วนตัว (DM) แล้วนะเว้ย ไปเปิดดูซะ!` 
                });
                setTimeout(() => notify.delete().catch(() => {}), 5000);
            } catch (dmErr) {
                const warn = await message.reply({
                    content: `⚠️ คุณ **${userName}** ปิด DM ไว้นี่หว่า! ไปเปิด Direct Messages ก่อน ไม่งั้นส่งคำตอบให้ไม่ได้ หรือพิมพ์ถามในห้องนี้แทน!`
                });
                setTimeout(() => warn.delete().catch(() => {}), 8000);
            }
        } else {
            // ส่งข้อความแรกเป็นการ Reply หาข้อความผู้ใช้
            if (chunks.length > 0) {
                await message.reply({ content: chunks[0] });
            }

            // หากมีข้อความส่วนเกิน ให้ส่งตามลงไปในห้อง
            for (let i = 1; i < chunks.length; i++) {
                await message.channel.send({ content: chunks[i] });
            }
        }
    } catch (error) {
        console.error('[Message Processing Error]', error);
        message.reply({ 
            content: `❌ ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผลคำตอบ: ${error.message}` 
        }).catch(() => {});
    }
});

// ดักจับ Error ไม่ให้บอทดับ
process.on('unhandledRejection', error => {
    console.error('[Unhandled Rejection]', error);
});

process.on('uncaughtException', error => {
    console.error('[Uncaught Exception]', error);
});

// เริ่มต้นล็อกอินเข้า Discord
if (!config.token) {
    console.error('❌ ไม่พบ DISCORD_TOKEN ในไฟล์ .env');
    console.error('👉 กรุณาเปิดไฟล์ qa-bot/.env แล้วใส่ Token ของบอทก่อนรันนะคะ');
    process.exit(1);
}

client.login(config.token).catch(err => {
    console.error('❌ เข้าสู่ระบบ Discord ไม่สำเร็จ:', err.message);
    if (err.message.includes('Used disallowed intents')) {
        console.error('💡 วิธีแก้: กรุณาเข้าไปเปิด Privileged Gateway Intents (Message Content Intent) ที่ Discord Developer Portal -> Bot');
    }
});
