const cooldownsSchema = require("../database/schemas/cooldowns");

module.exports = async (client) => {
    // removing all expired command cooldowns to clean database
    client.logger.log(`Cleaning up cooldowns collection...`);
    const deleted = await cooldownsSchema.deleteMany({ expiresOn: { $lte: parseInt(Date.now() / 1000) } });
    client.logger.log(`Cleaned up ${deleted.deletedCount} documents.`);

    // Put all commands into an object and push it to an array.
    let data = [];
    client.commands.forEach(commands => {
        let commandObject = {
            name: commands.help.name,
            description: commands.help.description || "No Description Provided.",
            options: commands.help.options
        };
        data.push(commandObject);
    })

    // await client.application?.commands.set(data);  // Used to set slash commands globally [Can take several hours to update.]

    // Temp code to update slash commands very quickly
    await client.guilds.cache.get(client.config.rootServerId)?.commands.set(data);

    client.user.setPresence({ activities: [{ name: client.config.presence.name, type: client.config.presence.type }], status: client.config.presence.status });
    client.logger.ready(`Shard ${client.shard.ids[0]} loaded.`)
}