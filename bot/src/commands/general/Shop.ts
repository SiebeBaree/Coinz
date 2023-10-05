import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    ColorResolvable,
    ComponentType,
    EmbedBuilder,
} from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import { IMember } from "../../models/Member";
import Item from "../../domain/Item";
import Embed from "../../lib/Embed";
import User from "../../lib/User";

export default class extends Command implements ICommand {
    readonly info = {
        name: "shop",
        description: "Buy, sell or view items in the shop",
        options: [
            {
                name: "info",
                type: ApplicationCommandOptionType.Subcommand,
                description: "View information about an item or get a list of all items",
                options: [
                    {
                        name: "item-id",
                        type: ApplicationCommandOptionType.String,
                        description: "The ID of the item you want to view",
                        required: false,
                    },
                ],
            },
            {
                name: "buy",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Buy an item from the shop",
                options: [
                    {
                        name: "item-id",
                        type: ApplicationCommandOptionType.String,
                        description: "The ID of the item you want to buy",
                        required: true,
                    },
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Integer,
                        description: "The amount of the item you want to buy",
                        required: false,
                        min_value: 1,
                        max_value: 1000,
                    },
                ],
            },
            {
                name: "sell",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Sell an item from your inventory",
                options: [
                    {
                        name: "item-id",
                        type: ApplicationCommandOptionType.String,
                        description: "The ID of the item you want to sell",
                        required: true,
                    },
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Integer,
                        description: "The amount of the item you want to sell",
                        required: false,
                        min_value: 1,
                        max_value: 1000,
                    },
                ],
            },
        ],
        category: "general",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        switch (interaction.options.getSubcommand()) {
            case "info":
                await this.getInfo(interaction);
                break;
            case "buy":
                await this.getBuy(interaction, member);
                break;
            case "sell":
                await this.getSell(interaction, member);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    private async getInfo(interaction: ChatInputCommandInteraction) {
        const itemId = interaction.options.getString("item-id")?.toLowerCase();

        if (itemId) {
            const item = this.client.items.getById(itemId) ?? this.client.items.getByName(itemId);

            if (!item) {
                await interaction.reply({
                    content: `Item \`${itemId.toLowerCase()}\` doesn't exist. Use \`/shop info\` for a list of all items.`,
                    ephemeral: true,
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(item.name)
                .setDescription(">>> " + (item.longDescription ?? item.description))
                .setColor(<ColorResolvable>this.client.config.embed.color)
                .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoteId}.png`)
                .addFields(
                    {
                        name: "Price",
                        value: `**BUY:** ${item.buyPrice ? `:coin: ${item.buyPrice}` : "**Not For Sale**"}\n**SELL:** ${item.sellPrice ? `:coin: ${item.sellPrice}` : "Not sellable"}`,
                        inline: true,
                    },
                    {
                        name: "Item Info",
                        value: `**Category:** \`${item.category}\`\n**Item ID:** \`${item.itemId}\``,
                        inline: true,
                    },
                );
            await interaction.reply({ embeds: [embed] });
        } else {
            let page = 0;
            const ItemsPerPage = 7;

            const options = this.client.items.getCategories();
            let defaultLabel = options[0].value;
            let items = this.client.items.getAllByCategory(defaultLabel);
            let maxPages = Math.ceil(items.length / ItemsPerPage);

            const getEmbed = (categoryItems: Item[]) => {
                const itemsOnPage = categoryItems.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
                const description = itemsOnPage.map((item) => `<:${item.itemId}:${item.emoteId}> **${item.name}** (\`${item.itemId}\`) ― ${item.buyPrice ? `:coin: ${item.buyPrice}` : "**Not for sale**"}\n> ${item.description}`).join("\n\n");

                return new EmbedBuilder()
                    .setTitle(`Shop`)
                    .setDescription(itemsOnPage.length === 0 ? "No items found." : description)
                    .setColor(<ColorResolvable>this.client.config.embed.color)
                    .setFooter({ text: `Use /shop info [item-id] to get more info ─ Page ${page + 1}/${maxPages}` });
            };

            const message = await interaction.reply({
                embeds: [getEmbed(items)],
                components: [...Embed.getPageButtons(page, maxPages), ...Embed.getSelectMenu(options, "shop_selectCategory", defaultLabel)],
                fetchReply: true,
            });

            const collector = message.createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id,
                max: 20,
                idle: 20_000,
                time: 90_000,
            });

            collector.on("collect", async (i) => {
                if (i.componentType === ComponentType.Button) {
                    page = Embed.calculatePageNumber(i.customId, page, maxPages);
                } else if (i.componentType === ComponentType.StringSelect && i.customId === "shop_selectCategory") {
                    defaultLabel = i.values[0];
                    items = this.client.items.getAllByCategory(defaultLabel);
                    page = 0;
                    maxPages = Math.ceil(items.length / ItemsPerPage);
                }

                await i.update({
                    embeds: [getEmbed(items)],
                    components: [...Embed.getPageButtons(page, maxPages), ...Embed.getSelectMenu(options, "shop_selectCategory", defaultLabel)],
                });
            });

            collector.on("end", async () => {
                await interaction.editReply({ components: [...Embed.getPageButtons(page, maxPages, true), ...Embed.getSelectMenu(options, "shop_selectCategory", defaultLabel, true)] });
            });
        }
    }

    private async getBuy(interaction: ChatInputCommandInteraction, member: IMember) {
        const itemId = interaction.options.getString("item-id", true)?.toLowerCase();
        const amount = interaction.options.getInteger("amount") ?? 1;

        const item = this.client.items.getById(itemId) ?? this.client.items.getByName(itemId);

        if (!item) {
            await interaction.reply({
                content: `Item \`${itemId.toLowerCase()}\` doesn't exist. Use \`/shop info\` for a list of all items.`,
                ephemeral: true,
            });
            return;
        } else if (!item.buyPrice) {
            await interaction.reply({
                content: `Item ${this.client.items.getItemString(item)} is not for sale.`,
                ephemeral: true,
            });
            return;
        }

        const totalPrice = Math.ceil(item.buyPrice * amount);

        if (member.wallet < totalPrice) {
            await interaction.reply({
                content: `You don't have enough money in your wallet to buy ${this.client.items.getItemString(item, amount)}.`,
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({ content: `You bought ${this.client.items.getItemString(item, amount)} for :coin: ${totalPrice}.` });
        await User.removeMoney(member.id, totalPrice);
        await this.client.items.addItem(item.itemId, member, amount);
    }

    private async getSell(interaction: ChatInputCommandInteraction, member: IMember) {
        const itemId = interaction.options.getString("item-id", true)?.toLowerCase();
        const amount = interaction.options.getInteger("amount") ?? 1;

        const item = this.client.items.getById(itemId) ?? this.client.items.getByName(itemId);

        if (!item) {
            await interaction.reply({
                content: `Item \`${itemId.toLowerCase()}\` doesn't exist. Use \`/shop info\` for a list of all items.`,
                ephemeral: true,
            });
            return;
        } else if (!item.sellPrice) {
            await interaction.reply({
                content: `Item ${this.client.items.getItemString(item)} is not sellable.`,
                ephemeral: true,
            });
            return;
        }

        const totalPrice = Math.ceil(item.sellPrice * amount);
        const inventoryItem = this.client.items.getInventoryItem(item.itemId, member);

        if (!inventoryItem || inventoryItem.amount < amount) {
            await interaction.reply({
                content: `You don't have ${this.client.items.getItemString(item, amount)} in your inventory.`,
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({ content: `You sold ${this.client.items.getItemString(item, amount)} for :coin: ${totalPrice}.` });
        await this.client.items.removeItem(item.itemId, member, amount);
        await User.addMoney(member.id, totalPrice);
    }
}