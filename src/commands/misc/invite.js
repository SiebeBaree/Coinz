const Command = require('../../structures/Command.js');

class Invite extends Command {
    info = {
        name: "invite",
        description: "Get a invite to our Official Support Discord Server",
        options: [],
        category: "misc",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await interaction.reply({ content: `:pushpin: **Invite Coinz yourself:** [**Click Here**](https://discord.com/oauth2/authorize?client_id=938771676433362955&permissions=313344&scope=bot%20applications.commands)\n:wave: **Join our Official Support Discord Server:** discord.gg/asnZQwc6kW` });
    }
}

module.exports = Invite;