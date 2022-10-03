const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType, Colors } = require('discord.js');
const GuildModel = require('../../models/Guild');

class Config extends Command {
    info = {
        name: "config",
        description: "Setup the Coinz bot in this server.",
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: 'Change your user settings for EVERY server. (GLOBAL)',
                options: []
            },
            {
                name: 'server',
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: 'Change the settings of this server. (ADMINISTRATOR)',
                options: []
            }
        ],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.`, ephemeral: true });
    }
}

module.exports = Config;