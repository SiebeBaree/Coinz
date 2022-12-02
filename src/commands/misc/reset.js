import Command from '../../structures/Command.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors } from 'discord.js';
import MemberModel from "../../models/Member.js"
import BusinessModel from "../../models/Business.js"
import StatsModel from "../../models/Stats.js"
import { createMessageComponentCollector } from '../../lib/embed.js'

export default class extends Command {
    info = {
        name: "reset",
        description: "Reset your account on EVERY server.",
        options: [],
        category: "misc",
        extraFields: [],
        cooldown: 300,
        enabled: true,
        memberRequired: false,
        deferReply: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const confirmEmbed = new EmbedBuilder()
            .setAuthor({ name: `Reset your account?`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(Colors.Red)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription(`Are you sure you want to reset your account? This will also reset your company if you have one.\nThis won't reset your cooldowns!`)

        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("reset_yes")
                .setLabel("Yes")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("reset_no")
                .setLabel("No")
                .setStyle(ButtonStyle.Secondary)
        );

        const interactionMessage = await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow], fetchReply: true });
        const collector = createMessageComponentCollector(interactionMessage, interaction, { max: 1, time: 15_000 })

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            let embed = new EmbedBuilder()
                .setAuthor({ name: `Reset your account`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
                .setColor(Colors.Green)
                .setFooter({ text: bot.config.embed.footer })
                .setDescription(`You canceled the reset.`)

            if (interactionCollector.customId === 'reset_yes') {
                embed.setColor(Colors.Red);
                embed.setDescription(`You successfully reset your account.`);
                await MemberModel.deleteOne({ id: interaction.member.id });
                await BusinessModel.deleteOne({ ownerId: interaction.member.id });
                await StatsModel.deleteOne({ id: interaction.member.id });
            }

            await interaction.editReply({ embeds: [embed] });
        });

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [] });
        });
    }
}