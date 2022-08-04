const Event = require('../structures/Event.js');

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(interaction) {
        let { guild, member } = interaction;

        if (!guild) return; // Return if dms or group chat
        if (member.bot) return; // Return if member is bot

        //Checking if the message is a command
        const cmd = this.commands.get(interaction.commandName);

        //If it isn't a command then return
        if (!cmd) return;

        const userData = await this.database.fetchMember(member.id);
        const guildData = await this.database.fetchGuild(guild.id);

        // Checking if the user or guild is banned.
        if (userData.banned === true || guildData.banned === true) return;

        if (await cmd.cool(cmd.info.name, member, cmd.info.cooldown)) {
            return await interaction.reply({ content: `:x: You have to wait ${this.tools.msToTime(await this.cooldown.getCooldown(member.id, cmd.info.name) * 1000)} to use this command again.`, ephemeral: true });
        }

        await cmd.run(interaction, { user: userData, guild: guildData });
    }
};