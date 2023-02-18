import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Item from "../../interfaces/Item";

export default class extends Command implements ICommand {
    readonly info = {
        name: "shop-item",
        description: "Update the price of a shop item",
        options: [
            {
                name: "item-id",
                description: "The id of the item to update",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "new-buy-price",
                description: "The new buy price of the item",
                type: ApplicationCommandOptionType.Integer,
                required: false,
                min_value: 0,
            },
            {
                name: "new-sell-price",
                description: "The new sell price of the item",
                type: ApplicationCommandOptionType.Integer,
                required: false,
                min_value: 0,
            },
        ],
        category: "admin",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.guildId !== this.client.config.adminServerId) return;

        const itemId = interaction.options.getString("item-id", true).toLowerCase();
        const newBuyPrice = interaction.options.getInteger("new-buy-price", false);
        const newSellPrice = interaction.options.getInteger("new-sell-price", false);

        if (newBuyPrice === null && newSellPrice === null) {
            await interaction.reply({ content: "You need to specify a new buy price or sell price", ephemeral: true });
            return;
        }

        const oldItem = this.client.items.getById(itemId);
        if (!oldItem) {
            await interaction.reply({ content: "That item doesn't exist.", ephemeral: true });
            return;
        }

        await interaction.reply({ content: "Updated item price, please also change it in `./src/assets/items.json` for the next bot restart", ephemeral: true });

        const item = {
            ...oldItem,
            buyPrice: newBuyPrice ?? oldItem.buyPrice,
            sellPrice: newSellPrice ?? oldItem.sellPrice,
        } as Item;
        this.client.items.all.set(itemId, item);

        const channel = await this.client.channels.fetch(this.client.config.shopChannelId);
        if (!channel || !channel.isTextBased()) return;
        await channel.send({ embeds: [this.getEmbed(item, oldItem)] });
    }

    private getEmbed(item: Item, oldItem: Item): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle(`<:${item.itemId}:${item.emoteId}> **${item.name}**`)
            .setColor(<ColorResolvable>this.client.config.embed.darkColor)
            .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoteId}.png`);

        if (oldItem.buyPrice !== item.buyPrice) {
            embed.addFields({ name: "Buy Price", value: `:coin: ~~${oldItem.buyPrice}~~ ${item.buyPrice}`, inline: true });
        }

        if (oldItem.sellPrice !== item.sellPrice) {
            embed.addFields({ name: "Sell Price", value: `:coin: ~~${oldItem.sellPrice}~~ ${item.sellPrice}`, inline: true });
        }

        return embed;
    }
}