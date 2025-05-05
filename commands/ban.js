module.exports = {
    name: 'ban',
    description: 'Ban a user from the server',
    async execute(message, args) {
        // Check if the user has Administrator permissions or the Moderator role
        const allowedRole = message.guild.roles.cache.find(role => role.name === 'Moderator');
        if (
            !message.member.permissions.has('Administrator') &&
            !message.member.roles.cache.has(allowedRole?.id)
        ) {
            return message.reply('🚫 You do not have permission to use this command.');
        }

        // Get the mentioned member
        const member = message.mentions.members.first();
        if (!member) return message.reply('Please mention a user to ban!');

        // Prevent banning users with higher roles
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply('🚫 You cannot ban this user because they have a higher or equal role.');
        }

        // Ban the member
        try {
            await member.ban();
            return message.reply(`✅ ${member.user.tag} has been banned.`);
        } catch (error) {
            console.error('Error banning member:', error);
            return message.reply('❌ Failed to ban the user. Please check my permissions and try again.');
        }
    },
};