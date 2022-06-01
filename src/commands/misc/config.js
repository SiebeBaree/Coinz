const { MessageEmbed } = require('discord.js');

module.exports.execute = async (client, interaction, data) => {
    await interaction.reply({ content: "This command is still under development. It will be released on <t:1656151200:D>.", ephemeral: true })
}

module.exports.help = {
    name: "config",
    description: "Change the settings of this bot.",
    options: [],
    category: "misc",
    extraFields: [],
    memberPermissions: ["ADMINISTRATOR"],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}