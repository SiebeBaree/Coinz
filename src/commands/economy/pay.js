module.exports.execute = async (client, interaction, data) => {
    const member = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    if (member.bot) return await interaction.reply({ content: 'That user is a bot. You can only check the balance of a real person.', ephemeral: true });
    if (member.id === interaction.member.id) return await interaction.reply({ content: 'You can\'t pay yourself.', ephemeral: true });

    const memberData = await client.database.fetchGuildUser(interaction.guildId, member.id);

    if (data.guildUser.wallet < amount) {
        return await interaction.reply({ content: `You don't have :coin: ${amount} in your wallet.`, ephemeral: true });
    } else {
        await client.tools.addMoney(interaction.guildId, member.id, amount);
        await client.tools.removeMoney(interaction.guildId, interaction.member.id, amount, true);
        return await interaction.reply({ content: `You sent :coin: ${amount} to ${member.username}!` });
    }
}

module.exports.help = {
    name: "pay",
    description: "Give your mone to another user.",
    options: [
        {
            name: 'user',
            type: 'USER',
            description: 'The user you want to give money to.',
            required: true
        },
        {
            name: 'amount',
            type: 'INTEGER',
            description: 'The amount you want to give.',
            required: true,
            min_value: 1,
            max_value: 100000
        }
    ],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 10,
    enabled: true
}