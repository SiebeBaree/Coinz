const { MessageEmbed } = require('discord.js');

module.exports.execute = async (client, interaction, data) => {
    await interaction.reply({ content: "This command is still under development. It will be released on <t:1656151200:D>.", ephemeral: true })
}

module.exports.help = {
    name: "crime",
    description: "Commit a crime and get the chance to become rich...",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 43200,
    enabled: true
}