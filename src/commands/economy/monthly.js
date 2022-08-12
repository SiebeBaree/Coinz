const Command = require('../../structures/Command.js');

class Monthly extends Command {
    info = {
        name: "monthly",
        description: "Claim your monthly reward.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 2592000,
        enabled: true,
        memberRequired: true,
        deferReply: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await bot.tools.addMoney(interaction.member.id, 300);
        await interaction.editReply({ content: `You claimed your monthly reward and got :coin: 300.` });
    }
}

module.exports = Monthly;