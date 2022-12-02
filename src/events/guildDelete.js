import Event from '../structures/Event.js'
import Guild from '../models/Guild.js'
import Premium from '../models/Premium.js'

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(guild) {
        if (guild.available) {
            this.logger.event(`REMOVE | Name: ${guild.name} | ID: ${guild.id} | Members: ${guild.memberCount}`);

            const guildData = await Guild.findOne({ id: guild.id });
            if (guildData) {
                await Guild.deleteOne({ id: guild.id });
                await Premium.findOneAndUpdate({ id: guildData.premiumUser }, { $pull: { guilds: guild.id } });
            }
        }
    }
};