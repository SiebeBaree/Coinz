import Command from '../../structures/Command.js'
import { commandPassed, randomNumber } from '../../lib/helpers.js'
import { addMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "beg",
        description: "If you really want money you can beg for it.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 900,
        enabled: true,
        memberRequired: true,
        deferReply: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const money = randomNumber(20, 60);

        if (commandPassed(70)) {
            await addMoney(interaction.member.id, money);
            await interaction.editReply({ content: `You begged for money and got :coin: **${money}**.` });
        } else {
            await interaction.editReply({ content: `You begged for money but nobody wanted to give you money.` });
        }
    }
}