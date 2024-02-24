import type { ColorResolvable, User } from 'discord.js';
import { ApplicationCommandOptionType, ComponentType, EmbedBuilder } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';
import type { IMember } from '../../models/member';
import { roundNumber } from '../../utils';
import { calculatePageNumber, getPageButtons, getSelectMenu } from '../../utils/embed';

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

const ITEMS_PER_PAGE = 5;
const options = [
    { label: 'Stocks', value: 'Stock' },
    { label: 'Crypto', value: 'Crypto' },
];

function createEmbed(
    client: Bot,
    user: User,
    investments: PortfolioInvestments[],
    page: number,
    maxPage: number,
): EmbedBuilder {
    const itemsOnPage = investments.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
    const fields = itemsOnPage.map((investment: PortfolioInvestments) => {
        return {
            name: `${investment.amount}x ${investment.name} (${investment.ticker})`,
            value: `:money_with_wings: **Total Buy Price:** :coin: ${
                investment.buyPrice
            }\n:moneybag: **Currently Worth:** :coin: ${roundNumber(investment.worth, 2)}\n${
                investment.changePercentage >= 0 ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:'
            } **Total Change:** :coin: ${investment.change} (${investment.changePercentage}%)`,
            inline: false,
        };
    });

    return new EmbedBuilder()
        .setAuthor({ name: `Portfolio of ${user.username}`, iconURL: user.displayAvatarURL() })
        .setColor(client.config.embed.color as ColorResolvable)
        .setFooter({ text: `Page ${page + 1} of ${maxPage}.` })
        .setDescription(fields.length <= 0 ? "You don't have any assets of this category." : null)
        .addFields(fields.length > 0 ? fields : []);
}

async function getInvestments(client: Bot, member: IMember): Promise<PortfolioInvestments[]> {
    const investments: PortfolioInvestments[] = [];

    for (const i of member.investments) {
        const investment = await client.investment.getInvestment(i.ticker);
        if (investment === null) continue;

        const worth = Number.parseFloat(i.amount) * Number.parseFloat(investment.price);
        investments.push({
            ticker: investment.ticker,
            type: investment.type,
            name: investment.fullName,
            buyPrice: i.buyPrice,
            worth: worth,
            change: roundNumber(worth - i.buyPrice, 2),
            changePercentage: roundNumber(((worth - i.buyPrice) / i.buyPrice) * 100, 2),
            amount: i.amount.toString(),
        });
    }

    return investments;
}

function calculateMaxPages(investments: PortfolioInvestments[]) {
    return investments.length <= 0 ? 1 : Math.ceil(investments.length / ITEMS_PER_PAGE);
}

function selectInvestments(investments: PortfolioInvestments[], category: string): PortfolioInvestments[] {
    return investments.filter((investment) => investment.type === category);
}

export default {
    data: {
        name: 'portfolio',
        description: 'Get your investment portfolio or from another user.',
        category: 'investing',
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the investment portfolio of another user.',
                required: false,
            },
        ],
    },
    async execute(client, interaction, member) {
        const user = interaction.options.getUser('user', false) ?? interaction.user;
        const memberData = user.id === interaction.user.id ? member : (await getMember(user.id)) ?? member;

        let category = options[0]?.value ?? 'Stock';
        const allInvestments = await getInvestments(client, memberData);
        let selectedInvestments = selectInvestments(allInvestments, category);
        let maxPage = calculateMaxPages(selectedInvestments);
        let page = 0;

        const message = await interaction.reply({
            embeds: [createEmbed(client, user, selectedInvestments, page, maxPage)],
            components: [...getPageButtons(page, maxPage), ...getSelectMenu(options, 'portfolio_selectMenu', category)],
        });

        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            max: 20,
            idle: 20e3,
            time: 90e3,
        });

        collector.on('collect', async (i) => {
            if (i.componentType === ComponentType.Button) {
                page = calculatePageNumber(i.customId, page, maxPage);
            } else if (i.componentType === ComponentType.StringSelect) {
                category = i.values[0] ?? 'Stock';
                selectedInvestments = selectInvestments(allInvestments, category);
                maxPage = calculateMaxPages(selectedInvestments);
                page = 0;
            }

            await i.update({
                embeds: [createEmbed(client, user, selectedInvestments, page, maxPage)],
                components: [
                    ...getPageButtons(page, maxPage),
                    ...getSelectMenu(options, 'portfolio_selectMenu', category),
                ],
            });
        });

        collector.on('end', async () => {
            await interaction.editReply({
                components: [
                    ...getPageButtons(page, maxPage, true),
                    ...getSelectMenu(options, 'portfolio_selectMenu', category, true),
                ],
            });
        });
    },
} satisfies Command;
