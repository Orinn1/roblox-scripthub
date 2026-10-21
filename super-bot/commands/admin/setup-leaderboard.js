/**
 * 🏆 Slash Command: /setup_leaderboard
 * ติดตั้งกระดานผู้นำ (Live Leaderboard) แบบอัปเดตอัตโนมัติทุก 1 ชม.
 */
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ChannelType 
} = require('discord.js');

const { saveLeaderboardPanel } = require('../../database/db');
const { generateLeaderboardData } = require('../../modules/leaderboard-updater');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup_leaderboard')
        .setDescription('ติดตั้งกระดานผู้นำ (Leaderboard) แบบอัปเดตอัตโนมัติในห้องที่เลือก')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('ห้องแชทที่ต้องการส่งกระดานผู้นำไปติดตั้ง (ถ้าไม่เลือกจะส่งห้องปัจจุบัน)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        const guildId = interaction.guild.id;

        const data = generateLeaderboardData(guildId, interaction.guild.name);

        // ส่งข้อความกระดานผู้นำไปยังห้องเป้าหมาย
        const sentMessage = await targetChannel.send(data);

        // บันทึกลง SQLite เพื่อให้บอทคอย Edit ข้อความนี้อัตโนมัติทุกๆ 1 ชั่วโมง
        saveLeaderboardPanel(guildId, targetChannel.id, sentMessage.id);

        await interaction.reply({
            content: `จัดไปเตง! ตั้งบอร์ดทำเนียบตัวตึงไว้ที่ห้อง ${targetChannel} เรียบร้อยแล้ว ✨\nเดี๋ยวบอทคอยอัปเดตสถิติให้ทุกๆ 1 ชั่วโมงเอง ไม่ต้องห่วงน้า`,
            ephemeral: true
        });
    }
};
