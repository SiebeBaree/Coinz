const { MessageEmbed } = require('discord.js');
var { dependencies } = require('../../../package.json');

module.exports.execute = async (client, interaction, data) => {
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const newEmbed = new MessageEmbed()
        .setAuthor({ name: `Bot Statistics`, iconURL: `${client.user.avatarURL() || client.config.embed.defaultIcon}` })
        .setColor(client.config.embed.color)
        .setFooter({ text: client.config.embed.footer })
        .setTimestamp()
        .setThumbnail(`${client.user.avatarURL() || client.config.embed.defaultIcon}`)
        .addFields(
            { name: 'Library', value: `discord.js${dependencies["discord.js"]}`, inline: true },
            { name: 'Uptime', value: `${client.calc.msToTime(client.uptime)}`, inline: true },
            { name: 'Memory Usage', value: `${Math.round(usedMemory * 100) / 100} MB`, inline: true }
        )
    await interaction.reply({ embeds: [newEmbed] });
}

module.exports.help = {
    name: "statistics",
    description: "Get some statistics about Coinz.",
    options: [],
    usage: "",
    category: "misc",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}