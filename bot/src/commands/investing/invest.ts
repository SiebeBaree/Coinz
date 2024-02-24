import type { ChatInputCommandInteraction, ColorResolvable } from 'discord.js';
import { ComponentType, EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import type { IInvestment } from '../../models/investment';
import type { IMember } from '../../models/member';
import Member from '../../models/member';
import UserStats from '../../models/userStats';
import { filter, roundNumber } from '../../utils';
import { calculatePageNumber, getPageButtons, getSelectMenu } from '../../utils/embed';

const MAX_OWNED_STOCK = 20_000_000;
const MIN_PRICE = 50;
const ITEMS_PER_PAGE = 7;
const options = [
    { label: 'Stocks', value: 'Stock' },
    { label: 'Crypto', value: 'Crypto' },
];

function getEmbed(
    client: Bot,
    investments: IInvestment[],
    page: number,
    maxPage: number,
    type = 'Stocks',
): EmbedBuilder {
    const itemsOnPage = investments.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
    const desc = itemsOnPage
        .map(
            (investment: IInvestment) =>
                `• **${investment.fullName}** (\`${investment.ticker}\`)\n> :coin: ${investment.price} - ${
                    Number.parseFloat(investment.changed) >= 0
                        ? ':chart_with_upwards_trend:'
                        : ':chart_with_downwards_trend:'
                } ${investment.changed}%`,
        )
        .join('\n\n');

    const label = options.find((el) => el.value === type)?.label;
    return new EmbedBuilder()
        .setAuthor({ name: `All Investments${label ? ` - ${label}` : ''}` })
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            `**More Info:** \`/invest info <ticker>\`\n\n${desc}\n\nLast Updated: <t:${Math.floor(
                (investments[0]?.updatedAt.getTime() ?? 0) / 1000,
            )}:R>`,
        )
        .setFooter({ text: `Page ${page + 1} of ${maxPage}.` });
}

async function getInfo(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const ticker = interaction.options.getString('ticker', false);

    if (ticker) {
        const investment = await client.investment.getInvestment(ticker.toUpperCase());

        if (!investment) {
            await interaction.reply({
                content: `No investment found with ticker ${ticker.toUpperCase()}`,
                ephemeral: true,
            });
            return;
        }

        const ownedInvestment = member.investments.find((el) => el.ticker === investment.ticker);
        const iconURL = `https://cdn.coinzbot.xyz/ticker/${investment.ticker}.png`;
        const icon =
            Number.parseFloat(investment.changed) >= 0 ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:';

        const embed = new EmbedBuilder()
            .setTitle(`Investment - ${investment.fullName}`)
            .setDescription(
                `Visit the new [**investments page**](${client.config.website}/investments) for an overview of all investments.\nBuy this investment: \`/invest buy ticker:${investment.ticker} amount:1\``,
            )
            .addFields(
                {
                    name: 'Information',
                    value: `:envelope: **Type:** ${investment.type}\n:tickets: **Ticker:** \`${investment.ticker}\`\n:apple: **Full Name:** ${investment.fullName}`,
                    inline: true,
                },
                {
                    name: 'Statistics',
                    value: `:moneybag: **Price:** :coin: ${investment.price}\n${icon} **Change:** ${
                        investment.changed
                    }%\n:clock1: **Last Updated:** <t:${Math.floor(investment.updatedAt.getTime() / 1000)}:R>`,
                    inline: true,
                },
            )
            .setThumbnail(iconURL)
            .setColor(client.config.embed.color as ColorResolvable);

        if (ownedInvestment) {
            const worth = Math.round(Number.parseFloat(ownedInvestment.amount) * Number.parseFloat(investment.price));
            const profit = Math.round(
                ((Number.parseFloat(ownedInvestment.amount) * Number.parseFloat(investment.price) -
                    ownedInvestment.buyPrice) /
                    ownedInvestment.buyPrice) *
                    100,
            );

            embed.addFields({
                name: `Your investment in ${investment.fullName}`,
                value: `:dollar: **Worth:** :coin: ${worth}\n:credit_card: **Amount:** ${
                    ownedInvestment.amount
                }x\n:moneybag: **Invested:** :coin: ${ownedInvestment.buyPrice}\n${
                    profit >= 0 ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:'
                } **Profit:** :coin: ${worth - ownedInvestment.buyPrice} (${profit}%)`,
                inline: false,
            });
        }

        await interaction.reply({ embeds: [embed] });
    } else {
        let type = options[0]?.value ?? 'Stock';
        let stocks = await client.investment.getInvestmentsByType(type);
        let maxPage = Math.ceil(stocks.length / ITEMS_PER_PAGE);
        let page = 0;

        const message = await interaction.reply({
            embeds: [getEmbed(client, stocks, page, maxPage, type)],
            components: [...getPageButtons(page, maxPage), ...getSelectMenu(options, 'investing_selectMenu', type)],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            max: 20,
            idle: 20_000,
            time: 90_000,
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            if (i.componentType === ComponentType.Button) {
                page = calculatePageNumber(i.customId, page, maxPage);
            } else if (i.componentType === ComponentType.StringSelect) {
                type = i.values[0] ?? 'Stock';
                stocks = await client.investment.getInvestmentsByType(type);
                maxPage = Math.ceil(stocks.length / ITEMS_PER_PAGE);
                page = 0;
            }

            await interaction.editReply({
                embeds: [getEmbed(client, stocks, page, maxPage, type)],
                components: [...getPageButtons(page, maxPage), ...getSelectMenu(options, 'investing_selectMenu', type)],
            });
        });

        collector.on('end', async () => {
            await interaction.editReply({
                components: [
                    ...getPageButtons(page, maxPage, true),
                    ...getSelectMenu(options, 'investing_selectMenu', type, true),
                ],
            });
        });
    }
}

async function getBuy(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const ticker = interaction.options.getString('ticker', true);
    let amount = interaction.options.getInteger('amount', false);
    let price = interaction.options.getInteger('price', false);

    if (amount && price) {
        await interaction.reply({ content: "You can't use both an amount and price.", ephemeral: true });
        return;
    } else if (!amount && !price) {
        await interaction.reply({ content: 'You need to use either amount or price.', ephemeral: true });
        return;
    }

    const investment = await client.investment.getInvestment(ticker.toUpperCase());
    if (!investment) {
        await interaction.reply({
            content: `The investment with ticker \`${ticker.toUpperCase()}\` does not exist.`,
            ephemeral: true,
        });
        return;
    }

    if (amount) {
        price = Math.round(Number.parseFloat(investment.price) * amount);
    } else if (price) {
        amount = roundNumber(price / Number.parseFloat(investment.price), 3);
    } else {
        await interaction.reply({ content: 'You need to use either amount or price.', ephemeral: true });
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
    } else if (price < MIN_PRICE) {
        await interaction.reply({
            content: `You need to spend at least :coin: **${MIN_PRICE}** on \`${investment.ticker}\` investments.`,
            ephemeral: true,
        });
        return;
    }

    const ownedInvestment = member.investments.find((el) => el.ticker === investment.ticker);
    if (ownedInvestment) {
        const totalAmount = Number.parseFloat(ownedInvestment.amount.toString()) + amount;
        if (totalAmount > MAX_OWNED_STOCK) {
            await interaction.reply({
                content: `You can't buy more than **${MAX_OWNED_STOCK}x ${investment.ticker}** investments.`,
                ephemeral: true,
            });
            return;
        }
    } else if (amount > MAX_OWNED_STOCK) {
        await interaction.reply({
            content: `You can't buy more than **${MAX_OWNED_STOCK}x ${investment.ticker}** investments.`,
            ephemeral: true,
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`You just bought ${amount}x ${investment.fullName}`)
        .setColor(client.config.embed.color as ColorResolvable)
        .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${investment.ticker.toUpperCase()}.png`)
        .addFields(
            {
                name: 'Info',
                value: `:envelope: **Type:** ${investment.type}\n:tickets: **Ticker:** ${investment.ticker}\n:apple: **Full Name:** ${investment.fullName}`,
                inline: true,
            },
            {
                name: 'Stats',
                value: `:moneybag: **Unit Price:** :coin: ${investment.price}\n:1234: **Amount:** ${amount}x\n:gem: **Buy Price:** :coin: ${price}`,
                inline: true,
            },
        );
    await interaction.reply({ embeds: [embed] });

    if (ownedInvestment) {
        await Member.updateOne(
            { id: member.id, 'investments.ticker': investment.ticker },
            {
                $set: {
                    'investments.$.amount': `${Number.parseFloat(ownedInvestment.amount) + amount}`,
                },
                $inc: {
                    'investments.$.buyPrice': price,
                },
            },
        );
    } else {
        await Member.updateOne(
            { id: member.id },
            {
                $push: {
                    investments: {
                        ticker: investment.ticker,
                        amount,
                        buyPrice: price,
                    },
                },
            },
        );
    }

    await client.achievement.sendAchievementMessage(
        interaction,
        member.id,
        client.achievement.getById('warren_buffett')!,
    );
    await UserStats.updateOne(
        { id: member.id },
        {
            $inc: {
                'investments.amountOfTimesBought': 1,
                'investments.totalBuyPrice': price,
                totalSpend: price,
            },
        },
        { upsert: true },
    );
}

async function getSell(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const ticker = interaction.options.getString('ticker', true);
    const amount = interaction.options.getNumber('amount', true);

    const ownedInvestment = member.investments.find((el) => el.ticker === ticker.toUpperCase());
    if (!ownedInvestment) {
        await interaction.reply({
            content: `You don't own any investments with ticker \`${ticker.toUpperCase()}\`.`,
            ephemeral: true,
        });
        return;
    } else if (amount > Number.parseFloat(ownedInvestment.amount)) {
        await interaction.reply({
            content: `You don't own **${amount}x ${ticker.toUpperCase()}** investments.`,
            ephemeral: true,
        });
        return;
    }

    const investment = await client.investment.getInvestment(ticker.toUpperCase());
    if (!investment) {
        await interaction.reply({
            content: `The investment with ticker \`${ticker.toUpperCase()}\` does not exist.`,
            ephemeral: true,
        });

        await Member.updateOne(
            { id: member.id },
            {
                $pull: { investments: { ticker: ownedInvestment.ticker } },
            },
        );

        return;
    }

    const price = Math.round(Number.parseFloat(investment.price) * amount);
    const embed = new EmbedBuilder()
        .setTitle(`You sold ${amount}x ${investment.fullName}`)
        .setColor(client.config.embed.color as ColorResolvable)
        .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${investment.ticker.toUpperCase()}.png`)
        .addFields(
            {
                name: 'Info',
                value: `:envelope: **Type:** ${investment.type}\n:tickets: **Ticker:** ${investment.ticker}\n:apple: **Full Name:** ${investment.fullName}`,
                inline: true,
            },
            {
                name: 'Stats',
                value: `:moneybag: **Unit Price:** :coin: ${investment.price}\n:1234: **Amount:** ${amount}x\n:gem: **Sell Price:** :coin: ${price}`,
                inline: true,
            },
        );
    await interaction.reply({ embeds: [embed] });

    if (Number.parseFloat(ownedInvestment.amount) <= amount) {
        await Member.updateOne(
            { id: member.id },
            {
                $pull: { investments: { ticker: ownedInvestment.ticker } },
                $inc: { wallet: price },
            },
        );
    } else {
        await Member.updateOne(
            { id: member.id, 'investments.ticker': investment.ticker },
            {
                $set: {
                    'investments.$.amount': `${Number.parseFloat(ownedInvestment.amount) - amount}`,
                },
                $inc: {
                    'investments.$.buyPrice': -Math.floor(
                        (amount / Number.parseFloat(ownedInvestment.amount)) * ownedInvestment.buyPrice,
                    ),
                    wallet: price,
                },
            },
        );
    }

    await UserStats.updateOne(
        { id: member.id },
        {
            $inc: {
                'investments.amountOfTimesSold': 1,
                totalEarned: price,
            },
        },
    );
}

export default {
    data: {
        name: 'invest',
        description: 'Buy, sell or get info about an investment.',
        category: 'investing',
        options: [
            {
                name: 'info',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get info about an investment.',
                options: [
                    {
                        name: 'ticker',
                        type: ApplicationCommandOptionType.String,
                        description: 'The ticker of the investment you want to get info about.',
                        required: false,
                    },
                ],
            },
            {
                name: 'buy',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Invest your money.',
                options: [
                    {
                        name: 'ticker',
                        type: ApplicationCommandOptionType.String,
                        description: 'The ticker of the investment you want to buy.',
                        required: true,
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'How much you want to buy. Use 0 to buy fractional.',
                        required: false,
                        min_value: 0,
                        max_value: 5000,
                    },
                    {
                        name: 'price',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'How much money you want to spend on the investment.',
                        required: false,
                        min_value: 50,
                        max_value: 50000,
                    },
                ],
            },
            {
                name: 'sell',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Sell an investment.',
                options: [
                    {
                        name: 'ticker',
                        type: ApplicationCommandOptionType.String,
                        description: 'The ticker of the investment you want to sell.',
                        required: true,
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Number,
                        description: 'How much you want to sell.',
                        required: true,
                        min_value: 0,
                        max_value: MAX_OWNED_STOCK,
                    },
                ],
            },
        ],
        usage: ['info [ticker]', 'buy <ticker> [amount | price]', 'sell <ticker> <amount>'],
    },
    async execute(client, interaction, member) {
        switch (interaction.options.getSubcommand()) {
            case 'info':
                await getInfo(client, interaction, member);
                break;
            case 'buy':
                await getBuy(client, interaction, member);
                break;
            case 'sell':
                await getSell(client, interaction, member);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
