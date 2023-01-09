import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, Colors, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Database from "../../utils/Database";
import Helpers from "../../utils/Helpers";
import Investment, { IInvestment } from "../../models/Investment";
import Embed from "../../utils/Embed";

export default class extends Command implements ICommand {
    private readonly maxOwnedStock = 5_000_000;
    private readonly maxPurchase = 100_000;
    private readonly itemsPerPage = 5;

    private readonly options = [
        { label: "Stocks", value: "Stock" },
        { label: "Crypto", value: "Crypto" },
    ];

    readonly info = {
        name: "invest",
        description: "Buy, sell or get info about an investment.",
        options: [
            {
                name: "info",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get info about an investment.",
                options: [
                    {
                        name: "ticker",
                        type: ApplicationCommandOptionType.String,
                        description: "The ticker of the investment you want to get info about.",
                        required: false,
                    },
                ],
            },
            {
                name: "buy",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Invest your money.",
                options: [
                    {
                        name: "ticker",
                        type: ApplicationCommandOptionType.String,
                        description: "The ticker of the investment you want to buy.",
                        required: true,
                    },
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Integer,
                        description: "How much you want to buy. Use 0 to buy fractional.",
                        required: false,
                        min_value: 0,
                        max_value: 5000,
                    },
                    {
                        name: "price",
                        type: ApplicationCommandOptionType.Integer,
                        description: "How much money you want to spend on the investment.",
                        required: false,
                        min_value: 50,
                        max_value: 50000,
                    },
                ],
            },
            {
                name: "sell",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Sell an investment.",
                options: [
                    {
                        name: "ticker",
                        type: ApplicationCommandOptionType.String,
                        description: "The ticker of the investment you want to sell.",
                        required: true,
                    },
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Number,
                        description: "How much you want to sell.",
                        required: true,
                        min_value: 0,
                        max_value: this.maxOwnedStock,
                    },
                ],
            },
        ],
        category: "investing",
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
        const ticker = interaction.options.getString("ticker", false);

        if (ticker) {
            const stock = await Database.getInvestment(ticker.toUpperCase());
            if (!stock) {
                await interaction.reply({ content: "That investment doesn't exist. Please check a list of all investmenst using </invest info:1005435550884442194>", ephemeral: true });
                return;
            }

            const { icon, changePercentage } = this.calculateChange(parseFloat(stock.price.toString()), parseFloat(stock.previousClose.toString()));
            const embed = new EmbedBuilder()
                .setTitle(`${stock.type} - ${stock.fullName}`)
                .setColor(<ColorResolvable>this.client.config.embed.color)
                .setThumbnail(`https://cdn.coinzbot.xyz/ticket/${stock.ticker.toUpperCase()}.png`)
                .addFields(
                    { name: "Info", value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}\n:clock1: **Last Updated:** <t:${stock.lastUpdated}:R>`, inline: true },
                    { name: "Statistics", value: `:moneybag: **Price:** :coin: ${stock.price}\n${icon} **Change:** ${changePercentage}%`, inline: true },
                );
            await interaction.reply({ embeds: [embed] });
        } else {
            let category = "Stock";
            let stocks = await this.getInvestments(category);
            let maxPage = Math.ceil(stocks.length / this.itemsPerPage);
            let page = 0;

            const message = await interaction.reply({ embeds: [this.getEmbed(stocks, page, maxPage)], components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(this.options, "investing_selectMenu", category)], fetchReply: true });
            const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 20, idle: 15000, time: 90_000 });

            collector.on("collect", async (i) => {
                await i.deferUpdate();

                if (i.componentType === ComponentType.Button) {
                    page = Embed.calculatePageNumber(i.customId, page, maxPage);
                } else if (i.componentType === ComponentType.StringSelect) {
                    category = i.values[0];
                    stocks = await this.getInvestments(category);
                    maxPage = Math.ceil(stocks.length / this.itemsPerPage);
                    page = 0;
                }

                await interaction.editReply({ embeds: [this.getEmbed(stocks, page, maxPage)], components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(this.options, "investing_selectMenu", category)] });
            });

            collector.on("end", async () => {
                await interaction.editReply({ components: [...Embed.getPageButtons(page, maxPage, true), ...Embed.getSelectMenu(this.options, "investing_selectMenu", category, true)] });
            });
        }
    }

    private async getBuy(interaction: ChatInputCommandInteraction, member: IMember) {
        const ticker = interaction.options.getString("ticker", true);
        let amount = interaction.options.getInteger("amount", false);
        let price = interaction.options.getInteger("price", false);

        if (amount && price) {
            await interaction.reply({ content: "You can't use both amount and price.", ephemeral: true });
            return;
        } else if (!amount && !price) {
            await interaction.reply({ content: "You need to use either amount or price.", ephemeral: true });
            return;
        }

        const stock = await Database.getInvestment(ticker.toUpperCase());
        if (!stock) {
            await interaction.reply({ content: "That investment doesn't exist. Please check a list of all investmenst using </invest info:1005435550884442194>", ephemeral: true });
            return;
        }

        if (amount !== null) {
            price = Math.round(parseFloat(stock.price.toString()) * amount);
        } else {
            if (!price) price = 10;
            amount = Helpers.roundNumber(price / parseFloat(stock.price.toString()), 3);
        }

        if (price < 10) return await interaction.reply({ content: "You have to buy at least :coin: 10 at once.", ephemeral: true });
        if (amount > this.maxOwnedStock) return await interaction.reply({ content: `You can't buy more than ${this.maxOwnedStock} items at once.`, ephemeral: true });
        if (price > this.maxPurchase) return await interaction.reply({ content: `You can't buy more than :coin: ${this.maxPurchase} at once.`, ephemeral: true });
        if (price > member.wallet) {
            const embed = new EmbedBuilder()
                .setTitle("Not enough money")
                .setColor(Colors.Red)
                .setDescription("Trying to scam me? You don't have enough money in your wallet.")
                .addFields(
                    { name: "Total Price", value: `:coin: ${price}`, inline: true },
                    { name: "Money In Wallet", value: `:coin: ${member.wallet}`, inline: true },
                    { name: "Money Needed", value: `:coin: ${(price - member.wallet) || 1}`, inline: true },
                );
            await interaction.reply({ embeds: [embed] });
            return;
        }
        await interaction.deferReply();

        const ownedStock = member.stocks.find((s) => s.ticker === stock.ticker);
        if (ownedStock) {
            await Member.updateOne({ id: interaction.user.id, "stocks.ticker": stock.ticker }, {
                $inc: { "stocks.$.quantity": amount, "stocks.$.buyPrice": price, wallet: -price },
            });
        } else {
            await Member.updateOne({ id: interaction.user.id }, {
                $push: { stocks: { ticker: stock.ticker, quantity: amount, buyPrice: price } },
                $inc: { wallet: -price },
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`You just bought ${amount}x ${stock.fullName}`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${stock.ticker.toUpperCase()}.png`)
            .addFields(
                { name: "Info", value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}`, inline: true },
                { name: "Stats", value: `:moneybag: **Unit Price:** :coin: ${stock.price}\n:1234: **Amount:** ${amount}x\n:gem: **Buy Price:** :coin: ${price}`, inline: true },
            );
        await interaction.editReply({ embeds: [embed] });
    }

    private async getSell(interaction: ChatInputCommandInteraction, member: IMember) {
        const ticker = interaction.options.getString("ticker", true);
        const amount = interaction.options.getNumber("amount", true);

        const stock = await Database.getInvestment(ticker.toUpperCase());
        if (!stock) {
            await interaction.reply({ content: "That investment doesn't exist. Please check a list of all investmenst using </invest info:1005435550884442194>", ephemeral: true });
            return;
        }

        const ownedStock = member.stocks.find((s) => s.ticker === stock.ticker);
        if (!ownedStock) {
            await interaction.reply({ content: "You don't own this investment.", ephemeral: true });
            return;
        } else if (parseFloat(ownedStock.amount.toString()) < amount) {
            await interaction.reply({ content: `You only have ${ownedStock.amount.toString()}x of ${stock.fullName}.`, ephemeral: true });
            return;
        }

        await interaction.deferReply();
        const sellPrice = Math.round(parseFloat(stock.price.toString()) * amount);

        if (parseFloat(ownedStock.amount.toString()) <= amount) {
            await Member.updateOne({ id: interaction.user.id }, {
                $pull: { stocks: { ticker: stock.ticker } },
                $inc: { wallet: sellPrice },
            });
        } else {
            await Member.updateOne({ id: interaction.user.id, "stocks.ticker": stock.ticker }, {
                $inc: {
                    "stocks.$.quantity": -amount,
                    "stocks.$.buyPrice": -Math.floor(amount / parseFloat(ownedStock.amount.toString()) * parseFloat(ownedStock.buyPrice.toString())),
                    wallet: sellPrice,
                },
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`You sold ${amount}x ${stock.fullName}`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${stock.ticker.toUpperCase()}.png`)
            .addFields(
                { name: "Info", value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}`, inline: true },
                { name: "Stats", value: `:moneybag: **Unit Price:** :coin: ${stock.price}\n:1234: **Amount:** ${amount}x\n:gem: **Sell Price:** :coin: ${sellPrice}`, inline: true },
            );
        await interaction.editReply({ embeds: [embed] });
    }

    private calculateChange(buyPrice: number, currentPrice: number): { icon: string; changePercentage: number } {
        let changePercentage = Helpers.roundNumber(((currentPrice - buyPrice) / buyPrice * 100), 2);
        if (isNaN(changePercentage)) changePercentage = 0;
        return { icon: changePercentage < 0 ? ":chart_with_downwards_trend:" : ":chart_with_upwards_trend:", changePercentage: changePercentage };
    }

    private async getInvestments(category: string) {
        return await Investment.find({ type: category });
    }

    private getEmbed(investments: IInvestment[], page: number, maxPage: number): EmbedBuilder {
        const itemsOnPage = investments.slice(page * this.itemsPerPage, (page + 1) * this.itemsPerPage);
        const desc = itemsOnPage.map((investment: IInvestment) => {
            const change = this.calculateChange(parseFloat(investment.price.toString()), parseFloat(investment.previousClose.toString()));
            return `• **${investment.fullName}** (${investment.ticker})\n> :coin: ${investment.price} (${change.icon} ${change.changePercentage}%)`;
        }).join("\n\n");

        return new EmbedBuilder()
            .setAuthor({ name: "All Investments" })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`**More Info:** </${this.info.name} info:1005435550884442194>\n**Example:** \`/${this.info.name} info AAPL\`\n\n${desc}\nLast Updated: <t:${investments[0].lastUpdated}:R>`)
            .setFooter({ text: `Page ${page + 1} of ${maxPage}.` });
    }
}