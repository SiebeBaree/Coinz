const Command = require('../../structures/Command.js');
const { ApplicationCommandOptionType } = require('discord.js');

class Pay extends Command {
    info = {
        name: "pay",
        description: "Give your mone to another user.",
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'The user you want to give money to.',
                required: true
            },
            {
                name: 'amount',
                type: ApplicationCommandOptionType.Integer,
                description: 'The amount you want to give.',
                required: true,
                min_value: 1,
                max_value: 5000
            }
        ],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 1800,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const member = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        if (member.bot) return await interaction.editReply({ content: 'That user is a bot. You can only check the balance of a real person.' });
        if (member.id === interaction.member.id) return await interaction.editReply({ content: 'You can\'t pay yourself.' });

        // To create a document
        await bot.database.fetchMember(member.id);

        if (data.user.wallet < amount) {
            return await interaction.editReply({ content: `You don't have :coin: ${amount} in your wallet.` });
        } else {
            await bot.tools.addMoney(member.id, amount);
            await bot.tools.takeMoney(interaction.member.id, amount, true);
            return await interaction.editReply({ content: `You sent :coin: ${amount} to ${member.username}!` });
        }
    }
}

module.exports = Pay;