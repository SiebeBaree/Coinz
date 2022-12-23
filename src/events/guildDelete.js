import Event from '../structures/Event.js'
import Guild from '../models/Guild.js'

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(guild) {
        if (guild.available) {
            this.logger.event(`REMOVE | Name: ${guild.name} | ID: ${guild.id} | Members: ${guild.memberCount}`);
            await Guild.findOneAndDelete({ id: guild.id });
        }
    }
};