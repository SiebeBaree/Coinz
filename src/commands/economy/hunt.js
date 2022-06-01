const { MessageEmbed } = require('discord.js');

module.exports.execute = async (client, interaction, data) => {
    await interaction.reply({ content: "This command is still under development. It will be released on <t:1656151200:D>.", ephemeral: true })
}

module.exports.help = {
    name: "hunt",
    description: "Hunt for animals and get money selling their meat.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 7200,
    enabled: true
}