const Event = require('../structures/Event.js');
const GuildModel = require('../models/Guild');

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(guild) {
        if (guild.available) {
            this.logger.event(`REMOVE | Name: ${guild.name} | ID: ${guild.id} | Members: ${guild.memberCount}`);
            await GuildModel.deleteOne({ id: guild.id });
        }
    }
};