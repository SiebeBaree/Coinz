import Event from '../structures/Event.js';

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(guild) {
        if (guild.available) {
            this.logger.event(`INVITE | Name: ${guild.name} | ID: ${guild.id} | Members: ${guild.memberCount}`);
            await this.database.fetchGuild(guild.id);
        }
    }
};