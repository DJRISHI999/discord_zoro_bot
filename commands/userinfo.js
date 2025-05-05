module.exports = {
    name: 'userinfo',
    description: 'Display information about a user',
    execute(message) {
        const user = message.mentions.users.first() || message.author;
        const embed = {
            color: 0x0099ff,
            title: `${user.username}'s Info`,
            fields: [
                { name: 'Username', value: `${user.username}`, inline: true },
                { name: 'ID', value: `${user.id}`, inline: true },
                { name: 'Created At', value: `${user.createdAt.toDateString()}`, inline: true },
            ],
            thumbnail: { url: user.displayAvatarURL({ dynamic: true }) },
            timestamp: new Date(),
        };

        message.channel.send({ embeds: [embed] });
    },
};