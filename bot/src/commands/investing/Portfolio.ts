import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction, ColorResolvable,
    ComponentType,
    EmbedBuilder,
    User,
} from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import { IMember } from "../../models/Member";
import Database from "../../lib/Database";
import Utils from "../../lib/Utils";
import Embed from "../../lib/Embed";

type PortfolioInvestments = {
    ticker: string;
    type: string;
    name: string;
    buyPrice: number;
    worth: number;
    change: number;
    changePercentage: number;
    amount: string;
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

    private readonly ITEMS_PER_PAGE = 5;
    private readonly options = [
        { label: "Stocks", value: "Stock" },
        { label: "Crypto", value: "Crypto" },
    ];

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const user = interaction.options.getUser("user", false) ?? interaction.user;
        member = user.id === interaction.user.id ? member : await Database.getMember(user.id) ?? member;

        let category = this.options[0].value;
        const allInvestments = await this.getInvestments(member);
        let selectedInvestments = this.selectInvestments(allInvestments, category);
        let maxPage = this.calculateMaxPages(selectedInvestments);
        let page = 0;

        const message = await interaction.reply({
            embeds: [this.createEmbed(user, selectedInvestments, page, maxPage)],
            components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(this.options, "portfolio_selectMenu", category)],
        });

        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            max: 20,
            idle: 20e3,
            time: 90e3,
        });

        collector.on("collect", async (i) => {
            if (i.componentType === ComponentType.Button) {
                page = Embed.calculatePageNumber(i.customId, page, maxPage);
            } else if (i.componentType === ComponentType.StringSelect) {
                category = i.values[0];
                selectedInvestments = this.selectInvestments(allInvestments, category);
                maxPage = this.calculateMaxPages(selectedInvestments);
                page = 0;
            }

            await i.update({ embeds: [this.createEmbed(user, selectedInvestments, page, maxPage)], components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(this.options, "portfolio_selectMenu", category)] });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [...Embed.getPageButtons(page, maxPage, true), ...Embed.getSelectMenu(this.options, "portfolio_selectMenu", category, true)] });
        });
    }

    private createEmbed(user: User, investments: PortfolioInvestments[], page: number, maxPage: number): EmbedBuilder {
        const itemsOnPage = investments.slice(page * this.ITEMS_PER_PAGE, (page + 1) * this.ITEMS_PER_PAGE);
        const fields = itemsOnPage.map((investment: PortfolioInvestments) => {
            return {
                name: `${investment.amount}x ${investment.name} (${investment.ticker})`,
                value: `:money_with_wings: **Total Buy Price:** :coin: ${investment.buyPrice}\n:moneybag: **Currently Worth:** :coin: ${investment.worth}\n${investment.changePercentage >= 0 ? "" : ""} **Total Change:** :coin: ${investment.change} (${investment.changePercentage}%)`,
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

    private async getInvestments(member: IMember): Promise<PortfolioInvestments[]> {
        const investments: PortfolioInvestments[] = [];

        for (const i of member.investments) {
            const investment = await this.client.investment.getInvestment(i.ticker);
            if (investment === null) continue;

            const worth = parseFloat(i.amount.toString()) * parseFloat(investment.price);
            investments.push({
                ticker: investment.ticker,
                type: investment.type,
                name: investment.fullName,
                buyPrice: i.buyPrice,
                worth: worth,
                change: Utils.roundNumber(worth - i.buyPrice, 2),
                changePercentage: Utils.roundNumber(((worth - i.buyPrice) / i.buyPrice * 100), 2),
                amount: i.amount.toString(),
            });
        }

        return investments;
    }

    private calculateMaxPages(investments: PortfolioInvestments[]) {
        return investments.length <= 0 ? 1 : Math.ceil(investments.length / this.ITEMS_PER_PAGE);
    }

    private selectInvestments(investments: PortfolioInvestments[], category: string): PortfolioInvestments[] {
        return investments.filter((investment) => investment.type === category);
    }
}