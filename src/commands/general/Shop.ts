import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Item from "../../interfaces/Item";
import Embed from "../../utils/Embed";
import User from "../../utils/User";

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
                        max_value: 100,
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
                        max_value: 100,
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

    async getInfo(interaction: ChatInputCommandInteraction) {
        const itemId = interaction.options.getString("item-id", false)?.toLowerCase();

        if (itemId) {
            const item = this.client.items.getById(itemId) || this.client.items.getByName(itemId);

            if (!item) {
                await interaction.reply({ content: `That item with id \`${itemId}\` does not exist. Use </shop info:983096143284174861> for a list of all items.`, ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(item.name)
                .setDescription(">>> " + (item.longDescription ?? item.description))
                .setColor(<ColorResolvable>this.client.config.embed.color)
                .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoteId}.png`)
                .addFields(
                    { name: "Price", value: `**BUY:** ${item.buyPrice ? `:coin: ${item.buyPrice}` : "**Not For Sale**"}\n**SELL:** ${item.sellPrice ? `:coin: ${item.sellPrice}` : "Not sellable"}`, inline: true },
                    { name: "Item Info", value: `**Category:** \`${item.category}\`\n**Item ID:** \`${item.itemId}\``, inline: true },
                );
            await interaction.reply({ embeds: [embed] });
        } else {
            let page = 0;
            const ItemsPerPage = 7;

            const options = this.client.items.getCategories();
            let defaultLabel = options[0].value;
            let items = this.client.items.getAllByCategory(defaultLabel);
            let maxPage = Math.ceil(items.length / ItemsPerPage);

            const getEmbed = (catItems: Item[]): EmbedBuilder => {
                const itemsOnPage = catItems.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
                const desc = itemsOnPage.map((item) =>
                    `<:${item.itemId}:${item.emoteId}> **${item.name}** (\`${item.itemId}\`) ― ${item.buyPrice ? `:coin: ${item.buyPrice}` : "**Not for sale**"}\n> ${item.description}`)
                    .join("\n\n");

                return new EmbedBuilder()
                    .setTitle("Coinz Shop")
                    .setDescription(itemsOnPage.length > 0 ? desc : "No items were found.")
                    .setFooter({ text: `Use /shop info [item-id] to view more info about an item. ─ Page ${page + 1}/${maxPage}` })
                    .setColor(<ColorResolvable>this.client.config.embed.color);
            };

            const message = await interaction.reply({ embeds: [getEmbed(items)], components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(options, "shop_selectMenu", defaultLabel)], fetchReply: true });
            const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 20, idle: 20_000, time: 90_000 });

            collector.on("collect", async (i) => {
                if (i.componentType === ComponentType.Button) {
                    page = Embed.calculatePageNumber(i.customId, page, maxPage);
                } else if (i.componentType === ComponentType.StringSelect) {
                    defaultLabel = i.values[0];
                    page = 0;
                    items = this.client.items.getAllByCategory(defaultLabel);
                    maxPage = Math.ceil(items.length / ItemsPerPage);
                }

                await i.update({ embeds: [getEmbed(items)], components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(options, "shop_selectMenu", defaultLabel)] });
            });

            collector.on("end", async () => {
                await interaction.editReply({ components: [...Embed.getPageButtons(page, maxPage, true), ...Embed.getSelectMenu(options, "shop_selectMenu", defaultLabel, true)] });
            });
        }
    }

    async getBuy(interaction: ChatInputCommandInteraction, member: IMember) {
        const itemId = interaction.options.getString("item-id", true).toLowerCase();
        const amount = interaction.options.getInteger("amount", false) ?? 1;

        const item = this.client.items.getById(itemId) || this.client.items.getByName(itemId);

        if (!item) {
            await interaction.reply({ content: `That item with id \`${itemId}\` does not exist. Use </shop info:983096143284174861> for a list of all items.`, ephemeral: true });
            return;
        }

        if (!item.buyPrice) {
            await interaction.reply({ content: `You can't buy ${this.getItemString(item)}!`, ephemeral: true });
            return;
        }

        const price = Math.ceil(item.buyPrice * amount);

        if (member.wallet < price) {
            await interaction.reply({ content: `You don't have enough money in your wallet to buy ${this.getItemString(item, amount)}!`, ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        await this.client.items.addItem(item.itemId, member, amount);
        await User.removeMoney(member.id, price, true);

        await interaction.editReply({ content: `You bought ${this.getItemString(item, amount)} for :coin: ${price}!` });
    }

    async getSell(interaction: ChatInputCommandInteraction, member: IMember) {
        const itemId = interaction.options.getString("item-id", true).toLowerCase();
        const amount = interaction.options.getInteger("amount", false) ?? 1;

        const item = this.client.items.getById(itemId) || this.client.items.getByName(itemId);

        if (!item) {
            await interaction.reply({ content: `That item with id \`${itemId}\` does not exist. Use </shop info:983096143284174861> for a list of all items.`, ephemeral: true });
            return;
        }

        if (!item.sellPrice) {
            await interaction.reply({ content: `You can't sell ${this.getItemString(item)}!`, ephemeral: true });
            return;
        }

        const invItem = this.client.items.getInventoryItem(item.itemId, member);
        if (invItem === undefined || invItem.amount < amount) {
            await interaction.reply({ content: `You don't have ${this.getItemString(item, amount)} in your inventory!`, ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        const price = Math.floor(item.sellPrice * amount);
        await this.client.items.removeItem(item.itemId, member, amount);
        await User.addMoney(member.id, price);

        await interaction.editReply({ content: `You sold ${this.getItemString(item, amount)} for :coin: ${price}!` });
    }

    getItemString(item: Item, amount?: number): string {
        return `${amount ? `${amount}x ` : ""}<:${item.itemId}:${item.emoteId}> **${item.name}**`;
    }
}