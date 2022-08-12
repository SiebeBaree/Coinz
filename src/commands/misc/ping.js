const Command = require('../../structures/Command.js');

class Ping extends Command {
    info = {
        name: "ping",
        description: "Get the time between the bot and discord in milliseconds.",
        options: [],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: false,
        deferReply: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const dateNow = Date.now();
        await interaction.editReply({ content: `:ping_pong: **Ping:** ${bot.ws.ping} ms\n:speech_balloon: **Responds Time:** ${dateNow - interaction.createdTimestamp} ms\n:white_check_mark: **Uptime:** ${bot.tools.msToTime(bot.uptime)}` });
    }
}

module.exports = Ping;