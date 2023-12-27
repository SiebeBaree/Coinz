import type { ChatInputCommandInteraction, GuildMember, ModalSubmitInteraction } from 'discord.js';
import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ApplicationCommandOptionType,
} from 'discord.js';
import type Bot from '../domain/Bot';
import type { Command } from '../domain/Command';
import Ticket from '../models/ticket';
import { claimTicket, closeTicket, createTicket, getReopenMessage } from '../utils/ticket';

async function getCreateTicket(client: Bot, interaction: ChatInputCommandInteraction) {
    if (interaction.member === null || interaction.guild === null || interaction.member.user.bot) {
        await interaction.reply({
            content: 'An error occurred while trying to create a ticket. Please try again later.',
            ephemeral: true,
        });
        return;
    }

    const ticketReasonInput = new TextInputBuilder()
        .setCustomId('ticket_reason')
        .setLabel('What is the reason for this ticket?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const modal = new ModalBuilder()
        .setTitle('Creating a ticket.')
        .setCustomId(`ticket_reason-${interaction.user.id}`)
        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(ticketReasonInput));
    await interaction.showModal(modal);

    const filter = (i: ModalSubmitInteraction) =>
        i.customId === `ticket_reason-${interaction.user.id}` && i.user.id === interaction.user.id;

    try {
        const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 300_000 });
        await modalInteraction.deferReply({ ephemeral: true });

        const ticketReason = modalInteraction.fields.getTextInputValue('ticket_reason');
        if (ticketReason === '') {
            await modalInteraction.editReply({
                content: 'You must provide a reason for this ticket.',
                components: [],
            });
            return;
        }

        const response = await createTicket(client, interaction.guild, interaction.member as GuildMember, ticketReason);

        if (!response.isCreated) {
            await modalInteraction.editReply({
                content: `:x: ${response.reason}`,
            });
            return;
        }

        await modalInteraction.editReply({
            content: `:white_check_mark: Your ticket has been created. You can find it at <#${response.ticketId}>.`,
        });
    } catch {}
}

async function getCloseTicket(client: Bot, interaction: ChatInputCommandInteraction) {
    if (interaction.member === null || interaction.guild === null || interaction.member.user.bot) {
        await interaction.reply({
            content: 'An error occurred while trying to close this ticket. Please try again later.',
            ephemeral: true,
        });
        return;
    }

    const response = await closeTicket(client, interaction.member as GuildMember, interaction.channelId);
    if (!response.isClosed || response.ticket === undefined) {
        await interaction.reply({
            content: `:x: ${response.reason}`,
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
}

async function getClaimTicket(client: Bot, interaction: ChatInputCommandInteraction) {
    if (interaction.member === null || interaction.guild === null || interaction.member.user.bot) {
        await interaction.reply({
            content: 'An error occurred while trying to claim this ticket. Please try again later.',
            ephemeral: true,
        });
        return;
    }

    const response = await claimTicket(client, interaction.member as GuildMember, interaction.channelId);
    if (!response.isClaimed) {
        await interaction.reply({
            content: `:x: ${response.reason}`,
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
        content: `:white_check_mark: This ticket has been claimed.`,
        ephemeral: true,
    });
}

export default {
    data: {
        name: 'ticket',
        description: 'Create, close and manage tickets.',
        options: [
            {
                name: 'create',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Create a ticket.',
            },
            {
                name: 'close',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Close this ticket.',
            },
            {
                name: 'claim',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Claim this ticket.',
            },
            // {
            //     name: 'edit',
            //     type: ApplicationCommandOptionType.Subcommand,
            //     description: '',
            // },
        ],
    },
    async execute(client, interaction) {
        switch (interaction.options.getSubcommand()) {
            case 'create':
                await getCreateTicket(client, interaction);
                break;
            case 'close':
                await getCloseTicket(client, interaction);
                break;
            case 'claim':
                await getClaimTicket(client, interaction);
                break;
            // case 'edit':
            //     await editTicket(client, interaction);
            //     break;
            default:
                await interaction.reply({
                    content:
                        'Invalid arguments... Please ping one of the staff members if you think this is a mistake.',
                    ephemeral: true,
                });
        }
    },
} satisfies Command;
