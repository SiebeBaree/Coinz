import type { ModalSubmitInteraction, ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';
import { TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { Positions, type BusinessData } from '../../../lib/types';
import Business from '../../../models/business';
import { parsePlots } from '../../../utils';

type FactoriesToUpdate = {
    [key: string]: number | string;
};

const itemTypeInput = new TextInputBuilder()
    .setCustomId('item-type')
    .setLabel('Select a item to produce')
    .setPlaceholder(`Item ID or Name`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

const selectFactoriesInput = new TextInputBuilder()
    .setCustomId('select-factories')
    .setLabel('Select the factories to start production')
    .setPlaceholder(`Example: 1,3-6,8`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

const forceProductionInput = new TextInputBuilder()
    .setCustomId('force-production')
    .setLabel('Force production for factories not in standby')
    .setPlaceholder(`Yes or No`)
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMinLength(1)
    .setMaxLength(5);

export default async function startProduction(
    client: Bot,
    interaction: ChatInputCommandInteraction,
    buttonInteraction: ButtonInteraction,
    data: BusinessData,
): Promise<boolean> {
    if (!data.business.employees.some((e) => e.position >= Positions.Manager && e.userId === data.employee.userId)) {
        return false;
    }

    const modal = new ModalBuilder()
        .setTitle('Start Production')
        .setCustomId(`factory-production-${interaction.user.id}`)
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(itemTypeInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(selectFactoriesInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(forceProductionInput),
        );

    await buttonInteraction.showModal(modal);

    const filter = (modalInteraction: ModalSubmitInteraction) =>
        modalInteraction.customId === `factory-production-${interaction.user.id}` &&
        modalInteraction.user.id === interaction.user.id;

    try {
        const modalInteraction = await buttonInteraction.awaitModalSubmit({ filter, time: 120_000 });

        const itemType = modalInteraction.fields.getTextInputValue('item-type');
        const factoryList = modalInteraction.fields.getTextInputValue('select-factories');
        const forceProduction = modalInteraction.fields.getTextInputValue('force-production');

        const item = client.business.getById(itemType) ?? client.business.getByName(itemType);
        if (!item?.producable) {
            await modalInteraction.reply({
                content: 'The item you selected is not producable.',
                ephemeral: true,
            });
            return true;
        }

        try {
            const factories = parsePlots(factoryList);

            if (factories.length === 0) {
                await modalInteraction.reply({
                    content: 'You must select at least one factory.',
                    ephemeral: true,
                });
                return true;
            } else if (Math.min(...factories) < 1 || Math.max(...factories) > data.business.factories.length) {
                await modalInteraction.reply({
                    content: `You can only select factory ID from 1 to ${data.business.factories.length}.`,
                    ephemeral: true,
                });
                return true;
            }

            for (const factory of data.business.factories) {
                if (factories.includes(factory.factoryId) && factory.level < item.level) {
                    await modalInteraction.reply({
                        content: `You can't produce ${client.business.getItemString(
                            item,
                        )} on factory ${factory.factoryId} because it's level is lower than the item's required level.`,
                        ephemeral: true,
                    });
                    return true;
                }
            }

            const force = ['yes', 'y', 'true', '1'].includes(forceProduction ? forceProduction.toLowerCase() : 'no');
            if (!force) {
                const alreadyProducing = factories.filter(
                    (factoryId) =>
                        data.business.factories[factoryId - 1]?.status === 'producing' ||
                        data.business.factories[factoryId - 1]?.status === 'ready',
                );

                if (alreadyProducing.length > 0) {
                    await modalInteraction.reply({
                        content: `You are already producing something on factor${
                            alreadyProducing.length > 1 ? 'ies' : 'y'
                        } ${alreadyProducing.join(', ')}.`,
                    });
                    return true;
                }
            }

            const bulkOps = [];
            for (const requirement of item.requirements) {
                const reqItem = client.business.getById(requirement.itemId);
                if (!reqItem) continue;

                const totalAmount = requirement.amount * factories.length;
                const stock = client.business.getInventoryItem(reqItem.itemId, data.business.inventory);
                if (!stock || stock.amount < totalAmount) {
                    await modalInteraction.reply({
                        content: `You don't have enough ${client.business.getItemString(reqItem)} in your business inventory.`,
                        ephemeral: true,
                    });
                    return true;
                }

                if (stock.amount <= totalAmount) {
                    bulkOps.push({
                        updateOne: {
                            filter: { name: data.business.name },
                            update: {
                                $pull: {
                                    inventory: {
                                        itemId: reqItem.itemId,
                                    },
                                },
                            },
                        },
                    });
                } else {
                    bulkOps.push({
                        updateOne: {
                            filter: {
                                name: data.business.name,
                                'inventory.itemId': reqItem.itemId,
                            },
                            update: {
                                $inc: {
                                    'inventory.$.amount': -totalAmount,
                                },
                            },
                        },
                    });
                }
            }

            await modalInteraction.reply({
                content: `You successfully started producing ${client.business.getItemString(item)} on factor${
                    factories.length > 1 ? 'ies' : 'y'
                } ${factories.join(', ')}.`,
                ephemeral: true,
            });

            const produceOn = Math.floor(Date.now() / 1_000) + (item.duration ?? 21_600);
            const factoriesToUpdate: FactoriesToUpdate = {};
            for (const factory of factories) {
                factoriesToUpdate[`factories.${factory - 1}.status`] = 'producing';
                factoriesToUpdate[`factories.${factory - 1}.production`] = item.itemId;
                factoriesToUpdate[`factories.${factory - 1}.produceOn`] = produceOn;
            }

            bulkOps.push({
                updateOne: {
                    filter: { name: data.business.name },
                    update: {
                        $set: factoriesToUpdate,
                    },
                },
            });

            await Business.bulkWrite(bulkOps);
            return true;
        } catch (error) {
            await modalInteraction.reply({
                content: (error as Error).message,
                ephemeral: true,
            });
            return true;
        }
    } catch (error) {
        if ((error as Error).name.includes('InteractionCollectorError')) return false;
        throw error;
    }
}
