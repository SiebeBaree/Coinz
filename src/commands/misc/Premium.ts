import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Database from "../../utils/Database";
import Premium from "../../models/Premium";
import Guild from "../../models/Guild";

export default class extends Command implements ICommand {
    readonly info = {
        name: "premium",
        description: "Buy a premium subscription and (de)activate server features.",
        options: [
            {
                name: "info",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get information about premium subscriptions.",
                options: [],
            },
            {
                name: "activate",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Activate premium features on this server.",
                options: [],
            },
            {
                name: "deactivate",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Deactivate premium features on this server.",
                options: [],
            },
        ],
        category: "misc",
    };

    private readonly ticketEmote = "<:ticket:1032669959161122976>";
    private readonly tiers = {
        supporter: {
            name: "Supporter",
            price: 200,
            tierNumber: 1,
            isUser: true,
        },
        benefactor: {
            name: "Benefactor",
            price: 500,
            tierNumber: 2,
            isUser: true,
        },
        community: {
            name: "Community",
            price: 300,
            tierNumber: 1,
            isUser: false,
        },
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        switch (interaction.options.getSubcommand()) {
            case "info":
                return await this.infoCommand(interaction, member);
            case "activate":
                return await this.activateCommand(interaction);
            case "deactivate":
                return await this.deactivateCommand(interaction);
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    private async infoCommand(interaction: ChatInputCommandInteraction, member: IMember) {
        const embed = new EmbedBuilder()
            .setColor(this.client.config.embed.color as ColorResolvable)
            .setTitle("Premium subscriptions")
            .setDescription("You can buy a subscription using our [official store](https://coinzbot.xyz/store/)");

        if (member.premium.active) {
            const tier = Object.values(this.tiers).find(t => t.tierNumber === member.premium.tier);

            if (tier) {
                embed.addFields({
                    name: "Your subscription",
                    value: `:star: **Subscribed to:** ${tier.name}\n:hourglass_flowing_sand: **Expires on:** <t:${member.premium.expires}:f>.`,
                    inline: false,
                });
            }
        }

        for (const tier of Object.values(this.tiers)) {
            embed.addFields({
                name: tier.name,
                value: `${this.ticketEmote} **Price per month:** $${tier.price / 100}\n:star: **Perks:** [official store](https://coinzbot.xyz/store/)`,
                inline: false,
            });
        }

        await interaction.reply({ embeds: [embed] });
    }

    private async activateCommand(interaction: ChatInputCommandInteraction) {
        if (interaction.guildId === null) {
            await interaction.reply({ content: "You can only activate premium features on a server.", ephemeral: true });
            return;
        }

        const premium = await Database.getPremium(interaction.user.id);
        if (!premium || premium.guildTier === 0) {
            await interaction.reply({ content: "You don't have a premium server subscription.", ephemeral: true });
            return;
        }

        if (premium.guildsActivated.length >= premium.guildTier) {
            await interaction.reply({ content: "You have already activated all your premium guilds.", ephemeral: true });
            return;
        }

        if (premium.guildsActivated.includes(interaction.guildId)) {
            await interaction.reply({ content: "You have already activated this guild.", ephemeral: true });
            return;
        }

        await interaction.reply({ content: "Premium features have been activated on this server.", ephemeral: true });
        await Premium.updateOne({ id: interaction.user.id }, { $push: { guildsActivated: interaction.guildId } });
        await Guild.updateOne({ id: interaction.guildId }, { $set: { "premium.active": true, "premium.userId": interaction.user.id } });
    }

    private async deactivateCommand(interaction: ChatInputCommandInteraction) {
        if (interaction.guildId === null) {
            await interaction.reply({ content: "This is not a server, so you can't deactivate premium features.", ephemeral: true });
            return;
        }

        const premium = await Database.getPremium(interaction.user.id);
        if (!premium || premium.guildTier === 0) {
            await interaction.reply({ content: "You don't have a premium server subscription.", ephemeral: true });
            return;
        }

        if (!premium.guildsActivated.includes(interaction.guildId)) {
            await interaction.reply({ content: "You have not activated this server.", ephemeral: true });
            return;
        }

        await interaction.reply({ content: "Premium features have been deactivated on this server.", ephemeral: true });
        await Premium.updateOne({ id: interaction.user.id }, { $pull: { guildsActivated: interaction.guildId } });
        await Guild.updateOne({ id: interaction.guildId }, { $set: { "premium.active": false, "premium.userId": "" } });
    }
}