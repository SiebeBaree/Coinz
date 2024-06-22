import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import type { ColorResolvable, ChatInputCommandInteraction } from 'discord.js';
import type Bot from '../../../domain/Bot';
import type { Command } from '../../../domain/Command';
import { Positions, type BusinessData, type InventoryItem } from '../../../lib/types';
import Business, { type IFactory } from '../../../models/business';
import { filter, getBusiness } from '../../../utils';
import levelUp from './_levelUp';
import listItems from './_listItems';
import startProduction from './_startProduction';

const DESTROYED_DELAY = 60 * 60 * 24 * 2; // 2 days

function createComponents(data: BusinessData, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    const disableCollect = !data.business.factories.some((f) => f.status === 'ready' || f.status === 'destroyed');
    const disableBuyFactory =
        data.business.factories.length >= maximumFactories(data) ||
        data.business.balance < getFactoryCost(data.business.factories.length + 1);
    const disableLevelUp =
        data.business.factories.every((f) => f.level >= 5) ||
        data.business.employees.some((e) => e.position < Positions.Manager && e.userId === data.employee.userId);
    const disableStartProduction =
        data.business.factories.every((f) => f.status !== 'standby') ||
        data.business.employees.some((e) => e.position < Positions.Manager && e.userId === data.employee.userId);

    components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('factory_collect_products')
                .setLabel('Collect Products')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disableCollect || disabled),
            new ButtonBuilder()
                .setCustomId('factory_buy_factory')
                .setLabel('Buy New Factory')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disableBuyFactory || disabled),
            new ButtonBuilder()
                .setCustomId('factory_list_items')
                .setLabel('List Items')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
        ),
    );

    if (data.business.employees.some((e) => e.position >= Positions.Manager && e.userId === data.employee.userId)) {
        components.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('factory_start_production')
                    .setLabel('Start Production')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disableStartProduction || disabled),
                new ButtonBuilder()
                    .setCustomId('factory_level_up')
                    .setLabel('Level Up')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disableLevelUp || disabled),
            ),
        );
    }

    return components;
}

async function createEmbed(client: Bot, data: BusinessData): Promise<EmbedBuilder> {
    const now = Math.floor(Date.now() / 1000);

    const buyFactoryDescription =
        data.business.factories.length >= maximumFactories(data) ||
        data.business.balance < getFactoryCost(data.business.factories.length + 1)
            ? `\n:moneybag: **You can buy a new factory for :coin: ${getFactoryCost(data.business.factories.length + 1)}.**`
            : '';

    const embed = new EmbedBuilder()
        .setTitle(`${data.business.name}'s Factory`)
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            ':package: **You can clear destoryed products by collecting all products.**\n' +
                `:wrench: **All produced products are stored in your inventory** \`/business info\`**.**${buyFactoryDescription}`,
        );

    if (data.business.factories.length === 0) {
        embed.setFields([{ name: 'No Factories', value: 'You do not own any factories yet.' }]);
        return embed;
    }

    const bulkOps = [];
    for (const factory of data.business.factories) {
        let hasChanged = false;
        let icon = ':black_large_square:';
        let status = 'Shutdown';

        if (factory.status !== 'standby' && factory.status !== 'destroyed') {
            if (factory.produceOn + DESTROYED_DELAY < now) {
                factory.status = 'destroyed';
                hasChanged = true;
            } else if (factory.produceOn < now && factory.status !== 'ready') {
                factory.status = 'ready';
                hasChanged = true;
            }
        }

        const item = client.business.getById(factory.production);
        if (!item?.producable) {
            factory.status = 'standby';
            hasChanged = true;
        } else if (factory.status === 'producing') {
            icon = ':gear:';
            status = `<:${item.itemId}:${item.emoteId}> <t:${factory.produceOn}:R>`;
        } else if (factory.status === 'ready') {
            icon = `<:${item.itemId}:${item.emoteId}>`;
            status = `<:${item.itemId}:${item.emoteId}> ready to collect`;
        } else if (factory.status === 'destroyed') {
            icon = ':package:';
            status = 'Product is destroyed';
        }

        embed.addFields({
            name: `Factory Level ${factory.level} (ID: ${factory.factoryId + 1})`,
            value: `${getVisualRow(icon)}\n${status}`,
            inline: true,
        });

        if (hasChanged) {
            bulkOps.push({
                updateOne: {
                    filter: { name: data.business.name, 'factories.factoryId': factory.factoryId },
                    update: { $set: { 'factories.$.status': factory.status } },
                },
            });
        }
    }

    if (bulkOps.length > 0) {
        await Business.bulkWrite(bulkOps);
    }

    return embed;
}

function maximumFactories(data: BusinessData): number {
    return Math.min(data.business.employees.length * 2, 12);
}

function getFactoryCost(totalFactories: number): number {
    return 4000 * (totalFactories + 1);
}

function getVisualRow(icon: string): string {
    return icon.repeat(6);
}

async function pressButton_CollectProducts(client: Bot, data: BusinessData): Promise<void> {
    const items: InventoryItem[] = [];
    const bulkOps = [];
    for (const factory of data.business.factories) {
        if (factory.status === 'ready') {
            const item = client.business.getById(factory.production);
            if (!item) continue;

            if (items.some((i) => i.itemId === item.itemId)) {
                const index = items.findIndex((i) => i.itemId === item.itemId);
                if (index !== -1) items[index]!.amount += item.amount;
            } else {
                items.push({ itemId: item.itemId, amount: item.amount });
            }
        }

        if (factory.status === 'ready' || factory.status === 'destroyed') {
            bulkOps.push({
                updateOne: {
                    filter: { name: data.business.name, 'factories.factoryId': factory.factoryId },
                    update: {
                        $set: { 'factories.$.status': 'standby', 'factories.$.production': '' },
                    },
                },
            });
        }
    }

    for (const item of items) {
        if (data.business.inventory.some((i) => i.itemId === item.itemId)) {
            bulkOps.push({
                updateOne: {
                    filter: { name: data.business.name },
                    update: { $inc: { 'inventory.$.amount': item.amount } },
                },
            });
        } else {
            bulkOps.push({
                updateOne: {
                    filter: { name: data.business.name },
                    update: { $push: { inventory: { itemId: item.itemId, amount: item.amount } } },
                },
            });
        }
    }

    if (bulkOps.length > 0) {
        await Business.bulkWrite(bulkOps);
    }
}

async function pressButton_BuyFactory(data: BusinessData): Promise<boolean> {
    const factoryId = data.business.factories.length;
    const cost = getFactoryCost(factoryId + 1);
    if (data.business.balance < cost) return false;

    const factory: IFactory = {
        factoryId,
        level: 0,
        production: '',
        status: 'standby',
        produceOn: 0,
    };

    await Business.updateOne({ name: data.business.name }, { $push: { factories: factory }, $inc: { balance: -cost } });
    return true;
}

export default {
    data: {
        name: 'factory',
        description: 'Create products from your supply and sell them for profit!',
        category: 'business',
    },
    async execute(client: Bot, interaction: ChatInputCommandInteraction) {
        let data = await getBusiness(interaction.user.id);
        if (!data) {
            await interaction.reply({
                content:
                    'You do not own or work at a business yet. Use `/business info` and press the create button to start one.',
                ephemeral: true,
            });
            return;
        }

        let finishedCommand = false;
        const message = await interaction.reply({
            embeds: [await createEmbed(client, data)],
            components: createComponents(data),
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            max: 12,
            idle: 20_000,
            time: 90_000,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            if (finishedCommand) return;
            if (i.customId.startsWith('factory_')) {
                // update business to counter abuse
                data = await getBusiness(interaction.user.id);
                if (!data) {
                    finishedCommand = true;
                    collector.stop();
                    return;
                }

                let hasReplied = false;
                switch (i.customId) {
                    case 'factory_collect_products':
                        await pressButton_CollectProducts(client, data);
                        await interaction.followUp({ content: 'You have collected all products.', ephemeral: true });
                        break;
                    case 'factory_buy_factory':
                        if (await pressButton_BuyFactory(data)) {
                            await interaction.followUp({ content: 'You have bought a new factory.', ephemeral: true });
                        } else {
                            await interaction.followUp({
                                content: 'You do not have enough balance to buy a new factory.',
                                ephemeral: true,
                            });
                        }

                        break;
                    case 'factory_level_up':
                        hasReplied = await levelUp(interaction, i, data);
                        break;
                    case 'factory_start_production':
                        hasReplied = await startProduction(client, interaction, i, data);
                        break;
                    case 'factory_list_items':
                        await listItems(client, interaction, data);
                        break;
                    default:
                        break;
                }

                if (!hasReplied) await i.deferUpdate();

                // get updated business to update embed
                data = await getBusiness(interaction.user.id);
                if (!data) {
                    finishedCommand = true;
                    collector.stop();
                    return;
                }

                await interaction.editReply({
                    embeds: [await createEmbed(client, data)],
                    components: createComponents(data, finishedCommand),
                });
            }
        });

        collector.on('end', async () => {
            if (!finishedCommand && data) {
                finishedCommand = true;
                await interaction.editReply({ components: createComponents(data, true) });
            }
        });
    },
} satisfies Command;
