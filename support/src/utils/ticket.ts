import type { GuildMember, Guild, Snowflake, ColorResolvable } from 'discord.js';
import {
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import type Bot from '../domain/Bot';
import type { ITicket } from '../models/ticket';
import Ticket from '../models/ticket';
import { TicketStatus } from './enums';

type TicketCreation = {
    isCreated: boolean;
    ticketId?: string;
    reason?: string;
};

export async function createTicket(
    client: Bot,
    guild: Guild,
    member: GuildMember,
    category: string,
    reason: string,
): Promise<TicketCreation> {
    const numberOfTickets = await Ticket.countDocuments({
        userId: member.id,
        $or: [{ status: TicketStatus.Open }, { status: TicketStatus.Claimed }],
    });
    if (numberOfTickets >= 1) {
        return {
            isCreated: false,
            reason: 'You have reached the maximum number of tickets.',
        };
    }

    if (client.settings.ticketCategory === undefined || client.settings.ticketCategory.length === 0) {
        return {
            isCreated: false,
            reason: 'Could not find ticket category, unable to create a ticket.',
        };
    }

    const ticketCategory = await guild.channels.fetch(client.settings.ticketCategory as Snowflake);
    if (!ticketCategory) {
        return {
            isCreated: false,
            reason: 'Could not find ticket category, unable to create a ticket.',
        };
    }

    if (ticketCategory.type !== ChannelType.GuildCategory) {
        return {
            isCreated: false,
            reason: 'Ticket category is not a category, unable to create a ticket.',
        };
    }

    const totalNumberOfTickets = await Ticket.countDocuments({});
    const ticketChannel = await guild.channels.create({
        name: `ticket-${formatNumber(totalNumberOfTickets + 1)}`,
        type: ChannelType.GuildText,
        parent: ticketCategory.id,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: member.id,
                allow: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: client.settings.ticketSupportRole,
                allow: [PermissionsBitField.Flags.ViewChannel],
            },
        ],
    });

    const message = await ticketChannel.send({
        content: `<@${member.id}>`,
        embeds: [createEmbed(client, member, category, reason, totalNumberOfTickets)],
        components: [createTicketOptions()],
    });

    const ticket = new Ticket({
        initialMessageId: message.id,
        channelId: ticketChannel.id,
        userId: member.id,
        category: category,
        reason: reason,
        status: TicketStatus.Open,
        ticketNumber: formatNumber(totalNumberOfTickets + 1),
    });
    await ticket.save();

    return {
        isCreated: true,
        ticketId: ticketChannel.id,
    };
}

type ClaimTicket = {
    isClaimed: boolean;
    reason?: string;
};

export async function claimTicket(client: Bot, member: GuildMember, channelId: string): Promise<ClaimTicket> {
    const ticket = await Ticket.findOne({ channelId: channelId });
    if (!ticket) {
        return {
            isClaimed: false,
            reason: 'Could not find ticket.',
        };
    }

    if (!member.roles.cache.has(client.settings.ticketSupportRole)) {
        return {
            isClaimed: false,
            reason: 'You do not have the required role to claim tickets.',
        };
    }

    if (ticket.status === TicketStatus.Claimed) {
        if (ticket.claimedBy === member.id) {
            return {
                isClaimed: false,
                reason: 'Ticket is already claimed by you.',
            };
        } else {
            return {
                isClaimed: false,
                reason: 'Ticket is already claimed by another staff member.',
            };
        }
    }

    if (ticket.status !== TicketStatus.Open) {
        return {
            isClaimed: false,
            reason: 'Ticket is not open.',
        };
    }

    const channel = await member.guild.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
        return {
            isClaimed: false,
            reason: 'Could not find ticket channel.',
        };
    }

    const message = await channel.messages.fetch(ticket.initialMessageId);
    if (!message) {
        return {
            isClaimed: false,
            reason: 'Could not find ticket message.',
        };
    }

    await message.edit({
        embeds: [createEmbed(client, member, ticket.category, message.embeds[0]?.description as string, 0)],
        components: [createTicketOptions(ticket)],
    });

    ticket.status = TicketStatus.Claimed;
    ticket.claimedBy = member.id;
    await ticket.save();

    return {
        isClaimed: true,
    };
}

function formatNumber(input: number): string {
    if (input <= 9999) {
        return input.toString().padStart(4, '0');
    } else {
        return input.toString();
    }
}

function createTicketOptions(ticket?: ITicket, isDisabled = false): ActionRowBuilder<ButtonBuilder> {
    let isClaimDisabled = false;
    let isEditDisabled = false;
    let isCloseDisabled = false;

    if (ticket) {
        if (ticket.status === TicketStatus.Claimed) isClaimDisabled = true;
        if (ticket.status === TicketStatus.Closed) {
            isClaimDisabled = true;
            isEditDisabled = true;
            isCloseDisabled = true;
        }
    }

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎟')
            .setLabel('Claim')
            .setDisabled(isClaimDisabled || isDisabled),
        new ButtonBuilder()
            .setCustomId('ticket_edit')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝')
            .setLabel('Edit')
            .setDisabled(isEditDisabled || isDisabled),
        new ButtonBuilder()
            .setCustomId('ticket_close')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
            .setLabel('Close')
            .setDisabled(isCloseDisabled || isDisabled),
    );
}

function createEmbed(
    client: Bot,
    member: GuildMember,
    category: string,
    reason: string,
    totalNumberOfTickets: number,
): EmbedBuilder {
    return new EmbedBuilder()
        .setAuthor({
            name: `${member.user.tag} - Ticket #${formatNumber(totalNumberOfTickets + 1)}`,
            iconURL: member.user.displayAvatarURL(),
        })
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            `Tell us why you created a ticket. Do not ping any staff members to get faster responses.\n\n:dividers: **Category:** ${category}\n:pushpin: **Reason:** ${reason}`,
        )
        .setFooter({ text: client.config.embed.footer })
        .setTimestamp();
}
