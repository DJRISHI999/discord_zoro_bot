module.exports = {
    name: 'clear',
    description: 'Clear a specified number of messages or all messages from the channel',
    async execute(message, args) {
        const allowedRole = message.guild.roles.cache.find(role => role.name === 'Moderator');
        if (
            !message.member.permissions.has('Administrator') &&
            !message.member.roles.cache.has(allowedRole?.id)
        ) {
            return message.reply('🚫 You do not have permission to use this command.');
        }

        const amount = args[0]?.toLowerCase() === 'all' ? 'all' : parseInt(args[0]);
        if (amount !== 'all' && (!amount || isNaN(amount) || amount < 1 || amount > 100)) {
            return message.reply('Please provide a number between 1 and 100, or use `all` to delete all messages.');
        }

        try {
            if (amount === 'all') {
                // Delete all messages in the channel
                let fetched;
                do {
                    fetched = await message.channel.messages.fetch({ limit: 100 });
                    await message.channel.bulkDelete(fetched, true);
                } while (fetched.size >= 2); // Continue until no more messages are left
                return message.channel.send('✅ Successfully deleted all messages in this channel.').then(msg => {
                    setTimeout(() => msg.delete(), 5000); // Auto-delete confirmation after 5 seconds
                });
            } else {
                // Delete a specific number of messages
                await message.channel.bulkDelete(amount, true);
                return message.channel.send(`✅ Successfully deleted ${amount} messages.`).then(msg => {
                    setTimeout(() => msg.delete(), 5000); // Auto-delete confirmation after 5 seconds
                });
            }
        } catch (error) {
            console.error('Error clearing messages:', error);
            return message.reply('❌ Failed to delete messages. Please check my permissions and try again.');
        }
    },
};