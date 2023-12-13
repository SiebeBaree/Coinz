import type { ChatInputCommandInteraction, ColorResolvable } from 'discord.js';
import { ApplicationCommandOptionType, ComponentType, EmbedBuilder } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import type { Item } from '../../models/item';
import type { IMember } from '../../models/member';
import UserStats from '../../models/userStats';
import { filter } from '../../utils';
import { calculatePageNumber, getPageButtons, getSelectMenu } from '../../utils/embed';
import { addMoney, removeMoney } from '../../utils/money';

async function getInfo(client: Bot, interaction: ChatInputCommandInteraction) {
    const itemId = interaction.options.getString('item-id')?.toLowerCase();

    if (itemId) {
        const item = client.items.getById(itemId) ?? client.items.getByName(itemId);

        if (!item) {
            await interaction.reply({
                content: `Item \`${itemId.toLowerCase()}\` doesn't exist. Use \`/shop info\` for a list of all items.`,
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(item.name)
            .setDescription('>>> ' + (item.longDescription ?? item.description))
            .setColor(client.config.embed.color as ColorResolvable)
            .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoteId}.png`)
            .addFields([
                {
                    name: 'Price',
                    value: `**BUY:** ${item.buyPrice ? `:coin: ${item.buyPrice}` : '**Not For Sale**'}\n**SELL:** ${
                        item.sellPrice ? `:coin: ${item.sellPrice}` : 'Not sellable'
                    }`,
                    inline: true,
                },
                {
                    name: 'Item Info',
                    value: `**Category:** \`${item.category}\`\n**Item ID:** \`${item.itemId}\``,
                    inline: true,
                },
            ]);
        await interaction.reply({ embeds: [embed] });
    } else {
        let page = 0;
        const ItemsPerPage = 7;

        const options = client.items.getCategories();
        let defaultLabel = options[0]?.value;
        let items = client.items.getAllByCategory(defaultLabel);
        let maxPages = Math.ceil(items.length / ItemsPerPage);

        const getEmbed = (categoryItems: Item[]) => {
            const itemsOnPage = categoryItems.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
            const description = itemsOnPage
                .map(
                    (item) =>
                        `<:${item.itemId}:${item.emoteId}> **${item.name}** (\`${item.itemId}\`) ― ${
                            item.buyPrice ? `:coin: ${item.buyPrice}` : '**Not for sale**'
                        }\n> ${item.description}`,
                )
                .join('\n\n');

            return new EmbedBuilder()
                .setTitle(`Shop`)
                .setDescription(itemsOnPage.length === 0 ? 'No items found.' : description)
                .setColor(client.config.embed.color as ColorResolvable)
                .setFooter({ text: `Use /shop info [item-id] to get more info ─ Page ${page + 1}/${maxPages}` });
        };

        const message = await interaction.reply({
            embeds: [getEmbed(items)],
            components: [
                ...getPageButtons(page, maxPages),
                ...getSelectMenu(options, 'shop_selectCategory', defaultLabel),
            ],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            max: 20,
            idle: 20_000,
            time: 90_000,
        });

        collector.on('collect', async (i) => {
            if (i.componentType === ComponentType.Button) {
                page = calculatePageNumber(i.customId, page, maxPages);
            } else if (i.componentType === ComponentType.StringSelect && i.customId === 'shop_selectCategory') {
                defaultLabel = i.values[0];
                items = client.items.getAllByCategory(defaultLabel);
                page = 0;
                maxPages = Math.ceil(items.length / ItemsPerPage);
            }

            await i.update({
                embeds: [getEmbed(items)],
                components: [
                    ...getPageButtons(page, maxPages),
                    ...getSelectMenu(options, 'shop_selectCategory', defaultLabel),
                ],
            });
        });

        collector.on('end', async () => {
            await interaction.editReply({
                components: [
                    ...getPageButtons(page, maxPages, true),
                    ...getSelectMenu(options, 'shop_selectCategory', defaultLabel, true),
                ],
            });
        });
    }
}

async function getBuy(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const itemId = interaction.options.getString('item-id', true)?.toLowerCase();
    const amount = interaction.options.getInteger('amount') ?? 1;

    const item = client.items.getById(itemId) ?? client.items.getByName(itemId);

    if (!item) {
        await interaction.reply({
            content: `Item \`${itemId.toLowerCase()}\` doesn't exist. Use \`/shop info\` for a list of all items.`,
            ephemeral: true,
        });
        return;
    } else if (!item.buyPrice) {
        await interaction.reply({
            content: `Item ${client.items.getItemString(item)} is not for sale.`,
            ephemeral: true,
        });
        return;
    }

    const totalPrice = Math.ceil(item.buyPrice * amount);

    if (member.wallet < totalPrice) {
        await interaction.reply({
            content: `You don't have enough money in your wallet to buy ${client.items.getItemString(item, amount)}.`,
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
        content: `You bought ${client.items.getItemString(item, amount)} for :coin: ${totalPrice}.`,
    });
    await removeMoney(member.id, totalPrice);
    await client.items.addItem(item.itemId, member, amount);
    await UserStats.updateOne(
        { id: member.id },
        {
            $inc: { itemsBought: amount },
        },
        { upsert: true },
    );
}

async function getSell(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const itemId = interaction.options.getString('item-id', true)?.toLowerCase();
    const amount = interaction.options.getInteger('amount') ?? 1;

    const item = client.items.getById(itemId) ?? client.items.getByName(itemId);

    if (!item) {
        await interaction.reply({
            content: `Item \`${itemId.toLowerCase()}\` doesn't exist. Use \`/shop info\` for a list of all items.`,
            ephemeral: true,
        });
        return;
    } else if (!item.sellPrice) {
        await interaction.reply({
            content: `Item ${client.items.getItemString(item)} is not sellable.`,
            ephemeral: true,
        });
        return;
    }

    const totalPrice = Math.ceil(item.sellPrice * amount);
    const inventoryItem = client.items.getInventoryItem(item.itemId, member);

    if (!inventoryItem || inventoryItem.amount < amount) {
        await interaction.reply({
            content: `You don't have ${client.items.getItemString(item, amount)} in your inventory.`,
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
        content: `You sold ${client.items.getItemString(item, amount)} for :coin: ${totalPrice}.`,
    });
    await client.items.removeItem(item.itemId, member, amount);
    await addMoney(member.id, totalPrice);
    await UserStats.updateOne(
        { id: member.id },
        {
            $inc: { itemsSold: amount },
        },
        { upsert: true },
    );
}

export default {
    data: {
        name: 'shop',
        description: 'Buy, sell or view items in the shop.',
        category: 'general',
        options: [
            {
                name: 'info',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'View information about an item or get a list of all items',
                options: [
                    {
                        name: 'item',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of ID of the item you want to view',
                        required: false,
                    },
                ],
            },
            {
                name: 'buy',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy an item from the shop',
                options: [
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of ID of the item you want to buy',
                        required: true,
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The amount of the item you want to buy',
                        required: false,
                        min_value: 1,
                        max_value: 2_000,
                    },
                ],
            },
            {
                name: 'sell',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Sell an item from your inventory',
                options: [
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of ID of the item you want to sell',
                        required: true,
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The amount of the item you want to sell',
                        required: false,
                        min_value: 1,
                        max_value: 2_000,
                    },
                ],
            },
        ],
        usage: ['info [item]', 'buy <item-id> [amount]', 'sell <item-id> [amount]'],
    },
    async execute(client, interaction, member) {
        switch (interaction.options.getSubcommand()) {
            case 'info':
                await getInfo(client, interaction);
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
