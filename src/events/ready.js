import Event from "../structures/Event.js"
import Guild from "../models/Guild.js"

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run() {
        // Remove old guilds in database
        const allGuildsArr = await Guild.find({});
        for (let i = 0; i < allGuildsArr.length; i++) {
            if (!this.guilds.cache.has(allGuildsArr[i].id)) await Guild.deleteOne({ id: allGuildsArr[i].id });
        }

        // Make sure all guilds are stored in the database
        this.guilds.cache.forEach(guild => { this.database.fetchGuild(guild.id); });
        this.logger.ready(`Shard ${this.shard.ids[0]} loaded.`);
    }
}