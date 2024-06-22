/* eslint-disable @typescript-eslint/unbound-method */
import {
    type ChatInputCommandInteraction,
    EmbedBuilder,
    type ColorResolvable,
    ComponentType,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    TextInputBuilder,
    ModalBuilder,
    type ModalSubmitInteraction,
    TextInputStyle,
    type ButtonInteraction,
} from 'discord.js';
import type Bot from '../../../domain/Bot';
import { getMember } from '../../../lib/database';
import type { Item } from '../../../models/item';
import type { IMember } from '../../../models/member';
import Member from '../../../models/member';
import TradeModel, { type TradeItem, TradeStatus, type Trade } from '../../../models/trade';
import { getUser, updateTrade } from '../../../utils';
import { addMoney, removeMoney } from '../../../utils/money';

function getItemsFromUser(
    client: Bot,
    trade: Trade,
    userId: string,
): {
    items: string;
    totalWorth: number;
} {
    const userItems = trade.items.filter((item) => item.userId === userId);

    let totalWorth = 0;
    const items: string[] = [];
    let money = 0;
    for (const tradeItem of userItems) {
        if (tradeItem.itemId === 'money') {
            totalWorth += tradeItem.quantity;
            money += tradeItem.quantity;
        } else {
            const item = client.items.getById(tradeItem.itemId);
            if (!item) continue;

            totalWorth += (item.sellPrice ?? item.buyPrice ?? 0) * tradeItem.quantity;
            items.push(client.items.getItemString(item, tradeItem.quantity));
        }
    }

    let itemsStr = '';

    if (money > 0) {
        itemsStr += `**Money:** :coin: ${money}` + (items.length > 0 ? '\n' : '');
    }

    itemsStr += items.join('\n');

    return { items: itemsStr, totalWorth };
}

async function createEmbed(client: Bot, trade: Trade): Promise<EmbedBuilder> {
    const user = await getUser(client, trade.userId);
    const toUser = await getUser(client, trade.toUserId);
    const isExpired = trade.expiresAt.getTime() < Date.now();

    const itemsUser = getItemsFromUser(client, trade, trade.userId);
    const itemsToUser = getItemsFromUser(client, trade, trade.toUserId);

    return new EmbedBuilder()
        .setTitle(`Trade #${trade.tradeId}`)
        .setDescription(
            `:scales: **Trade ID:** \`${trade.tradeId}\`\n` +
                `:mirror_ball: **Status:** \`${trade.status}\`\n` +
                `:wastebasket: **${isExpired ? 'Expired' : 'Expires'}** <t:${Math.floor(trade.expiresAt.getTime() / 1000)}:R>\n` +
                `:busts_in_silhouette: **Trade between:** ${user?.username} <-> ${toUser?.username}`,
        )
        .setFields([
            {
                name: `${user?.username ?? `User ${trade.userId}`}`,
                value: `**Total worth:** :coin: ${itemsUser.totalWorth}\n\n**Items:**\n${itemsUser.items}`,
            },
            {
                name: `${toUser?.username ?? `User ${trade.toUserId}`}`,
                value: `**Total worth:** :coin: ${itemsToUser.totalWorth}\n\n**Items:**\n${itemsToUser.items}`,
            },
        ])
        .setColor(client.config.embed.color as ColorResolvable)
        .setFooter({ text: `Trade ID: ${trade.tradeId}` })
        .setTimestamp();
}

function createButtons(trade: Trade, isDisabled = false): ActionRowBuilder<ButtonBuilder>[] {
    if (trade.expiresAt.getTime() > Date.now()) {
        if (trade.status === TradeStatus.PENDING) {
            const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('trade_view_addItem')
                    .setLabel('Add Item')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(isDisabled),
                new ButtonBuilder()
                    .setCustomId('trade_view_addMoney')
                    .setLabel('Add Money')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(isDisabled),
                new ButtonBuilder()
                    .setCustomId('trade_view_confirmTrade')
                    .setLabel('Confirm Trade')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(isDisabled),
                new ButtonBuilder()
                    .setCustomId('trade_view_deleteTrade')
                    .setLabel('Delete Trade')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(isDisabled),
            );

            const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('trade_view_addItemToUser')
                    .setLabel('Add Item (Other user)')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(isDisabled),
                new ButtonBuilder()
                    .setCustomId('trade_view_addMoneyToUser')
                    .setLabel('Add Money (Other user)')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(isDisabled),
            );

            return [row1, row2];
        } else if (trade.status === TradeStatus.WAITING_FOR_CONFIRMATION) {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('toUser_trade_view_accept')
                    .setLabel('Accept Trade')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(isDisabled),
                new ButtonBuilder()
                    .setCustomId('toUser_trade_view_cancel')
                    .setLabel('Cancel Trade')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(isDisabled),
            );

            return [row];
        }
    }

    return [];
}

type Modal = {
    id: string;
    title: string;
    fields: {
        id: string;
        label: string;
        placeholder: string;
        style: TextInputStyle;
        required: boolean;
        minLength?: number;
        maxLength: number;
    }[];
};

function createModal(
    interaction: ChatInputCommandInteraction,
    modalData: Modal,
): {
    modal: ModalBuilder;
    filter(modalInteraction: ModalSubmitInteraction): boolean;
} {
    const inputs: TextInputBuilder[] = [];
    for (const field of modalData.fields) {
        const input = new TextInputBuilder()
            .setCustomId(field.id)
            .setLabel(field.label)
            .setPlaceholder(field.placeholder)
            .setStyle(field.style)
            .setRequired(field.required)
            .setMaxLength(field.maxLength);

        if (field.minLength) input.setMinLength(field.minLength);
        inputs.push(input);
    }

    const modal = new ModalBuilder()
        .setTitle(modalData.title)
        .setCustomId(modalData.id)
        .addComponents(inputs.map((input) => new ActionRowBuilder<TextInputBuilder>().addComponents(input)));

    const filter = (modalInteraction: ModalSubmitInteraction) =>
        modalInteraction.customId === modalData.id && modalInteraction.user.id === interaction.user.id;

    return {
        modal,
        filter,
    };
}

async function addItem(
    client: Bot,
    trade: Trade,
    userId: string,
    itemId: string,
    amount: number,
): Promise<{
    trade: Trade;
    error?: string;
}> {
    let item: Item | null = null;
    if (itemId !== 'money') {
        item = client.items.getById(itemId) ?? client.items.getByName(itemId);
        if (!item) {
            return {
                trade,
                error: 'Item ID or name not found.',
            };
        }

        const member = await getMember(userId);
        if (!member) {
            return {
                trade,
                error: 'I could not find the user...',
            };
        }

        const invItem = client.items.getInventoryItem(itemId, member);
        if (!invItem || invItem.amount < amount) {
            return {
                trade,
                error: `<@${userId}> doesn't have ${client.items.getItemString(item, amount)} in their inventory.`,
            };
        }
    }

    const userHasItem = trade.items.find((item) => item.userId === userId && item.itemId === itemId);

    // Update local trade object to do some checks
    if (userHasItem) {
        trade.items = trade.items.map((item) => {
            if (item.userId === userId && item.itemId === itemId) {
                return {
                    ...item,
                    quantity: item.quantity + amount,
                };
            }

            return item;
        });
    } else {
        trade.items.push({
            userId,
            itemId,
            quantity: amount,
        });
    }

    let totalWorth = 0;
    for (const tradeItem of trade.items) {
        if (tradeItem.quantity < 0) {
            return {
                trade,
                error: 'You cannot add a negative amount of items.',
            };
        }

        if (tradeItem.userId !== userId) continue;
        if (tradeItem.itemId === 'money') {
            totalWorth += tradeItem.quantity;
        } else {
            const item = client.items.getById(tradeItem.itemId);
            if (item) {
                totalWorth += (item.sellPrice ?? item.buyPrice ?? 0) * tradeItem.quantity;
            }
        }
    }

    if (totalWorth > 100_000) {
        return {
            trade,
            error: 'You can only trade items with a total worth of :coin: 100,000 or less.',
        };
    }

    let newTrade: Trade | null = null;
    if (userHasItem) {
        let fetchedTrade: Trade | null = null;
        if (userHasItem.quantity + amount < 1) {
            fetchedTrade = await TradeModel.findOneAndUpdate(
                { tradeId: trade.tradeId, status: TradeStatus.PENDING },
                { $pull: { items: { userId, itemId } } },
                { new: true },
            );
        } else {
            const storedTrade = await TradeModel.findOne({ tradeId: trade.tradeId, status: TradeStatus.PENDING });
            if (!storedTrade) {
                return {
                    trade,
                    error: 'Failed to add item to the trade. This trade has not been found.',
                };
            }

            const itemIndex = storedTrade.items.findIndex((item) => item.userId === userId && item.itemId === itemId);
            if (itemIndex === -1) {
                return {
                    trade,
                    error: 'Failed to add item to the trade. This item has not been found.',
                };
            }

            storedTrade.items[itemIndex]!.quantity += amount;

            await storedTrade.save();
            fetchedTrade = storedTrade;
        }

        newTrade = fetchedTrade;
    } else {
        if (amount < 1) {
            return {
                trade,
                error: 'You need to add at least one item.',
            };
        }

        const fetchedTrade = await TradeModel.findOneAndUpdate(
            { tradeId: trade.tradeId, status: TradeStatus.PENDING },
            {
                $push: {
                    items: {
                        userId,
                        itemId,
                        quantity: amount,
                    },
                },
            },
            { new: true },
        );

        newTrade = fetchedTrade;
    }

    if (!newTrade) {
        return {
            trade,
            error: 'Failed to add item to the trade. This trade has not been found.',
        };
    }

    return {
        trade: newTrade,
    };
}

function arrayToItemMap(tradeItems: TradeItem[]): Record<string, number> {
    const itemMap: Record<string, number> = {};
    for (const item of tradeItems) {
        if (!(item.itemId in itemMap)) {
            itemMap[item.itemId] = item.quantity;
        }
    }

    return itemMap;
}

function getMoney(trade: Trade, userId: string): number {
    return trade.items.find((item) => item.itemId === 'money' && item.userId === userId)?.quantity ?? 0;
}

function getItemsPerUser(client: Bot, trade: Trade, userId: string): TradeItem[] {
    return trade.items.filter(
        (item) =>
            item.userId === userId &&
            item.itemId !== 'money' &&
            item.quantity > 0 &&
            client.items.getById(item.itemId) !== null,
    );
}

async function giveItems(client: Bot, trade: Trade): Promise<void> {
    const memberUser = await Member.findOne({ id: trade.userId });
    if (!memberUser) return;

    const memberToUser = await Member.findOne({ id: trade.toUserId });
    if (!memberToUser) return;

    const totalMoneyUser = getMoney(trade, trade.toUserId);
    if (totalMoneyUser > 0) {
        await addMoney(trade.userId, totalMoneyUser);
        await removeMoney(trade.toUserId, totalMoneyUser);
    }

    const totalMoneyToUser = getMoney(trade, trade.userId);
    if (totalMoneyToUser > 0) {
        await addMoney(trade.toUserId, totalMoneyToUser);
        await removeMoney(trade.userId, totalMoneyToUser);
    }

    const itemsUser = getItemsPerUser(client, trade, trade.toUserId);
    await client.items.addItemBulk(arrayToItemMap(itemsUser), memberUser);

    const itemsToUser = getItemsPerUser(client, trade, trade.userId);
    await client.items.addItemBulk(arrayToItemMap(itemsToUser), memberToUser);

    await client.items.removeItemBulk(arrayToItemMap(itemsUser), memberToUser);
    await client.items.removeItemBulk(arrayToItemMap(itemsToUser), memberUser);
}

async function userHasAllItems(client: Bot, trade: Trade, userId: string): Promise<boolean> {
    const member = await getMember(userId);
    if (!member) return false;

    const tradeItems = trade.items.filter((item) => item.userId === userId);
    for (const tradeItem of tradeItems) {
        if (tradeItem.itemId === 'money') {
            if (tradeItem.quantity > member.wallet) return false;
        } else {
            const item = client.items.getInventoryItem(tradeItem.itemId, member);
            if (!item || item.amount < tradeItem.quantity) return false;
        }
    }

    return true;
}

function isValidTrade(
    client: Bot,
    trade: Trade,
): {
    isValid: boolean;
    error?: string;
} {
    if (trade.expiresAt.getTime() < Date.now()) {
        return {
            isValid: false,
            error: 'This trade has expired.',
        };
    }

    if (trade.status !== TradeStatus.PENDING && trade.status !== TradeStatus.WAITING_FOR_CONFIRMATION) {
        return {
            isValid: false,
            error: 'This trade is not open.',
        };
    }

    let totalWorthUser = 0;
    let totalWorthToUser = 0;
    let totalItems = 0;

    for (const tradeItem of trade.items) {
        if (tradeItem.quantity < 0) {
            return {
                isValid: false,
                error: 'You cannot add a negative amount of items.',
            };
        }

        if (tradeItem.itemId === 'money') {
            if (tradeItem.userId === trade.userId) {
                totalWorthUser += tradeItem.quantity;
            } else {
                totalWorthToUser += tradeItem.quantity;
            }
        } else {
            const item = client.items.getById(tradeItem.itemId);
            if (item) {
                totalItems += tradeItem.quantity;
                if (tradeItem.userId === trade.userId) {
                    totalWorthUser += (item.sellPrice ?? item.buyPrice ?? 0) * tradeItem.quantity;
                } else {
                    totalWorthToUser += (item.sellPrice ?? item.buyPrice ?? 0) * tradeItem.quantity;
                }
            }
        }
    }

    if (totalWorthUser > 100_000 || totalWorthToUser > 100_000) {
        return {
            isValid: false,
            error: 'You can only trade items with a total worth of :coin: 100,000 or less.',
        };
    } else if (totalWorthToUser <= 0 || totalWorthUser <= 0) {
        return {
            isValid: false,
            error: 'You need to add at least one item or money to the trade.',
        };
    } else if (totalItems <= 0) {
        return {
            isValid: false,
            error: 'You need to add at least one item to the trade. If you want to pay someone, use the `/pay` command.',
        };
    }

    const maximumDifference = totalWorthUser + totalWorthToUser > 50_000 ? 8000 : 4000;

    if (Math.max(totalWorthUser, totalWorthToUser) - Math.min(totalWorthUser, totalWorthToUser) > maximumDifference) {
        return {
            isValid: false,
            error: `The total worth of the trade is too unbalanced. The difference between the worths can be at most :coin: ${maximumDifference}.`,
        };
    }

    return {
        isValid: true,
    };
}

export default async function view(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const tradeId = interaction.options.getString('trade-id', true);

    const fetchedTrade = await TradeModel.findOne({ tradeId });
    if (!fetchedTrade) {
        await interaction.reply({ content: 'Trade not found.' });
        return;
    } else if (fetchedTrade.userId !== member.id && fetchedTrade.toUserId !== member.id) {
        await interaction.reply({ content: 'You are not part of this trade.' });
        return;
    }

    let trade: Trade = fetchedTrade;
    trade = await updateTrade(trade);
    const message = await interaction.reply({
        embeds: [await createEmbed(client, trade)],
        components: createButtons(trade),
        fetchReply: true,
    });

    const filter = (i: ButtonInteraction) => i.user.id === trade.userId || i.user.id === trade.toUserId;
    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(i),
        max: 20,
        idle: 25_000,
        time: 180_000,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i) => {
        if (i.customId.startsWith('toUser_trade_view_') && i.user.id !== trade.toUserId) {
            await i.deferUpdate();
            await i.followUp({ content: 'The other user needs to accept this trade.', ephemeral: true });
            return;
        } else if (!i.customId.startsWith('toUser_trade_view_') && i.user.id !== trade.userId) {
            await i.deferUpdate();
            await i.followUp({ content: 'Only the trade creator can use this feature.', ephemeral: true });
            return;
        }

        if (i.customId === 'trade_view_addItem') {
            if (trade.status !== TradeStatus.PENDING) {
                await i.deferUpdate();
                await i.followUp({ content: 'This trade is not pending.', ephemeral: true });
                return;
            }

            const modalData: Modal = {
                id: `trade_view_addItem-${interaction.user.id}`,
                title: 'Add Item',
                fields: [
                    {
                        id: 'item-id',
                        label: 'Item ID or Name',
                        placeholder: 'Enter the item ID or name',
                        style: TextInputStyle.Short,
                        required: true,
                        maxLength: 50,
                    },
                    {
                        id: 'amount',
                        label: 'Amount (Use negative amount to remove items)',
                        placeholder: 'Enter the amount (default: 1)',
                        style: TextInputStyle.Short,
                        required: false,
                        maxLength: 6,
                    },
                ],
            };

            const { modal, filter } = createModal(interaction, modalData);
            await i.showModal(modal);

            try {
                const modalInteraction = await i.awaitModalSubmit({ filter, time: 60_000 });

                const itemId = modalInteraction.fields.getTextInputValue('item-id');
                const amount = modalInteraction.fields.getTextInputValue('amount') ?? '1';
                let amountInt;

                try {
                    amountInt = amount.length === 0 ? 1 : Number.parseInt(amount, 10);
                    if (Number.isNaN(amountInt)) {
                        await modalInteraction.reply({
                            content: 'The amount must be a number.',
                            ephemeral: true,
                        });
                        return;
                    }
                } catch {
                    await modalInteraction.reply({
                        content: 'The amount must be a number.',
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    const { trade: addItemTrade, error } = await addItem(
                        client,
                        trade,
                        trade.userId,
                        itemId,
                        amountInt,
                    );

                    if (error) {
                        await modalInteraction.reply({
                            content: error,
                            ephemeral: true,
                        });
                        return;
                    }

                    trade = addItemTrade;
                    await modalInteraction.deferUpdate();
                } catch (error) {
                    await modalInteraction.reply({
                        content: (error as Error).message,
                        ephemeral: true,
                    });
                    return;
                }
            } catch (error) {
                if ((error as Error).name.includes('InteractionCollectorError')) return;
                throw error;
            }
        } else if (i.customId === 'trade_view_addItemToUser') {
            if (trade.status !== TradeStatus.PENDING) {
                await i.deferUpdate();
                await i.followUp({ content: 'This trade is not pending.', ephemeral: true });
                return;
            }

            const modalData: Modal = {
                id: `trade_view_addItemToUser-${interaction.user.id}`,
                title: 'Add Item (Other user)',
                fields: [
                    {
                        id: 'item-id',
                        label: 'Item ID or Name',
                        placeholder: 'Enter the item ID or name',
                        style: TextInputStyle.Short,
                        required: true,
                        maxLength: 50,
                    },
                    {
                        id: 'amount',
                        label: 'Amount (Use negative amount to remove items)',
                        placeholder: 'Enter the amount (default: 1)',
                        style: TextInputStyle.Short,
                        required: false,
                        maxLength: 6,
                    },
                ],
            };

            const { modal, filter } = createModal(interaction, modalData);
            await i.showModal(modal);

            try {
                const modalInteraction = await i.awaitModalSubmit({ filter, time: 60_000 });

                const itemId = modalInteraction.fields.getTextInputValue('item-id');
                const amount = modalInteraction.fields.getTextInputValue('amount') ?? '1';
                let amountInt;

                try {
                    amountInt = amount.length === 0 ? 1 : Number.parseInt(amount, 10);
                    if (Number.isNaN(amountInt)) {
                        await modalInteraction.reply({
                            content: 'The amount must be a number.',
                            ephemeral: true,
                        });
                        return;
                    }
                } catch {
                    await modalInteraction.reply({
                        content: 'The amount must be a number.',
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    const { trade: addItemTrade, error } = await addItem(
                        client,
                        trade,
                        trade.toUserId,
                        itemId,
                        amountInt,
                    );

                    if (error) {
                        await modalInteraction.reply({
                            content: error,
                            ephemeral: true,
                        });
                        return;
                    }

                    trade = addItemTrade;
                    await modalInteraction.deferUpdate();
                } catch (error) {
                    await modalInteraction.reply({
                        content: (error as Error).message,
                        ephemeral: true,
                    });
                    return;
                }
            } catch (error) {
                if ((error as Error).name.includes('InteractionCollectorError')) return;
                throw error;
            }
        } else if (i.customId === 'trade_view_addMoney') {
            if (trade.status !== TradeStatus.PENDING) {
                await i.deferUpdate();
                await i.followUp({ content: 'This trade is not pending.', ephemeral: true });
                return;
            }

            const modalData: Modal = {
                id: `trade_view_addMoney-${interaction.user.id}`,
                title: 'Add Money',
                fields: [
                    {
                        id: 'amount',
                        label: 'Amount (Use negative amount to remove money)',
                        placeholder: 'Enter the amount of money',
                        style: TextInputStyle.Short,
                        required: true,
                        maxLength: 6,
                    },
                ],
            };

            const { modal, filter } = createModal(interaction, modalData);
            await i.showModal(modal);

            try {
                const modalInteraction = await i.awaitModalSubmit({ filter, time: 60_000 });
                const amount = modalInteraction.fields.getTextInputValue('amount');

                try {
                    if (Number.isNaN(Number.parseInt(amount, 10))) {
                        await modalInteraction.reply({
                            content: 'The amount must be a number.',
                            ephemeral: true,
                        });
                        return;
                    }
                } catch {
                    await modalInteraction.reply({
                        content: 'The amount must be a number.',
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    const { trade: addItemTrade, error } = await addItem(
                        client,
                        trade,
                        trade.userId,
                        'money',
                        Number.parseInt(amount, 10),
                    );

                    if (error) {
                        await modalInteraction.reply({
                            content: error,
                            ephemeral: true,
                        });
                        return;
                    }

                    trade = addItemTrade;
                    await modalInteraction.deferUpdate();
                } catch (error) {
                    await modalInteraction.reply({
                        content: (error as Error).message,
                        ephemeral: true,
                    });
                    return;
                }
            } catch (error) {
                if ((error as Error).name.includes('InteractionCollectorError')) return;
                throw error;
            }
        } else if (i.customId === 'trade_view_addMoneyToUser') {
            if (trade.status !== TradeStatus.PENDING) {
                await i.deferUpdate();
                await i.followUp({ content: 'This trade is not pending.', ephemeral: true });
                return;
            }

            const modalData: Modal = {
                id: `trade_view_addMoneyToUser-${interaction.user.id}`,
                title: 'Add Money (Other user)',
                fields: [
                    {
                        id: 'amount',
                        label: 'Amount (Use negative amount to remove money)',
                        placeholder: 'Enter the amount of money',
                        style: TextInputStyle.Short,
                        required: true,
                        maxLength: 6,
                    },
                ],
            };

            const { modal, filter } = createModal(interaction, modalData);
            await i.showModal(modal);

            try {
                const modalInteraction = await i.awaitModalSubmit({ filter, time: 60_000 });
                const amount = modalInteraction.fields.getTextInputValue('amount');

                try {
                    if (Number.isNaN(Number.parseInt(amount, 10))) {
                        await modalInteraction.reply({
                            content: 'The amount must be a number.',
                            ephemeral: true,
                        });
                        return;
                    }
                } catch {
                    await modalInteraction.reply({
                        content: 'The amount must be a number.',
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    const { trade: addItemTrade, error } = await addItem(
                        client,
                        trade,
                        trade.toUserId,
                        'money',
                        Number.parseInt(amount, 10),
                    );

                    if (error) {
                        await modalInteraction.reply({
                            content: error,
                            ephemeral: true,
                        });
                        return;
                    }

                    trade = addItemTrade;
                    await modalInteraction.deferUpdate();
                } catch (error) {
                    await modalInteraction.reply({
                        content: (error as Error).message,
                        ephemeral: true,
                    });
                    return;
                }
            } catch (error) {
                if ((error as Error).name.includes('InteractionCollectorError')) return;
                throw error;
            }
        } else if (i.customId === 'trade_view_confirmTrade') {
            await i.deferUpdate();
            trade = await updateTrade(trade);
            if (trade.status !== TradeStatus.PENDING) {
                await i.followUp({ content: 'This trade is not pending.', ephemeral: true });
                return;
            }

            const { isValid, error } = isValidTrade(client, trade);
            if (!isValid) {
                await i.followUp({ content: error, ephemeral: true });
                return;
            }

            const newTrade = await TradeModel.findOneAndUpdate(
                { tradeId: trade.tradeId, status: TradeStatus.PENDING },
                { $set: { status: TradeStatus.WAITING_FOR_CONFIRMATION } },
                { new: true },
            );

            if (!newTrade) {
                await i.followUp({ content: 'Failed to confirm the trade.', ephemeral: true });
                return;
            }

            trade = newTrade;
            await i.followUp({
                content: 'Trade confirmed. The other user has to accept the trade now.',
            });
        } else if (i.customId === 'trade_view_deleteTrade') {
            await i.deferUpdate();
            if (trade.status !== TradeStatus.PENDING && trade.status !== TradeStatus.WAITING_FOR_CONFIRMATION) {
                await i.followUp({ content: 'This trade is not open.', ephemeral: true });
                return;
            }

            collector.stop();
            await TradeModel.deleteOne({ tradeId: trade.tradeId });
            await interaction.editReply({
                content: 'The trade has been deleted.',
                components: [],
            });
            return;
        } else if (i.customId === 'toUser_trade_view_accept') {
            await i.deferUpdate();
            if (trade.status !== TradeStatus.WAITING_FOR_CONFIRMATION) {
                await i.followUp({ content: 'This trade is not waiting for confirmation.', ephemeral: true });
                return;
            }

            const { isValid, error } = isValidTrade(client, trade);
            if (!isValid) {
                await i.followUp({ content: error, ephemeral: true });
                return;
            }

            const tradeUserHasItems = await userHasAllItems(client, trade, trade.userId);
            if (!tradeUserHasItems) {
                await i.followUp({
                    content: `<@${trade.toUserId}> doesn't have the required items to trade in their inventory.`,
                    ephemeral: true,
                });
                return;
            }

            const tradeToUserHasItems = await userHasAllItems(client, trade, trade.toUserId);
            if (!tradeToUserHasItems) {
                await i.followUp({
                    content: "You don't have the required items to trade in your inventory.",
                    ephemeral: true,
                });
                return;
            }

            collector.stop();
            const newTrade = await TradeModel.findOneAndUpdate(
                { tradeId: trade.tradeId, status: TradeStatus.WAITING_FOR_CONFIRMATION },
                { $set: { status: TradeStatus.COMPLETED } },
                { new: true },
            );

            if (!newTrade) {
                await i.followUp({ content: 'Something went wrong with accepting this trade.', ephemeral: true });
                return;
            }

            trade = newTrade;
            await i.followUp({
                content: 'This trade has been accepted. The items have been traded.',
            });

            await giveItems(client, trade);
        } else if (i.customId === 'toUser_trade_view_cancel') {
            await i.deferUpdate();
            if (trade.status !== TradeStatus.WAITING_FOR_CONFIRMATION) {
                await i.followUp({ content: 'This trade is not waiting for confirmation.', ephemeral: true });
                return;
            }

            collector.stop();
            const newTrade = await TradeModel.findOneAndUpdate(
                { tradeId: trade.tradeId, status: TradeStatus.WAITING_FOR_CONFIRMATION },
                { $set: { status: TradeStatus.DENIED } },
                { new: true },
            );

            if (!newTrade) {
                await i.followUp({ content: 'Something went wrong with canceling this trade.', ephemeral: true });
                return;
            }

            trade = newTrade;
            await i.followUp({
                content: 'This trade has been canceled.',
            });
        }

        await interaction.editReply({
            embeds: [await createEmbed(client, trade)],
            components: createButtons(trade),
        });
    });

    collector.on('end', async () => {
        await interaction.editReply({
            components: createButtons(trade, true),
        });
    });
}
