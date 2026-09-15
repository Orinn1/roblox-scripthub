const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getScripts } = require('../scripts-helper.js');
const botConfig = require('../config.js');
let db = null;
try { db = require('../../db.js'); } catch (e) {}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('script')
        .setDescription('🔍 ค้นหาและดูสคริปต์ Roblox จากคลัง BlacklistScriptx')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('ชื่อเกม หรือชื่อสคริปต์ที่ต้องการค้นหา')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase().trim();
        const scripts = await getScripts();

        const filtered = scripts.filter(s => {
            const title = (s.title || '').toLowerCase();
            const game = (s.game || '').toLowerCase();
            const id = (s.id || '').toLowerCase();
            return !focusedValue || title.includes(focusedValue) || game.includes(focusedValue) || id.includes(focusedValue);
        }).slice(0, 25);

        await interaction.respond(
            filtered.map(s => ({
                name: `${s.game ? `[${s.game}] ` : ''}${s.title}`.slice(0, 100),
                value: s.id
            }))
        );
    },

    async execute(interaction) {
        const query = interaction.options.getString('query').trim();
        const scripts = await getScripts();

        // Find by exact ID or fuzzy search
        let script = scripts.find(s => s.id === query);
        if (!script) {
            const lowerQuery = query.toLowerCase();
            script = scripts.find(s => 
                (s.title && s.title.toLowerCase().includes(lowerQuery)) ||
                (s.game && s.game.toLowerCase().includes(lowerQuery))
            );
        }

        if (!script) {
            return interaction.reply({
                content: `❌ ไม่พบสคริปต์ที่ตรงกับคำค้นหา: **"${query}"**\nลองใช้คำสั่ง \`/latest\` เพื่อดูสคริปต์ล่าสุด หรือค้นหาด้วยชื่อเกมสั้นๆ เช่น Blox Fruits, Rivals`,
                ephemeral: true
            });
        }

        // Increment view count in database
        try {
            db.incrementView(script.id);
        } catch (e) {}

        const platforms = [];
        if (script.isPC) platforms.push('💻 PC');
        if (script.isMobile) platforms.push('📱 Mobile');
        const platformText = platforms.length ? platforms.join(' | ') : 'ทุกแพลตฟอร์ม';

        const keyText = script.isKeyless ? '🟢 Keyless (ไม่ต้องใช้คีย์)' : '🟠 มีระบบคีย์';
        const statusText = script.status === 'working' ? '✅ ใช้งานได้ปกติ (Working)' : '⚠️ ต้องตรวจสอบ (Testing/Updated)';

        const embed = new EmbedBuilder()
            .setColor(botConfig.themeColor)
            .setTitle(script.title)
            .setDescription(script.description || 'สคริปต์ Roblox คุณภาพสูงจาก BlacklistScriptx')
            .addFields(
                { name: '🎮 เกม', value: script.game || 'ทั่วไป', inline: true },
                { name: '🔑 ระบบคีย์', value: keyText, inline: true },
                { name: '📱 รองรับ', value: platformText, inline: true },
                { name: '⚙️ สถานะ', value: statusText, inline: true },
                { name: '🏷️ แท็ก', value: script.badge || 'ยอดนิยม', inline: true },
                { name: '👁️ ยอดเข้าชม', value: `${(script.views || 0) + 1} ครั้ง`, inline: true }
            )
            .setFooter({ text: '⚡ BlacklistScriptx Hub • ปลอดภัย อัปเดตไว ใช้งานฟรี' })
            .setTimestamp();

        if (script.thumbnail && script.thumbnail.startsWith('http')) {
            embed.setImage(script.thumbnail);
        }

        // Loadstring code display
        const loadstringDisplay = script.loadstring && script.loadstring.length > 500
            ? script.loadstring.slice(0, 480) + '...\n-- (กดปุ่มด้านล่างเพื่อรับโค้ดเต็ม)'
            : (script.loadstring || '-- ไม่พบโค้ด');

        embed.addFields({
            name: '📜 Loadstring (โค้ดรันสคริปต์)',
            value: `\`\`\`lua\n${loadstringDisplay}\n\`\`\``
        });

        // Interactive Buttons
        const row = new ActionRowBuilder();

        // Button 1: Web Link
        if (botConfig.websiteUrl) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('🌐 เปิดดูบนเว็บไซต์')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${botConfig.websiteUrl}#script-${script.id}`)
            );
        }

        // Button 2: Copy Code helper (ephemeral reply with pure code)
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`get_code_${script.id}`)
                .setLabel('📋 ก๊อปปี้โค้ด (Copy Loadstring)')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⚡')
        );

        return interaction.reply({ embeds: [embed], components: [row] });
    }
};
