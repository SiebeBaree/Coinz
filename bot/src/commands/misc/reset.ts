import type { ModalSubmitInteraction } from 'discord.js';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import type { Command } from '../../domain/Command';
import Business from '../../models/business';
import Member from '../../models/member';
import UserStats from '../../models/userStats';

export default {
    data: {
        name: 'reset',
        description: 'Reset your progress in every server.',
        category: 'misc',
        cooldown: 86_400,
    },
    async execute(client, interaction) {
        const resetConfirmationInput = new TextInputBuilder()
            .setCustomId('reset-confirm')
            .setLabel('Confirmation')
            .setPlaceholder(`Type "${interaction.user.username}" to confirm.`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const modal = new ModalBuilder()
            .setTitle('Resetting your progress. Are You Sure?')
            .setCustomId(`reset-${interaction.user.id}`)
            .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(resetConfirmationInput));

        await interaction.showModal(modal);

        const filter = (i: ModalSubmitInteraction) =>
            i.customId === `reset-${interaction.user.id}` && i.user.id === interaction.user.id;

        try {
            const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 90_000 });

            const resetConfirmation = modalInteraction.fields.getTextInputValue('reset-confirm');
            if (resetConfirmation !== interaction.user.username) {
                await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
                await modalInteraction.reply({
                    content: 'Username is incorrect. Canceling the reset.',
                    components: [],
                    ephemeral: true,
                });
                return;
            }

            await Business.deleteOne({ id: interaction.user.id });
            await Member.deleteOne({ id: interaction.user.id });
            await UserStats.deleteOne({ id: interaction.user.id });
            await modalInteraction.reply({
                content: 'Your account has been reset. This action is irreversible.',
                components: [],
                ephemeral: true,
            });
        } catch (error) {
            if ((error as Error).name.includes('InteractionCollectorError')) {
                await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
                return;
            }

            throw error;
        }
    },
} satisfies Command;
