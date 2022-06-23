module.exports.execute = async (client, interaction, data) => {
    await client.tools.addMoney(interaction.guildId, interaction.member.id, 300);
    await interaction.reply({ content: `You claimed your monthly reward and got :coin: 300.` });
}

module.exports.help = {
    name: "monthly",
    description: "Claim your monthly reward.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 2592000,
    enabled: true
}