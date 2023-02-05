import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Database from "../../utils/Database";
import Premium from "../../models/Premium";
import Guild from "../../models/Guild";
import Cooldown from "../../utils/Cooldown";
import Helpers from "../../utils/Helpers";

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
                name: "buy",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Buy or extend a premium subscription.",
                options: [
                    {
                        name: "tier",
                        type: ApplicationCommandOptionType.String,
                        description: "The subscription tier you want to buy.",
                        required: true,
                        choices: [
                            {
                                name: "Supporter",
                                value: "supporter",
                            },
                            {
                                name: "Benefactor",
                                value: "benefactor",
                            },
                        ],
                    },
                ],
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
            case "buy":
                return await this.buyCommand(interaction, member);
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
            .setDescription(`You can buy a subscription using our [official store](https://coinzbot.xyz/store/) or using </${this.info.name} buy:0>` +
                "\n\nYou can buy a new subscription, extend your current subscription or upgrade/downgrade your subscription." +
                "\nIf you bought a subscription using our store, you can cancel it [**here**](https://billing.stripe.com/p/login/28o14Tb34gqB8EM7ss).");

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
                value: `${this.ticketEmote} **Price per month:** $${tier.price / 100} OR ${this.ticketEmote} ${tier.price}\n:star: **Perks:** [official store](https://coinzbot.xyz/store/)`,
                inline: false,
            });
        }

        await interaction.reply({ embeds: [embed] });
    }

    private async buyCommand(interaction: ChatInputCommandInteraction, member: IMember) {
        const tierName = interaction.options.getString("tier", true).toLowerCase() as keyof typeof this.tiers;
        const tier = this.tiers[tierName];

        if (!tier.isUser) {
            await interaction.reply({ content: "You can only buy a server subscription using our [official store](https://coinzbot.xyz/store/).", ephemeral: true });
            return;
        }

        if (tier.price > member.tickets) {
            await interaction.reply({ content: "You don't have enough tickets to buy this subscription.", ephemeral: true });
            return;
        }

        if (member.premium.active && member.premium.tier !== tier.tierNumber && member.premium.expires > Math.floor(Date.now() / 1000)) {
            const price = this.calculatePrice(tierName, member.premium.tier, member.premium.expires);

            if (price > member.tickets) {
                await interaction.reply({ content: "You don't have enough tickets to alter your subscription.", ephemeral: true });
                return;
            }

            const cooldown = await Cooldown.getRemainingCooldown(interaction.user.id, "premium.change-subscription");
            if (cooldown > 0) {
                await interaction.reply({ content: `:x: You have to wait ${Helpers.msToTime(cooldown * 1000)} to change your subscription again.`, ephemeral: true });
                return;
            }
            await Cooldown.setCooldown(interaction.user.id, "premium.change-subscription", 86400 * 30);

            if (price <= 0) {
                await interaction.reply({ content: `Changed your subscription to ${tier.name} and you got back ${Math.abs(price)}x ${this.ticketEmote} **tickets**.` });
            } else {
                await interaction.reply({ content: `Changed your subscription to ${tier.name} for ${price}x ${this.ticketEmote} **tickets**.` });
            }

            await Member.updateOne({ id: interaction.user.id },
                {
                    $inc: { tickets: price },
                    $set: { "premium.tier": tier.tierNumber },
                },
            );
            return;
        }

        await interaction.deferReply();
        const embed = new EmbedBuilder()
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: this.client.config.embed.footer });

        if (member.premium.active) {
            const expires = this.addDays(30, member.premium.expires);

            await Premium.updateOne({ id: interaction.user.id }, { $set: { userExpires: expires } });
            await Member.updateOne({ id: interaction.user.id },
                {
                    $inc: { tickets: -tier.price },
                    $set: { "premium.expires": expires },
                },
            );

            embed.setTitle(`Extended ${tier.name} tier`);
            embed.setDescription(`${this.ticketEmote} **Bought:** ${tier.name} for ${tier.price}x ${this.ticketEmote} **tickets**.\n:hourglass_flowing_sand: **Expires on:** <t:${expires}:f>`);
        } else {
            const expires = this.addDays(30);

            await Premium.updateOne(
                { id: interaction.user.id },
                { $set: { userTier: tier.tierNumber, userExpires: expires } },
                { upsert: true },
            );

            await Member.updateOne({ id: interaction.user.id },
                {
                    $inc: { tickets: -tier.price },
                    $set: { "premium.active": true, "premium.tier": tier.tierNumber, "premium.expires": expires },
                },
            );

            embed.setTitle(`Subscribed to ${tier.name} tier`);
            embed.setDescription(`${this.ticketEmote} **Bought:** ${tier.name} for ${tier.price}x ${this.ticketEmote} **tickets**.\n:hourglass_flowing_sand: **Expires on:** <t:${expires}:f>`);
        }

        await interaction.editReply({ embeds: [embed] });
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

    private addDays(days: number, startDate?: number): number {
        const date = startDate ? new Date(startDate * 1000) : new Date();
        date.setDate(date.getDate() + days);
        return Math.floor(date.getTime() / 1000);
    }

    private calculatePrice(newTier: keyof typeof this.tiers, oldTierNumber: number, expires: number): number {
        const oldTier = Object.values(this.tiers).find((t) => t.tierNumber === oldTierNumber && t.isUser);
        if (!oldTier) return this.tiers[newTier].price;

        const daysLeft = Math.round((expires - Math.floor(Date.now() / 1000)) / (60 * 60 * 24));
        const price = Math.floor((daysLeft / 30) * (this.tiers[newTier].price - oldTier.price));
        return price;
    }
}