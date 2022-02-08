module.exports = async (client, interaction) => {
    try {
        if (interaction.member.bot) return; // Return if member is bot
        if (!interaction.guild) return; // Return if dms or group chat

        //Checking if the message is a command
        const cmd = client.commands.get(interaction.commandName);

        //If it isn't a command then return
        if (!cmd) return;

        //If command is owner only and author isn't owner return
        if (cmd.help.ownerOnly && interaction.member.id !== config.ownerId) return;

        let userPerms = [];
        //Checking for members permission
        cmd.help.memberPermissions.forEach((perm) => {
            if (!interaction.channel.permissionsFor(interaction.member).has(perm)) {
                userPerms.push(perm);
            }
        });
        //If user permissions arraylist length is more than one return error
        if (userPerms.length > 0) return interaction.reply("Looks like you're missing the following permissions: " + userPerms.map((p) => `\`${p}\``).join(", "));

        let clientPerms = [];
        //Checking for client permissions
        cmd.help.botPermissions.forEach((perm) => {
            if (!interaction.channel.permissionsFor(interaction.guild.me).has(perm)) {
                clientPerms.push(perm);
            }
        });
        //If client permissions arraylist length is more than one return error
        if (clientPerms.length > 0) return interaction.reply("Looks like I'm missing the following permissions: " + clientPerms.map((p) => `\`${p}\``).join(", "));

        if (await client.cooldown.isOnCooldown(client, interaction.guildId, interaction.member.id, cmd.help.name)) return interaction.reply(`:x: You have to wait ${client.calc.msToTime(await client.cooldown.getCooldown(client, interaction.guildId, interaction.member.id, cmd.help.name) * 1000)} to use this command again.`);
        await client.cooldown.setCooldown(interaction.guildId, interaction.member.id, cmd.help.name, cmd.help.cooldown);

        //Get the user database
        // let userData = await client.database.fetchUser(interaction.member.id, interaction.guildId);
        // let guildData = await client.database.fetchGuild(interaction.guildId);
        let data = {};
        data.user = 0 //userData;
        data.guild = 0 //guildData;
        data.cmd = cmd;

        //Execute the command
        cmd.execute(client, interaction, data);
    } catch (err) {
        console.error(err);
    }
}