import { EmbedBuilder, type ChatInputCommandInteraction, type ColorResolvable, ComponentType } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { type BusinessData, MarketStatus, type InventoryItem } from '../../../lib/types';
import type { IMarket } from '../../../models/market';
import Market from '../../../models/market';
import { filter } from '../../../utils';
import type { FactoryItem } from '../../../utils/business';
import { calculatePageNumber, getPageButtons } from '../../../utils/embed';

const ItemsPerPage = 8;

function createEmbed(
    client: Bot,
    item: FactoryItem | undefined,
    list: IMarket[],
    inventoryItem: InventoryItem | undefined,
    page: number,
    maxPage: number,
): EmbedBuilder {
    const itemsOnPage = list.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
    const listItems: string[] = [];

    for (const marketItem of itemsOnPage) {
        listItems.push(
            `(ID: \`${marketItem.listingId}\`) ― ${marketItem.quantity}x sold by \`${marketItem.businessName}\`\n> **Unit Price:** :coin: ${marketItem.pricePerUnit} | **Total Price:** :coin: ${marketItem.pricePerUnit * marketItem.quantity}`,
        );
    }

    const embed = new EmbedBuilder()
        .setTitle(`Global market${item ? ` for ${client.business.getItemString(item)}` : ''}`)
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(':moneybag: **To buy a listing, use** `/market buy <listing-id>`')
        .setFooter({ text: `Page ${page + 1}/${maxPage}` });

    if (item && inventoryItem) {
        embed.addFields([
            {
                name: 'Information',
                value: `:package: ${client.business.getItemString(item)} (\`${item.itemId}\`)\n:pouch: **Your business owns** ${client.business.getItemString(item, inventoryItem.amount)}`,
                inline: false,
            },
        ]);
    }

    embed.addFields([
        {
            name: 'Listings',
            value: listItems.length > 0 ? listItems.join('\n\n') : 'No listings were found.',
            inline: false,
        },
    ]);

    return embed;
}

export default async function list(client: Bot, interaction: ChatInputCommandInteraction, data: BusinessData) {
    const itemIdOrName = interaction.options.getString('item', false);

    let item: FactoryItem | undefined;
    let inventoryItem: InventoryItem | undefined;
    let listedItems: IMarket[] = [];
    if (itemIdOrName) {
        item = client.business.getById(itemIdOrName) ?? client.business.getByName(itemIdOrName);

        if (!item) {
            await interaction.reply({
                content: `Item \`${itemIdOrName.toLowerCase()}\` doesn't exist.`,
                ephemeral: true,
            });
            return;
        }

        inventoryItem = client.business.getInventoryItem(item.itemId, data.business.inventory);
        listedItems = await Market.find({ itemId: item.itemId, status: MarketStatus.Listed })
            .sort({
                updatedAt: 1,
            })
            .limit(ItemsPerPage * 12);
    } else {
        listedItems = await Market.find({ status: MarketStatus.Listed })
            .sort({ updatedAt: 1 })
            .limit(ItemsPerPage * 12);
    }

    let page = 0;
    const maxPage = Math.ceil(listedItems.length / ItemsPerPage);

    const message = await interaction.reply({
        embeds: [createEmbed(client, item, listedItems, inventoryItem, page, maxPage)],
        components: [...getPageButtons(page, maxPage)],
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        max: 25,
        idle: 25_000,
        time: 120_000,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i) => {
        page = calculatePageNumber(i.customId, page, maxPage);
        await i.update({
            embeds: [createEmbed(client, item, listedItems, inventoryItem, page, maxPage)],
            components: [...getPageButtons(page, maxPage)],
        });
    });

    collector.on('end', async () => {
        await interaction.editReply({
            components: [...getPageButtons(page, maxPage, true)],
        });
    });
}
