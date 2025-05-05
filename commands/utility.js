const { ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'announce',
    description: 'Make an announcement in the announcements channel',
    adminOnly: true, // Restrict this command to admins
    async execute(message, args) {
        const announcement = args.join(' ');
        if (!announcement) {
            return message.reply('Please provide a message to announce!');
        }

        // Check if the user has Administrator permissions
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('🚫 You do not have permission to use this command.');
        }

        // Find the announcements channel (ignoring emojis and dots)
        const announcementChannel = message.guild.channels.cache.find(
            (channel) =>
                channel.type === ChannelType.GuildText &&
                channel.name.replace(/[^a-zA-Z0-9]/g, '') === 'announcements'
        );

        if (!announcementChannel) {
            return message.reply('No announcements channel found! Please create a channel named `announcements`.');
        }

        // Create an embed for the announcement
        const embed = new EmbedBuilder()
            .setTitle('📢 Announcement')
            .setDescription(announcement)
            .setColor('Yellow')
            .setTimestamp()
            .setFooter({ text: `From ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

        // Send the announcement with @everyone mention
        try {
            await announcementChannel.send({
                content: '@everyone', // Mention everyone
                embeds: [embed], // Include the embed
            });
            message.reply('✅ Announcement sent successfully!');
        } catch (error) {
            console.error('Error sending announcement:', error);
            message.reply('❌ Failed to send the announcement.');
        }
    },
};