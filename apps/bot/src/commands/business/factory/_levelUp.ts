import type { ModalSubmitInteraction, ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';
import { TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } from 'discord.js';
import { Positions, type BusinessData } from '../../../lib/types';
import Business from '../../../models/business';
import { parsePlots } from '../../../utils';

type FactoriesToUpdate = {
    [key: string]: number | string;
};

const selectFactoriesInput = new TextInputBuilder()
    .setCustomId('select-levelup')
    .setLabel('Select the factories to level up (one level)')
    .setPlaceholder(`Example: 1,3-6,8`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

export default async function levelUp(
    interaction: ChatInputCommandInteraction,
    buttonInteraction: ButtonInteraction,
    data: BusinessData,
): Promise<boolean> {
    if (!data.business.employees.some((e) => e.position >= Positions.Manager && e.userId === data.employee.userId)) {
        return false;
    }

    const modal = new ModalBuilder()
        .setTitle('Level Up Factories')
        .setCustomId(`factory-level-${interaction.user.id}`)
        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(selectFactoriesInput));

    await buttonInteraction.showModal(modal);

    const filter = (modalInteraction: ModalSubmitInteraction) =>
        modalInteraction.customId === `factory-level-${interaction.user.id}` &&
        modalInteraction.user.id === interaction.user.id;

    try {
        const modalInteraction = await buttonInteraction.awaitModalSubmit({ filter, time: 120_000 });

        const factoryList = modalInteraction.fields.getTextInputValue('select-levelup');

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
                if (factories.includes(factory.factoryId + 1) && factory.level >= 5) {
                    await modalInteraction.reply({
                        content: `You can't level up factory ${factory.factoryId + 1} anymore.`,
                        ephemeral: true,
                    });
                    return true;
                }
            }

            let totalPrice = 0;
            for (const factory of factories) {
                totalPrice += 1500 * ((data.business.factories[factory - 1]?.level ?? 0) + 1);
            }

            if (data.business.balance < totalPrice) {
                await modalInteraction.reply({
                    content: `You don't have enough money to level up the selected factories. You need :coin: ${totalPrice}.`,
                    ephemeral: true,
                });
                return true;
            }

            await modalInteraction.reply({
                content: `You successfully leveled up factor${
                    factories.length > 1 ? 'ies' : 'y'
                } ${factories.join(', ')}.`,
                ephemeral: true,
            });

            const factoriesToUpdate: FactoriesToUpdate = {};
            for (const factory of factories) {
                factoriesToUpdate[`factories.${factory - 1}.level`] =
                    (data.business.factories[factory - 1]?.level ?? 0) + 1;
            }

            await Business.updateOne(
                { name: data.business.name },
                {
                    $inc: { balance: -totalPrice },
                    $set: factoriesToUpdate,
                },
            );
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
