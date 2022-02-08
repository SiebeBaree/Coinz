module.exports.execute = async (client, interaction, data) => {
    await interaction.reply({ content: `**Join our Official Support Discord Server:** discord.gg/asnZQwc6kW` });
}

module.exports.help = {
    name: "invite",
    description: "Get a invite to our Official Support Discord Server",
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