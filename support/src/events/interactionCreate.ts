import { ColorResolvable, EmbedBuilder, GuildMember, Snowflake } from 'discord.js';
import { Events } from 'discord.js';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';
import { claimTicket, closeTicket, deleteTicket, getReopenMessage, reopenTicket } from '../utils/ticket';
import Ticket from '../models/ticket';

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(client, interaction) {
        if (interaction.isChatInputCommand()) {
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

                const errorMsg = 'There was an error while executing this command! Please try again.';
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: errorMsg });
                } else {
                    await interaction.reply({ content: errorMsg, ephemeral: true });
                }
            }
        } else if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
            const action = interaction.customId.split('_')[1];

            if (action === 'claim') {
                const response = await claimTicket(client, interaction.member as GuildMember, interaction.channelId);
                if (!response.isClaimed) {
                    await interaction.reply({ content: response.reason ?? 'Unable to claim ticket.', ephemeral: true });
                    return;
                }

                await interaction.reply({
                    content: 'You have successfully claimed this ticket.',
                    ephemeral: true,
                });
            } else if (action === 'edit') {
            } else if (action === 'close') {
                const response = await closeTicket(client, interaction.member as GuildMember, interaction.channelId);
                if (!response.isClosed || response.ticket === undefined) {
                    await interaction.reply({ content: response.reason ?? 'Unable to close ticket.', ephemeral: true });
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
                        content: response.reason ?? 'Unable to reopen ticket.',
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
                        content: response.reason ?? 'Unable to delete ticket.',
                        ephemeral: true,
                    });
                    return;
                }
            }
        }
    },
} satisfies Event<Events.InteractionCreate>;
