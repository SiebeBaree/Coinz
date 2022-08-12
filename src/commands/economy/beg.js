const Command = require('../../structures/Command.js');

class Beg extends Command {
    info = {
        name: "beg",
        description: "If you really want money you can beg for it.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 300,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const money = bot.tools.randomNumber(1, 75);

        if (bot.tools.commandPassed(50)) {
            await bot.tools.addMoney(interaction.member.id, money);
            await interaction.editReply({ content: `You begged for money and got :coin: **${money}**.` });
        } else {
            await interaction.editReply({ content: `You begged for money but nobody wanted to give you money.` });
        }
    }
}

module.exports = Beg;