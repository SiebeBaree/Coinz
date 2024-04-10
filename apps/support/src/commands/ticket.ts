import type { ChatInputCommandInteraction, ColorResolvable, GuildMember } from 'discord.js';
import { ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder, ApplicationCommandOptionType } from 'discord.js';
import type Bot from '../domain/Bot';
import type { Command } from '../domain/Command';
import Ticket from '../models/ticket';
import { claimTicket, closeTicket, getReopenMessage, sendReasonModal } from '../utils/ticket';

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

async function getSendMessage(client: Bot, interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle('Tickets')
        .setDescription(
            'To create a ticket, please click the button below. A staff member will be with you shortly.\n\n' +
                '**Before creating a ticket:**\n' +
                '1. Make sure you have searched in <#1019848559962624020>, maybe someone already asked your question.\n' +
                '2. Read [**our guide**](<https://coinzbot.xyz/guide>) on how Coinz works before asking a question.\n' +
                "3. If it isn't a personal question, please ask it in <#1019848559962624020> instead of creating a ticket.",
        )
        .setThumbnail(client.user?.displayAvatarURL() as string)
        .setColor(client.config.embed.color as ColorResolvable);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_create')
            .setLabel('Create a ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💬'),
    );

    await interaction.reply({
        content: 'Ticket creation message sent.',
        ephemeral: true,
    });

    await interaction.channel?.send({
        embeds: [embed],
        components: [row],
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
            {
                name: 'send-message',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Send a message to this channel to create tickets.',
            },
        ],
    },
    async execute(client, interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'create':
                await sendReasonModal(client, interaction);
                break;
            case 'close':
                await getCloseTicket(client, interaction);
                break;
            case 'claim':
                await getClaimTicket(client, interaction);
                break;
            case 'send-message':
                await getSendMessage(client, interaction);
                break;
            default:
                await interaction.reply({
                    content:
                        'Invalid arguments... Please ping one of the staff members if you think this is a mistake.',
                    ephemeral: true,
                });
        }
    },
} satisfies Command;
