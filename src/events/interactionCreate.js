const Event = require('../structures/Event.js');

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(interaction) {
        if (!interaction.guild) return; // Return if dms or group chat
        if (interaction.member.bot) return; // Return if member is bot

        //Checking if the message is a command
        const cmd = this.commands.get(interaction.commandName);

        //If it isn't a command then return
        if (!cmd) return;

        if (cmd.memberRequired === true || cmd.guildRequired === true) await interaction.deferReply();
        const memberData = cmd.memberRequired === true ? await this.database.fetchMember(interaction.member.id) : undefined;
        const guildData = cmd.guildRequired === true ? await this.database.fetchGuild(interaction.guild.id) : undefined;

        if (await cmd.cool(cmd.info.name, interaction.member, cmd.info.cooldown)) {
            return await interaction.editReply({ content: `:x: You have to wait ${this.tools.msToTime(await this.cooldown.getCooldown(interaction.member.id, cmd.info.name) * 1000)} to use this command again.` });
        }

        await cmd.run(interaction, { user: memberData, guild: guildData });
    }
};