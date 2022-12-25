import Event from "../structures/Event.js"
import Guild from "../models/Guild.js"

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run() {
        // Make sure all guilds are stored in the database
        this.cluster.broadcastEval(c => {
            c.guilds.cache.forEach(guild => { this.database.fetchGuild(guild.id); })
        });

        this.logger.ready(`Cluster ${this.cluster.id} loaded.`);
    }
}