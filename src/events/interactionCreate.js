const Event = require('../structures/Event.js');
const StatsModel = require('../models/Stats');

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

        const ban = await this.database.fetchBan(interaction.guild.id, interaction.member.id);
        if (ban.guild.isBanned) {
            return await interaction.reply({ content: `This server is banned from using Coinz.\n**Reason:** ${ban.guild.reason}\n\nIf you are the owner of the server, please join our [**support server**](https://discord.gg/asnZQwc6kW) if you think this ban was a mistake.`, ephemeral: true });
        } else if (ban.user.isBanned) {
            return await interaction.reply({ content: `You are banned from using Coinz.\n**Reason:** ${ban.user.reason}\n\nPlease join our [**support server**](https://discord.gg/asnZQwc6kW) if you think this ban was a mistake.`, ephemeral: true });
        }

        if (await cmd.cool(cmd.info.name, interaction.member, cmd.info.cooldown)) {
            return await interaction.reply({ content: `:x: You have to wait ${this.tools.msToTime(await this.cooldown.getCooldown(interaction.member.id, cmd.info.name) * 1000)} to use this command again.`, ephemeral: true });
        }

        if (cmd.info.deferReply === true) await interaction.deferReply();
        const memberData = cmd.info.memberRequired === true ? await this.database.fetchMember(interaction.member.id) : undefined;
        await cmd.run(interaction, { user: memberData });

        await StatsModel.updateOne(
            { id: interaction.member.id },
            { $inc: { commandsExecuted: 1 } },
            { upsert: true }
        );
    }
};