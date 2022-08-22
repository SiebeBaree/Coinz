const Event = require('../structures/Event.js');
const { connect } = require('mongoose');
require('dotenv').config();

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run() {
        await connect(process.env.DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'coinz_beta',
            keepAlive: true,
            keepAliveInitialDelay: 300000
        });

        this.logger.ready('Connected to MongoDB');

        // Make sure all guilds are stored in the database
        this.guilds.cache.forEach(guild => { this.database.fetchGuild(guild.id); });

        // Put all commands into an object and push it to an array.
        let data = [];
        this.commands.forEach(command => {
            if (command.info.enabled) {
                data.push(
                    {
                        name: command.info.name,
                        description: command.info.description || "No Description Provided.",
                        options: command.info.options,
                        dm_permission: false
                    }
                );
            }
        });

        await this.application?.commands.set(data);  // Used to set slash commands globally [Can take several hours to update.]
        this.logger.ready(`Shard ${this.shard.ids[0]} loaded.`);
    }
};