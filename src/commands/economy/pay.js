import Command from '../../structures/Command.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { addMoney, takeMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "pay",
        description: "Give your money to another user.",
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
        cooldown: 1800,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const member = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        if (member.bot || member.id === interaction.member.id) {
            await bot.cooldown.removeCooldown(interaction.user.id, this.info.name);
            return await interaction.reply({ content: ':x: You cannot pay bots or yourself.', ephemeral: true });
        }

        await interaction.deferReply();

        // To create a document
        await bot.database.fetchMember(member.id);

        if (data.user.wallet < amount) {
            await bot.cooldown.removeCooldown(interaction.user.id, this.info.name);
            return await interaction.editReply({ content: `:x: You don't have :coin: ${amount} in your wallet.` });
        } else {
            await addMoney(member.id, amount);
            await takeMoney(interaction.member.id, amount, true);
            return await interaction.editReply({ content: `You sent :coin: ${amount} to ${member.username}!` });
        }
    }
}