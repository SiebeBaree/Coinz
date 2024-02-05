import type { ColorResolvable, GuildMember, Snowflake, ModalSubmitInteraction } from 'discord.js';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, Events } from 'discord.js';
import type { Event } from '../domain/Event';
import Ticket from '../models/ticket';
import { createLogEmbed, sendLog } from '../utils/log';
import logger from '../utils/logger';
import {
    claimTicket,
    closeTicket,
    deleteTicket,
    formatNumber,
    getRatingRow,
    getReopenMessage,
    getTranscriptRow,
    reopenTicket,
    sendReasonModal,
} from '../utils/ticket';

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(client, interaction) {
        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
            if (!interaction.guild || !interaction.guild.available || interaction.user.bot) return;

            const command = client.commands.get(interaction.commandName);

            if (!command || command.data.enabled === false) {
                throw new Error(`Command '${interaction.commandName}' not found.`);
            }

            if (command.data.deferReply === true) {
                await interaction.deferReply();
            }

            try {
                await command.execute(client, interaction);
            } catch (error) {
                logger.error((error as Error).stack ?? (error as Error).message);

                const errorMsg = ':x: There was an error while executing this command! Please try again.';
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: errorMsg });
                } else {
                    await interaction.reply({ content: errorMsg, ephemeral: true });
                }
            }
        } else if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
            const action = interaction.customId.split('_')[1] ?? '';

            if (action === 'create') {
                await sendReasonModal(client, interaction);
            } else if (action === 'claim') {
                const response = await claimTicket(client, interaction.member as GuildMember, interaction.channelId);
                if (!response.isClaimed) {
                    await interaction.reply({
                        content: response.reason ? `:x: ${response.reason}` : 'Unable to claim ticket.',
                        ephemeral: true,
                    });
                    return;
                }

                await interaction.reply({
                    content: 'You have successfully claimed this ticket.',
                    ephemeral: true,
                });
            } else if (action === 'close') {
                const response = await closeTicket(client, interaction.member as GuildMember, interaction.channelId);
                if (!response.isClosed || response.ticket === undefined) {
                    await interaction.reply({
                        content: response.reason ? `:x: ${response.reason}` : 'Unable to close ticket.',
                        ephemeral: true,
                    });
                    return;
                }

                const { embed, components } = getReopenMessage(client, response.ticket);
                const message = await interaction.reply({
                    content: `<@${interaction.user.id}>`,
                    embeds: [embed],
                    components: [components],
                    fetchReply: true,
                });

                await Ticket.updateOne(
                    { channelId: interaction.channelId },
                    {
                        $set: {
                            responseMessageId: message.id,
                        },
                    },
                );
            } else if (action === 'reopen') {
                const response = await reopenTicket(client, interaction.member as GuildMember, interaction.channelId);
                if (!response.isReopened || response.ticket === undefined) {
                    await interaction.reply({
                        content: response.reason ? `:x: ${response.reason}` : 'Unable to reopen ticket.',
                        ephemeral: true,
                    });
                    return;
                }

                if (interaction.message.id === response.ticket.initialMessageId) {
                    const message = await interaction.channel?.messages.fetch(
                        response.ticket.responseMessageId as Snowflake,
                    );

                    if (message) {
                        await message.delete();
                    }
                } else {
                    await interaction.message.delete();
                }

                const embed = new EmbedBuilder()
                    .setTitle('Ticket Reopened')
                    .setDescription(`Ticket has been reopened by <@${interaction.user.id}>.`)
                    .setColor(client.config.embed.color as ColorResolvable)
                    .setTimestamp();
                await interaction.reply({ content: `<@${response.ticket.userId}>`, embeds: [embed] });
            } else if (action === 'delete') {
                const response = await deleteTicket(client, interaction.member as GuildMember, interaction.channelId);
                if (!response.isDeleted) {
                    await interaction.reply({
                        content: response.reason ? `:x: ${response.reason}` : 'Unable to delete ticket.',
                        ephemeral: true,
                    });
                }
            } else if (action.startsWith('rating')) {
                const [_, rating, ticketId] = action.split('-');
                const ticket = await Ticket.findById(ticketId);
                if (!ticket) {
                    await interaction.reply({
                        content: ':x: Unable to rate ticket.',
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    const ratingInt = Number.parseInt(rating ?? '', 10);

                    const ticketReasonInput = new TextInputBuilder()
                        .setCustomId('ticket_rating_reason')
                        .setLabel('Why did you rate this ticket this way?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false)
                        .setMaxLength(1600);

                    const modal = new ModalBuilder()
                        .setTitle('Ticket Rating')
                        .setCustomId(`ticket_rating_reason-${interaction.user.id}`)
                        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(ticketReasonInput));
                    await interaction.showModal(modal);

                    const filter = (i: ModalSubmitInteraction) =>
                        i.customId === `ticket_rating_reason-${interaction.user.id}` &&
                        i.user.id === interaction.user.id;

                    try {
                        const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 600_000 });
                        const ticketRatingReason = modalInteraction.fields.getTextInputValue('ticket_rating_reason');

                        if (modalInteraction.isFromMessage()) {
                            await modalInteraction.update({
                                components: [
                                    getRatingRow(ticketId ?? '', ratingInt),
                                    getTranscriptRow(ticket.channelId),
                                ],
                            });
                        }

                        await modalInteraction.followUp({ content: `Thank you for rating this ticket.` });

                        await Ticket.updateOne(
                            { channelId: ticket.channelId },
                            {
                                $set: {
                                    rating: rating,
                                    ratingReason: ticketRatingReason ?? '',
                                },
                            },
                        );

                        const logEmbed = createLogEmbed({
                            client,
                            title: 'Ticket Rated',
                            description: `Ticket #${formatNumber(ticket.ticketNumber)} has been rated by <@${
                                interaction.user.id
                            }>.\n**Rating:** ${':star:'.repeat(ratingInt)}\n**Reason:** ${
                                ticketRatingReason.length > 0 ? ticketRatingReason : 'No reason provided.'
                            }`,
                        });
                        await sendLog(client, logEmbed);
                    } catch (error) {
                        console.log(error);
                    }
                } catch {
                    await interaction.reply({
                        content: ':x: Unable to rate ticket.',
                    });
                }
            }
        }
    },
} satisfies Event<Events.InteractionCreate>;
