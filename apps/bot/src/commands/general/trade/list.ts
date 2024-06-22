import {
    type ChatInputCommandInteraction,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    ComponentType,
    type ColorResolvable,
} from 'discord.js';
import type Bot from '../../../domain/Bot';
import TradeModel, { TradeStatus, type Trade } from '../../../models/trade';
import { filter, getUser } from '../../../utils';
import { calculatePageNumber, getPageButtons } from '../../../utils/embed';

const ItemsPerPage = 5;

type Filter = {
    id: string;
    name: string;
    description: string;
    getFilter(userId: string): object;
};

const filters: Filter[] = [
    {
        id: 'ALL',
        name: 'All',
        description: 'Get all trades that you are involved in',
        getFilter: (userId) => ({
            $or: [{ userId: userId }, { toUserId: userId }],
        }),
    },
    {
        id: 'YOUR_TRADES',
        name: 'Your Trades',
        description: 'Get trades that you have created',
        getFilter: (userId) => ({
            userId: userId,
        }),
    },
    {
        id: 'TRADES_WITH_YOU',
        name: 'Trades with you',
        description: 'Get trades that are created by others',
        getFilter: (userId) => ({
            toUserId: userId,
        }),
    },
    {
        id: 'ACTIVE_TRADES',
        name: 'Active Trades',
        description: 'Get trades that are still active',
        getFilter: () => ({
            $and: [
                { status: { $in: [TradeStatus.PENDING, TradeStatus.WAITING_FOR_CONFIRMATION] } },
                { expiresAt: { $gt: new Date() } },
            ],
        }),
    },
    {
        id: 'CLOSED_TRADES',
        name: 'Closed Trades',
        description: 'Get trades that are closed',
        getFilter: () => ({
            $or: [
                { status: { $nin: [TradeStatus.PENDING, TradeStatus.WAITING_FOR_CONFIRMATION] } },
                { status: TradeStatus.COMPLETED },
            ],
        }),
    },
];

async function createEmbed(
    client: Bot,
    trades: Trade[],
    filter: string[],
    page: number,
    maxPage: number,
): Promise<EmbedBuilder> {
    const tradeText: string[] = [];
    for (const trade of trades) {
        const fromUser = await getUser(client, trade.userId);
        const toUser = await getUser(client, trade.toUserId);

        const expireFormat = `<t:${Math.floor(trade.expiresAt.getTime() / 1000)}:R>`;
        const expires = trade.expiresAt.getTime() > Date.now() ? `Expires ${expireFormat}` : `Expired ${expireFormat}`;

        tradeText.push(
            `\`${trade.tradeId}\` | ${fromUser ? `**${fromUser.username}**` : `<@${trade.userId}>`} <-> ${toUser ? `**${toUser.username}**` : `<@${trade.toUserId}>`}\n` +
                `> **Status:** \`${trade.status}\` | ${expires}`,
        );
    }

    let noTradeText = 'No trades found.';
    if (filter.includes('ALL') && filter.length === 1) {
        noTradeText = 'You have not created or been involved in any trades yet.';
    } else {
        noTradeText =
            'No trades found with the selected filters. Try changing the filters. For example, you cannot have `Active Trades` and `Closed Trades` selected at the same time because a trade cannot be both active and closed.';
    }

    const selectedFilters = filters.filter((f) => filter.includes(f.id)).map((f) => `\`${f.name}\``);
    return new EmbedBuilder()
        .setTitle('Trading List')
        .setDescription(
            `:scales: **Use** \`/trade view <trade-id>\` **to get more info about a trade.**\n:file_folder: **Active Filters:** ${selectedFilters.join(', ')}\n\n` +
                (tradeText.join('\n\n') || noTradeText),
        )
        .setColor(client.config.embed.color as ColorResolvable)
        .setFooter({ text: `Page ${page + 1}/${maxPage}` });
}

function createSelectMenu(activeFilters: string[], isDisabled = false): ActionRowBuilder<StringSelectMenuBuilder> {
    const select = new StringSelectMenuBuilder()
        .setCustomId('trade_list_select')
        .setPlaceholder('Filter your trades')
        .setMinValues(1)
        .setMaxValues(5)
        .setDisabled(isDisabled);

    for (const filter of filters) {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(filter.name)
                .setDescription(filter.description)
                .setValue(filter.id)
                .setDefault(activeFilters.includes(filter.id)),
        );
    }

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

async function getTrades(activeFilters: string[], userId: string): Promise<Trade[]> {
    return TradeModel.find({
        $and: activeFilters.map((filter) => filters.find((f) => f.id === filter)!.getFilter(userId)),
    })
        .sort({ createdAt: -1 })
        .limit(100);
}

function getTradesForCurrentPage(allTrades: Trade[], page: number): Trade[] {
    return allTrades.slice(page * ItemsPerPage, page * ItemsPerPage + ItemsPerPage);
}

export default async function list(client: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    let activeFilters: string[] = [filters[0]!.id];
    let trades = await getTrades(activeFilters, interaction.user.id);
    let page = 0;
    let maxPage = Math.ceil(trades.length / ItemsPerPage);
    let pageTrades = getTradesForCurrentPage(trades, page);

    const message = await interaction.editReply({
        embeds: [await createEmbed(client, pageTrades, activeFilters, page, maxPage)],
        components: [createSelectMenu(activeFilters), ...getPageButtons(page, maxPage)],
    });

    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        max: 20,
        idle: 25_000,
        time: 180_000,
    });

    collector.on('collect', async (i) => {
        if (i.componentType === ComponentType.Button) {
            page = calculatePageNumber(i.customId, page, maxPage);
        } else if (i.componentType === ComponentType.StringSelect) {
            activeFilters = i.values;
            trades = await getTrades(activeFilters, interaction.user.id);
            page = 0;
            maxPage = Math.ceil(trades.length / ItemsPerPage);
            pageTrades = getTradesForCurrentPage(trades, page);
        }

        await i.update({
            embeds: [await createEmbed(client, pageTrades, activeFilters, page, maxPage)],
            components: [createSelectMenu(activeFilters), ...getPageButtons(page, maxPage)],
        });
    });

    collector.on('end', async () => {
        await interaction.editReply({
            components: [createSelectMenu(activeFilters, true), ...getPageButtons(page, maxPage, true)],
        });
    });
}
