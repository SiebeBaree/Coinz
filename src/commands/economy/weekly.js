module.exports.execute = async (client, interaction, data) => {
    await client.tools.addMoney(interaction.guildId, interaction.member.id, 100);
    await interaction.reply({ content: `You claimed your weekly reward and got :coin: 100.` });
}

module.exports.help = {
    name: "weekly",
    description: "Claim your weekly reward.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 604800,
    enabled: true
}