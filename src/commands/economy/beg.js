const guildUserSchema = require('../../database/schemas/guildUsers');

module.exports.execute = async (client, interaction, data) => {
    const money = client.tools.randomNumber(1, 75);

    if (client.tools.commandPassed(50)) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, { $inc: { wallet: money } });
        await interaction.reply({ content: `You begged for money and got :coin: **${money}**.` });
    } else {
        await interaction.reply({ content: `You begged for money but nobody wanted to give you money.` });
    }
}

module.exports.help = {
    name: "beg",
    description: "If you really want money you can beg for it.",
    options: [],
    usage: "",
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
    ownerOnly: false,
    cooldown: 900,
    enabled: true
}