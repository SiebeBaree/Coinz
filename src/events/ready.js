module.exports = async (client) => {
    // Put all commands into an object and push it to an array.
    let data = [];
    client.commands.forEach(command => {
        if (command.help.enabled) {
            let commandObject = {
                name: command.help.name,
                description: command.help.description || "No Description Provided.",
                options: command.help.options
            };
            data.push(commandObject);
        }
    })

    // await client.application?.commands.set(data);  // Used to set slash commands globally [Can take several hours to update.]

    // Temp code to update slash commands very quickly
    await client.guilds.cache.get(client.config.rootServerId)?.commands.set(data);

    client.user.setPresence({ activities: [{ name: client.config.presence.name, type: client.config.presence.type }], status: client.config.presence.status });
    client.logger.ready(`Shard ${client.shard.ids[0]} loaded.`);
}