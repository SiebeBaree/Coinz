import Event from "../structures/Event.js"
import { EmbedBuilder } from 'discord.js'
import Stats from "../models/Stats.js"
import { msToTime } from "../lib/helpers.js"

const embed = new EmbedBuilder()
    .setColor(bot.config.embed.color)
    .setDescription("This command is only for **premium users**.\nIf you want to use this command, consider buying **Coinz Premium**.\nGo to the [**store**](https://coinzbot.xyz/store) to learn more.")
    .setTimestamp()
    .setFooter({ text: bot.config.embed.footer })

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(interaction) {
        if (!interaction.guild) return; // Return if dms or group chat
        if (interaction.member.bot) return; // Return if member is bot

        const cmd = this.commands.get(interaction.commandName);
        if (!cmd) return;

        const premium = await this.database.fetchPremium(interaction.member.id, false);
        if (cmd.info.isPremium === true && !premium.premium) {
            embed.setAuthor({ name: "Coinz Premium Required", iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` });
            return await interaction.reply({ embeds: [embed] });
        }

        const cooldown = cmd.info.cooldown;
        if (process.env.NODE_ENV === "production" && await cmd.cool(cmd.info.name, interaction.member, cooldown === 0 && premium.premium ? 1 : cooldown)) {
            return await interaction.reply({ content: `:x: You have to wait ${msToTime(await this.cooldown.getCooldown(interaction.member.id, cmd.info.name) * 1000)} to use this command again.`, ephemeral: true });
        }

        if (cmd.info.deferReply === true) await interaction.deferReply();
        const memberData = cmd.info.memberRequired === true ? await this.database.fetchMember(interaction.member.id) : undefined;
        await cmd.run(interaction, { user: memberData, premium: premium });

        await Stats.updateOne(
            { id: interaction.member.id },
            { $inc: { commandsExecuted: 1 } },
            { upsert: true }
        );
    }
}