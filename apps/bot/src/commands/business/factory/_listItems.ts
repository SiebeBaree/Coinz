import { EmbedBuilder, ComponentType } from 'discord.js';
import type { ColorResolvable, ChatInputCommandInteraction } from 'discord.js';
import type Bot from '../../../domain/Bot';
import type { BusinessData } from '../../../lib/types';
import { filter, msToTime } from '../../../utils';
import type { FactoryItem } from '../../../utils/business';
import { calculatePageNumber, getPageButtons } from '../../../utils/embed';

const ITEMS_PER_PAGE = 5;

function createEmbed(client: Bot, items: FactoryItem[], data: BusinessData, page: number, maxPage: number) {
    const itemsOnPage = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
    const description: string[] = [];

    for (const item of itemsOnPage) {
        const stock = client.business.getInventoryItem(item.itemId, data.business.inventory);
        const requirementsList: string[] = [];

        if (item.requirements) {
            for (const requirement of item.requirements) {
                const reqItem = client.business.getById(requirement.itemId);
                if (!reqItem) continue;
                requirementsList.push(client.business.getItemString(reqItem, requirement.amount));
            }
        }

        description.push(
            `${client.business.getItemString(item)}${stock ? ` (Stock: ${stock.amount})` : ''}\n` +
                (item.producable
                    ? `> Normal Sell Price: :coin: ${item.price}\n> Produces ${item.amount} <:${item.itemId}:${item.emoteId}> every ${msToTime(item.duration * 1000)}\n> Requirements: ${requirementsList.length > 0 ? requirementsList.join(', ') : 'No Requirements'}`
                    : `> Buy Price: :coin: ${item.price}`),
        );
    }

    return new EmbedBuilder()
        .setTitle(`Factory Products`)
        .setDescription(description.length === 0 ? 'No items found.' : description.join('\n\n'))
        .setColor(client.config.embed.color as ColorResolvable)
        .setFooter({ text: `Use /shop info [item-id] to get more info ─ Page ${page + 1}/${maxPage}` });
}

export default async function listItems(
    client: Bot,
    interaction: ChatInputCommandInteraction,
    data: BusinessData,
): Promise<void> {
    let page = 0;
    const ItemsPerPage = 7;

    const items = Array.from(client.business.items)
        .map(([_, value]) => value)
        .sort((a, b) => Number(a.producable) - Number(b.producable));
    const maxPage = Math.ceil(items.length / ItemsPerPage);

    const message = await interaction.followUp({
        embeds: [createEmbed(client, items, data, page, maxPage)],
        components: getPageButtons(page, maxPage),
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        max: 10,
        idle: 15_000,
        time: 60_000,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i) => {
        page = calculatePageNumber(i.customId, page, maxPage);

        await i.update({
            embeds: [createEmbed(client, items, data, page, maxPage)],
            components: getPageButtons(page, maxPage),
        });
    });

    collector.on('end', async () => {
        await message.edit({
            components: getPageButtons(page, maxPage, true),
        });
    });
}
