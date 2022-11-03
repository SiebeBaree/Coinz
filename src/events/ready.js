const Event = require('../structures/Event.js');
const GuildModel = require('../models/Guild');

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run() {
        // Remove old guilds in database
        const allGuildsArr = await GuildModel.find({});
        for (let i = 0; i < allGuildsArr.length; i++) {
            if (!this.guilds.cache.has(allGuildsArr[i].id)) await GuildModel.deleteOne({ id: allGuildsArr[i].id });
        }

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

        // await this.application?.commands.set(data);  // Used to set slash commands globally [Can take several hours to update.]
        await this.guilds.cache.get(this.config.rootServerId)?.commands.set(data);
        this.logger.ready(`Shard ${this.shard.ids[0]} loaded.`);
    }
};