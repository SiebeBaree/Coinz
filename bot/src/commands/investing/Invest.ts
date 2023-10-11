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
import Member, { IMember } from "../../models/Member";
import { IInvestment } from "../../models/Investment";
import Embed from "../../lib/Embed";
import Utils from "../../lib/Utils";
import UserStats from "../../models/UserStats";

export default class extends Command implements ICommand {
    private readonly MAX_OWNED_STOCK = 20_000_000;
    private readonly MIN_PRICE = 50;
    private readonly ITEMS_PER_PAGE = 7;

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
                        max_value: this.MAX_OWNED_STOCK,
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
                await this.getInfo(interaction, member);
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

    private async getInfo(interaction: ChatInputCommandInteraction, member: IMember) {
        const ticker = interaction.options.getString("ticker", false);

        if (ticker) {
            const investment = await this.client.investment.getInvestment(ticker.toUpperCase());

            if (investment) {
                const ownedInvestment = member.investments.find(el => el.ticker === investment.ticker);
                const iconURL = `https://cdn.coinzbot.xyz/ticker/${investment.ticker}.png`;
                const icon = parseFloat(investment.changed) >= 0 ? ":chart_with_upwards_trend:" : ":chart_with_downwards_trend:";
                const embed = new EmbedBuilder()
                    .setTitle(`Investment - ${investment.fullName}`)
                    .setDescription(`Visit the new [**investments page**](${this.client.config.website}/investments) for an overview of all investments.\nBuy this investment: \`/invest buy ticker:${investment.ticker} amount:1\``)
                    .addFields(
                        {
                            name: "Information",
                            value: `:envelope: **Type:** ${investment.type}\n:tickets: **Ticker:** ${investment.ticker}\n:apple: **Full Name:** ${investment.fullName}`,
                            inline: true,
                        },
                        {
                            name: "Statistics",
                            value: `:moneybag: **Price:** :coin: ${investment.price}\n${icon} **Change:** ${investment.changed}%\n:clock1: **Last Updated:** <t:${Math.floor(investment.updatedAt.getTime() / 1000)}:R>`,
                            inline: true,
                        },
                    )
                    .setThumbnail(iconURL)
                    .setColor(<ColorResolvable>this.client.config.embed.color);

                if (ownedInvestment) {
                    const worth = Math.round(parseFloat(ownedInvestment.amount.toString()) * parseFloat(investment.price));
                    const invested = parseInt(ownedInvestment.buyPrice.toString());
                    const profit = Math.round((((parseFloat(ownedInvestment.amount.toString()) * parseFloat(investment.price)) - invested) / invested) * 100);

                    embed.addFields({
                        name: `Your investment in ${investment.fullName}`,
                        value: `:dollar: **Worth:** :coin: ${worth}\n:credit_card: **Amount:** ${ownedInvestment.amount}x\n:moneybag: **Invested:** :coin: ${invested}\n${profit >= 0 ? ":chart_with_upwards_trend:" : ":chart_with_downwards_trend:"} **Profit:** :coin: ${worth - invested} (${profit}%)`,
                        inline: false,
                    });
                }

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({
                    content: `The investment with ticker \`${ticker.toUpperCase()}\` does not exist.`,
                    ephemeral: true,
                });
            }
        } else {
            let type = this.options[0].value;
            let stocks = await this.client.investment.getInvestmentsByType(type);
            let maxPage = Math.ceil(stocks.length / this.ITEMS_PER_PAGE);
            let page = 0;

            const message = await interaction.reply({
                embeds: [this.getEmbed(stocks, type, page, maxPage)],
                components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(this.options, "investing_selectMenu", type)],
                fetchReply: true,
            });
            const collector = message.createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id,
                max: 20,
                idle: 20e3,
                time: 90e3,
            });

            collector.on("collect", async (i) => {
                await i.deferUpdate();

                if (i.componentType === ComponentType.Button) {
                    page = Embed.calculatePageNumber(i.customId, page, maxPage);
                } else if (i.componentType === ComponentType.StringSelect) {
                    type = i.values[0];
                    stocks = await this.client.investment.getInvestmentsByType(type);
                    maxPage = Math.ceil(stocks.length / this.ITEMS_PER_PAGE);
                    page = 0;
                }

                await interaction.editReply({
                    embeds: [this.getEmbed(stocks, type, page, maxPage)],
                    components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(this.options, "investing_selectMenu", type)],
                });
            });

            collector.on("end", async () => {
                await interaction.editReply({ components: [...Embed.getPageButtons(page, maxPage, true), ...Embed.getSelectMenu(this.options, "investing_selectMenu", type, true)] });
            });
        }
    }

    private async getBuy(interaction: ChatInputCommandInteraction, member: IMember) {
        const ticker = interaction.options.getString("ticker", true);
        let amount = interaction.options.getInteger("amount", false);
        let price = interaction.options.getInteger("price", false);

        if (amount && price) {
            await interaction.reply({ content: "You can't use both an amount and price.", ephemeral: true });
            return;
        } else if (!amount && !price) {
            await interaction.reply({ content: "You need to use either amount or price.", ephemeral: true });
            return;
        }

        const investment = await this.client.investment.getInvestment(ticker.toUpperCase());
        if (!investment) {
            await interaction.reply({
                content: `The investment with ticker \`${ticker.toUpperCase()}\` does not exist.`,
                ephemeral: true,
            });
            return;
        }

        if (amount) {
            price = Math.round(parseFloat(investment.price) * amount);
        } else if (price) {
            amount = Utils.roundNumber(price / parseFloat(investment.price), 3);
        } else {
            await interaction.reply({ content: "You need to use either amount or price.", ephemeral: true });
            return;
        }

        if (amount <= 0) {
            await interaction.reply({
                content: `You can't buy **0x ${investment.ticker}** investments.`,
                ephemeral: true,
            });
            return;
        } else if (price > member.wallet) {
            await interaction.reply({
                content: `You don't have enough money to buy **${amount}x ${investment.ticker}** investments.`,
                ephemeral: true,
            });
            return;
        } else if (price < this.MIN_PRICE) {
            await interaction.reply({
                content: `You need to spend at least :coin: **${this.MIN_PRICE}** on \`${investment.ticker}\` investments.`,
                ephemeral: true,
            });
            return;
        }

        const ownedInvestment = member.investments.find(el => el.ticker === investment.ticker);
        if (ownedInvestment) {
            const totalAmount = parseFloat(ownedInvestment.amount.toString()) + amount;
            if (totalAmount > this.MAX_OWNED_STOCK) {
                await interaction.reply({
                    content: `You can't buy more than **${this.MAX_OWNED_STOCK}x ${investment.ticker}** investments.`,
                    ephemeral: true,
                });
                return;
            }
        } else {
            if (amount > this.MAX_OWNED_STOCK) {
                await interaction.reply({
                    content: `You can't buy more than **${this.MAX_OWNED_STOCK}x ${investment.ticker}** investments.`,
                    ephemeral: true,
                });
                return;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`You just bought ${amount}x ${investment.fullName}`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${investment.ticker.toUpperCase()}.png`)
            .addFields(
                {
                    name: "Info",
                    value: `:envelope: **Type:** ${investment.type}\n:tickets: **Ticker:** ${investment.ticker}\n:apple: **Full Name:** ${investment.fullName}`,
                    inline: true,
                },
                {
                    name: "Stats",
                    value: `:moneybag: **Unit Price:** :coin: ${investment.price}\n:1234: **Amount:** ${amount}x\n:gem: **Buy Price:** :coin: ${price}`,
                    inline: true,
                },
            );
        await interaction.reply({ embeds: [embed] });

        if (ownedInvestment) {
            await Member.updateOne({ id: member.id, "investments.ticker": investment.ticker }, {
                $inc: {
                    "investments.$.amount": amount,
                    "investments.$.buyPrice": price,
                },
            });
        } else {
            await Member.updateOne({ id: member.id }, {
                $push: {
                    investments: {
                        ticker: investment.ticker,
                        amount,
                        buyPrice: price,
                    },
                },
            });
        }

        await this.client.achievement.sendAchievementMessage(interaction, member.id, this.client.achievement.getById("warren_buffett")!);
        await UserStats.updateOne({ id: member.id }, {
            $inc: {
                "investments.amountOfTimesBought": 1,
                "investments.totalBuyPrice": price,
                totalSpend: price,
            },
        }, { upsert: true });
    }

    private async getSell(interaction: ChatInputCommandInteraction, member: IMember) {
        const ticker = interaction.options.getString("ticker", true);
        const amount = interaction.options.getNumber("amount", true);

        const ownedInvestment = member.investments.find(el => el.ticker === ticker.toUpperCase());
        if (!ownedInvestment) {
            await interaction.reply({
                content: `You don't own any investments with ticker \`${ticker.toUpperCase()}\`.`,
                ephemeral: true,
            });
            return;
        } else if (amount > parseFloat(ownedInvestment.amount.toString())) {
            await interaction.reply({
                content: `You don't own **${amount}x ${ticker.toUpperCase()}** investments.`,
                ephemeral: true,
            });
            return;
        }

        const investment = await this.client.investment.getInvestment(ticker.toUpperCase());
        if (!investment) {
            await interaction.reply({
                content: `The investment with ticker \`${ticker.toUpperCase()}\` does not exist.`,
                ephemeral: true,
            });

            await Member.updateOne({ id: member.id }, {
                $pull: { investments: { ticker: ownedInvestment.ticker } },
            });

            return;
        }

        const price = Math.round(parseFloat(investment.price) * amount);
        const embed = new EmbedBuilder()
            .setTitle(`You sold ${amount}x ${investment.fullName}`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${investment.ticker.toUpperCase()}.png`)
            .addFields(
                { name: "Info", value: `:envelope: **Type:** ${investment.type}\n:tickets: **Ticker:** ${investment.ticker}\n:apple: **Full Name:** ${investment.fullName}`, inline: true },
                { name: "Stats", value: `:moneybag: **Unit Price:** :coin: ${investment.price}\n:1234: **Amount:** ${amount}x\n:gem: **Sell Price:** :coin: ${price}`, inline: true },
            );
        await interaction.reply({ embeds: [embed] });

        if (parseFloat(ownedInvestment.amount.toString()) <= amount) {
            await Member.updateOne({ id: member.id }, {
                $pull: { investments: { ticker: ownedInvestment.ticker } },
                $inc: { wallet: price },
            });
        } else {
            await Member.updateOne({ id: member.id, "investments.ticker": investment.ticker }, {
                $inc: {
                    "investments.$.amount": -amount,
                    "investments.$.buyPrice": -Math.floor((amount / parseFloat(ownedInvestment.amount.toString())) * parseFloat(ownedInvestment.buyPrice.toString())),
                    wallet: price,
                },
            });
        }

        await UserStats.updateOne({ id: member.id }, {
            $inc: {
                "investments.amountOfTimesSold": 1,
                totalEarned: price,
            }
        });
    }

    private getEmbed(investments: IInvestment[], type = "Stocks", page: number, maxPage: number): EmbedBuilder {
        const itemsOnPage = investments.slice(page * this.ITEMS_PER_PAGE, (page + 1) * this.ITEMS_PER_PAGE);
        const desc = itemsOnPage.map((investment: IInvestment) =>
            `• **${investment.fullName}** (\`${investment.ticker}\`)\n> :coin: ${investment.price} - ${parseFloat(investment.changed) >= 0 ? ":chart_with_upwards_trend:" : ":chart_with_downwards_trend:"} ${investment.changed}%`,
        ).join("\n\n");

        const label = this.options.find(el => el.value === type)?.label;
        return new EmbedBuilder()
            .setAuthor({ name: `All Investments${label ? ` - ${label}` : ""}` })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`**More Info:** \`/${this.info.name} info <ticker>\`\n\n${desc}\n\nLast Updated: <t:${Math.floor(investments[0].updatedAt.getTime() / 1000)}:R>`)
            .setFooter({ text: `Page ${page + 1} of ${maxPage}.` });
    }
}