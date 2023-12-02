import type { ColorResolvable, User } from 'discord.js';
import { ApplicationCommandOptionType, ComponentType, EmbedBuilder } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';
import type { InventoryItem } from '../../lib/types';
import { calculatePageNumber, getPageButtons, getSelectMenu } from '../../utils/embed';

function getEmbed(
    client: Bot,
    user: User,
    items: InventoryItem[],
    page: number,
    maxPage: number,
    ItemsPerPage: number,
): EmbedBuilder {
    const itemsOnPage = items.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
    const descItems = [];

    for (const invItem of itemsOnPage) {
        const item = client.items.getById(invItem.itemId);
        if (!item) continue;
        descItems.push(
            `<:${invItem.itemId}:${item.emoteId}> **${item.name}** ― ${invItem.amount}\n**ID:** \`${invItem.itemId}\``,
        );
    }

    const desc = descItems.join('\n\n');

    return new EmbedBuilder()
        .setAuthor({ name: `${user.username}'s inventory`, iconURL: user.displayAvatarURL() })
        .setDescription(itemsOnPage.length > 0 ? desc : 'No items were found.')
        .setFooter({ text: `Use /shop info [item-id] to view more info about an item. ─ Page ${page + 1}/${maxPage}` })
        .setColor(client.config.embed.color as ColorResolvable);
}

function getItemsByCategory(client: Bot, inventory: InventoryItem[], category: string) {
    if (category === 'all') return inventory;
    return inventory.filter((item) => client.items.getById(item.itemId)?.category === category);
}

export default {
    data: {
        name: 'inventory',
        description: "View your or another user's inventory.",
        category: 'general',
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the inventory of another user.',
                required: false,
            },
        ],
        usage: ['[user]'],
    },
    async execute(client, interaction, member) {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const memberData = user.id === interaction.user.id ? member : await getMember(user.id);

        if (memberData.inventory.length === 0) {
            await interaction.reply({
                content: `${
                    user.id === interaction.user.id ? "You don't" : `${user.username} doesn't`
                } have any items in ${user.id === interaction.user.id ? 'your' : 'their'} inventory.`,
            });
            return;
        }

        const options = client.items.getCategories();
        const ItemsPerPage = 7;
        let defaultLabel = options[options.length - 1]?.value ?? 'all';
        let items = getItemsByCategory(client, memberData.inventory, defaultLabel);
        let page = 0;
        let maxPage = Math.ceil(items.length / ItemsPerPage);

        const message = await interaction.reply({
            embeds: [getEmbed(client, user, items, page, maxPage, ItemsPerPage)],
            components: [
                ...getPageButtons(page, maxPage),
                ...getSelectMenu(options, 'inventory_selectCategory', defaultLabel),
            ],
        });

        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            max: 20,
            idle: 20_000,
            time: 90_000,
        });

        collector.on('collect', async (i) => {
            if (i.componentType === ComponentType.Button) {
                page = calculatePageNumber(i.customId, page, maxPage);
            } else if (i.componentType === ComponentType.StringSelect) {
                defaultLabel = i.values[0] ?? 'all';
                items = getItemsByCategory(client, memberData.inventory, defaultLabel);
                page = 0;
                maxPage = Math.ceil(items.length / ItemsPerPage);
            }

            await i.update({
                embeds: [getEmbed(client, user, items, page, maxPage, ItemsPerPage)],
                components: [
                    ...getPageButtons(page, maxPage),
                    ...getSelectMenu(options, 'inventory_selectCategory', defaultLabel),
                ],
            });
        });

        collector.on('end', async () => {
            await interaction.editReply({
                components: [
                    ...getPageButtons(page, maxPage),
                    ...getSelectMenu(options, 'inventory_selectCategory', defaultLabel),
                ],
            });
        });
    },
} satisfies Command;
