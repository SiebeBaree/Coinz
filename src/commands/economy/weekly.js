const Command = require('../../structures/Command.js');

class Weekly extends Command {
    info = {
        name: "weekly",
        description: "Claim your weekly reward.",
        options: [],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 604800,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await bot.tools.addMoney(interaction.member.id, 100);
        await interaction.editReply({ content: `You claimed your weekly reward and got :coin: 100.` });
    }
}

module.exports = Weekly;