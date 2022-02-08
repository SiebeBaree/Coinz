const { MessageEmbed } = require('discord.js');

function createBanEmbed(description) {
    const embed = new MessageEmbed()
        .setAuthor({ name: `Sorry, you can't use the bot.`, iconURL: `${interaction.member.displayAvatarURL() || client.config.embed.defaultIcon}` })
        .setColor("RED")
        .setFooter({ text: client.config.embed.footer })
        .setThumbnail(`https://www.freeiconspng.com/thumbs/stop-sign-png/stop-sign-png-26.png`)
        .setDescription(description)
    return embed;
}

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

        // Get data on GuildUser, User and Guild
        let guildUserData = await client.database.fetchGuildUser(interaction.member.id);
        let userData = await client.database.fetchUser(interaction.guildId, interaction.member.id);
        let guildData = await client.database.fetchGuild(interaction.guildId);

        // Checking if the user is banned.
        if (guildUserData.banned === true) {
            return interaction.reply({ embeds: [createBanEmbed(`Sorry but this server banned you from using any commands from this bot.\n\n**What you can do to lift this ban:**\nAsk a server admin to unban you with the command: /unban <@${interaction.member.id}>\n\n*Coinz is not responsible for your ban as this ban is only in this server.*`)], ephemeral: true })
        } else if (userData.banned === true) {
            return interaction.reply({ embeds: [createBanEmbed(`Sorry but you are banned from Coinz.\n\n**What you can do to lift this ban:**\nIf you think this ban was incorrect, please join our [support server](https://discord.gg/asnZQwc6kW) and create a ticket.`)], ephemeral: true })
        } else if (guildData.banned === true) {
            return interaction.reply({ embeds: [createBanEmbed(`Sorry but this server is banned from using Coinz.\n\n**What you can do to lift this ban:**\nIf you are the server owner or a server administrator please join our [support server](https://discord.gg/asnZQwc6kW) and create a ticket.`)], ephemeral: true })
        }

        let userPerms = [];
        //Checking for members permission
        cmd.help.memberPermissions.forEach((perm) => {
            if (!interaction.channel.permissionsFor(interaction.member).has(perm)) {
                userPerms.push(perm);
            }
        });
        //If user permissions arraylist length is more than one return error
        if (userPerms.length > 0) return interaction.reply({ content: "Looks like you're missing the following permissions: " + userPerms.map((p) => `\`${p}\``).join(", "), ephemeral: true });

        let clientPerms = [];
        //Checking for client permissions
        cmd.help.botPermissions.forEach((perm) => {
            if (!interaction.channel.permissionsFor(interaction.guild.me).has(perm)) {
                clientPerms.push(perm);
            }
        });
        //If client permissions arraylist length is more than one return error
        if (clientPerms.length > 0) return interaction.reply({ content: "Looks like I am missing the following permissions: " + clientPerms.map((p) => `\`${p}\``).join(", "), ephemeral: true });

        if (await client.cooldown.isOnCooldown(client, interaction.guildId, interaction.member.id, cmd.help.name)) return interaction.reply({ content: `:x: You have to wait ${client.calc.msToTime(await client.cooldown.getCooldown(client, interaction.guildId, interaction.member.id, cmd.help.name) * 1000)} to use this command again.`, ephemeral: true });
        await client.cooldown.setCooldown(interaction.guildId, interaction.member.id, cmd.help.name, cmd.help.cooldown);

        let data = {};
        data.guildUser = guildUserData;
        data.user = userData;
        data.guild = guildData;
        data.cmd = cmd;

        //Execute the command
        cmd.execute(client, interaction, data);
    } catch (err) {
        console.error(err);
    }
}