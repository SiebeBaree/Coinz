import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, User } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Investment from "../../models/Investment";
import Embed from "../../utils/Embed";
import { Types } from "mongoose";
import Helpers from "../../utils/Helpers";

type PortfolioStock = {
    ticker: string;
    type: string;
    fullName: string;
    price: Types.Decimal128;
    previousClose: Types.Decimal128;
    lastUpdated: number;
    buyPrice: number;
    amount: Types.Decimal128;
};

export default class extends Command implements ICommand {
    readonly info = {
        name: "portfolio",
        description: "Get your investment portfolio or the portfolio from another user.",
        options: [
            {
                name: "user",
                type: ApplicationCommandOptionType.User,
                description: "Get the investment portfolio of another user.",
                required: false,
            },
        ],
        category: "investing",
    };

    private readonly itemsPerPage = 5;
    private readonly options = [
        { label: "Stocks", value: "Stock" },
        { label: "Crypto", value: "Crypto" },
    ];

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const user = interaction.options.getUser("user", false) ?? interaction.user;
        member = user.id === interaction.user.id ? member : await Member.findOne({ id: user.id }) ?? member;

        let category = "Stock";
        const allStocks = await this.getInvestments(member);
        let selectedInvestments = this.selectInvestments(allStocks, category);
        let maxPage = this.calculateMaxPages(selectedInvestments);
        let page = 0;

        const message = await interaction.reply({ embeds: [this.createEmbed(user, selectedInvestments, page, maxPage)], components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(this.options, "portfolio_selectMenu", category)] });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 20, idle: 20_000, time: 90_000 });

        collector.on("collect", async (i) => {
            if (i.componentType === ComponentType.Button) {
                page = Embed.calculatePageNumber(i.customId, page, maxPage);
            } else if (i.componentType === ComponentType.StringSelect) {
                category = i.values[0];
                selectedInvestments = this.selectInvestments(allStocks, category);
                maxPage = this.calculateMaxPages(selectedInvestments);
                page = 0;
            }

            await i.update({ embeds: [this.createEmbed(user, selectedInvestments, page, maxPage)], components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(this.options, "portfolio_selectMenu", category)] });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [...Embed.getPageButtons(page, maxPage, true), ...Embed.getSelectMenu(this.options, "portfolio_selectMenu", category, true)] });
        });
    }

    async getInvestments(member: IMember): Promise<PortfolioStock[]> {
        const sortedStocks: PortfolioStock[] = [];

        for (let i = 0; i < member.stocks.length; i++) {
            const stock = await Investment.findOne({ ticker: member.stocks[i].ticker });
            if (stock === null) continue;

            sortedStocks.push({
                ticker: stock.ticker,
                type: stock.type,
                fullName: stock.fullName,
                price: stock.price,
                previousClose: stock.previousClose,
                lastUpdated: stock.lastUpdated,
                buyPrice: member.stocks[i].buyPrice,
                amount: member.stocks[i].amount,
            });
        }

        return sortedStocks;
    }

    createEmbed(user: User, investments: PortfolioStock[], page: number, maxPage: number): EmbedBuilder {
        const itemsOnPage = investments.slice(page * this.itemsPerPage, (page + 1) * this.itemsPerPage);
        const fields = itemsOnPage.map((investment: PortfolioStock) => {
            const currentlyWorth = Math.floor(parseFloat(investment.price.toString()) * parseFloat(investment.amount.toString()));
            const change = this.calculateChange(parseFloat(investment.price.toString()), parseFloat(investment.previousClose.toString()));
            return {
                name: `${investment.amount}x ${investment.fullName} (${investment.ticker})`,
                value: `:money_with_wings: **Total Buy Price:** :coin: ${investment.buyPrice}\n:moneybag: **Currently Worth:** :coin: ${currentlyWorth}\n${change.icon} **Total Change:** :coin: ${currentlyWorth - investment.buyPrice} (${change.changePercentage}%)`,
                inline: false,
            };
        });

        return new EmbedBuilder()
            .setAuthor({ name: `Portfolio of ${user.username}`, iconURL: user.displayAvatarURL() })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: `Page ${page + 1} of ${maxPage}.` })
            .setDescription(fields.length <= 0 ? "You don't have any assets of this category." : null)
            .addFields(fields.length > 0 ? fields : []);
    }

    calculateMaxPages(stocks: PortfolioStock[]) {
        return stocks.length <= 0 ? 1 : Math.ceil(stocks.length / this.itemsPerPage);
    }

    selectInvestments(stocks: PortfolioStock[], category: string): PortfolioStock[] {
        return stocks.filter((stock) => stock.type === category);
    }

    private calculateChange(buyPrice: number, currentPrice: number): { icon: string; changePercentage: number } {
        let changePercentage = Helpers.roundNumber(((currentPrice - buyPrice) / buyPrice * 100), 2);
        if (isNaN(changePercentage)) changePercentage = 0;
        return { icon: changePercentage < 0 ? ":chart_with_downwards_trend:" : ":chart_with_upwards_trend:", changePercentage: changePercentage };
    }
}