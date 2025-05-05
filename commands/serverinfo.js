module.exports = {
    name: 'serverinfo',
    description: 'Display information about the server',
    execute(message) {
        const { guild } = message;
        const embed = {
            color: 0x0099ff,
            title: `${guild.name} Server Info`,
            fields: [
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Created At', value: `${guild.createdAt.toDateString()}`, inline: true },
            ],
            timestamp: new Date(),
        };

        message.channel.send({ embeds: [embed] });
    },
};