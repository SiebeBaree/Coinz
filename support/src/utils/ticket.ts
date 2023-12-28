import type {
    GuildMember,
    Guild,
    Snowflake,
    ColorResolvable,
    Message,
    TextChannel,
    ModalSubmitInteraction,
    ChatInputCommandInteraction,
    ButtonInteraction,
} from 'discord.js';
import {
    WebhookClient,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder,
} from 'discord.js';
import type Bot from '../domain/Bot';
import type { ITicket } from '../models/ticket';
import Ticket from '../models/ticket';
import { TicketStatus } from './enums';
import { createLogEmbed, sendLog } from './log';
import logger from './logger';

type TicketCreation = {
    isCreated: boolean;
    ticketId?: string;
    reason?: string;
};

export async function createTicket(
    client: Bot,
    guild: Guild,
    member: GuildMember,
    reason?: string,
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

    const ticketsLastHour = await Ticket.countDocuments({
        userId: member.id,
        createdAt: {
            $gte: new Date(Date.now() - 60 * 60 * 1000),
        },
    });

    if (ticketsLastHour >= 3) {
        return {
            isCreated: false,
            reason: 'You have reached the maximum number of tickets per hour.',
        };
    }

    if (client.config.ticketCategory === undefined || client.config.ticketCategory.length === 0) {
        return {
            isCreated: false,
            reason: 'Could not find ticket category, unable to create a ticket.',
        };
    }

    const ticketCategory = await guild.channels.fetch(client.config.ticketCategory as Snowflake);
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

    const ticketNumber = (await Ticket.countDocuments({})) + 1;
    const ticketChannel = await guild.channels.create({
        name: `ticket-${formatNumber(ticketNumber)}`,
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
                id: client.config.ticketSupportRole,
                allow: [PermissionsBitField.Flags.ViewChannel],
            },
        ],
    });

    const ticket = new Ticket({
        channelId: ticketChannel.id,
        userId: member.id,
        status: TicketStatus.Open,
        ticketNumber: ticketNumber,
    });

    const message = await ticketChannel.send({
        content: `<@${member.id}>`,
        embeds: [createEmbed(client, member, ticket)],
        components: [createTicketComponents()],
    });

    ticket.initialMessageId = message.id;
    await ticket.save();

    if (reason && reason.length > 0) {
        const webhook = await ticketChannel.createWebhook({
            name: member.user.username,
            avatar: member.user.displayAvatarURL(),
        });

        const webhookClient = new WebhookClient(webhook);
        await webhookClient.send({
            content: reason,
        });

        await webhook.delete();
    }

    const logEmbed = createLogEmbed({
        client,
        title: 'Ticket Created',
        description: `Ticket #${formatNumber(ticketNumber)} has been created by <@${member.id}>.`,
    });

    await sendLog(client, logEmbed);

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
    try {
        const { ticket, message } = await fetchTicketDetails(client, channelId, member, true);

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

        ticket.status = TicketStatus.Claimed;
        ticket.claimedBy = member.id;

        await message.edit({
            embeds: [createEmbed(client, member, ticket)],
            components: [createTicketComponents(ticket)],
        });

        await Ticket.updateOne(
            { channelId: channelId },
            {
                $set: {
                    status: TicketStatus.Claimed,
                    claimedBy: member.id,
                },
            },
        );

        return {
            isClaimed: true,
        };
    } catch (error) {
        return {
            isClaimed: false,
            reason: (error as Error).message,
        };
    }
}

type CloseTicket = {
    isClosed: boolean;
    reason?: string;
    ticket?: ITicket;
};

export async function closeTicket(client: Bot, member: GuildMember, channelId: string): Promise<CloseTicket> {
    try {
        const { ticket, message, channel } = await fetchTicketDetails(client, channelId, member, false);

        if (ticket.status === TicketStatus.Closed) {
            return {
                isClosed: false,
                reason: 'Ticket is already closed.',
            };
        }

        if (!member.roles.cache.has(client.config.ticketSupportRole) && member.id !== ticket.userId) {
            return {
                isClosed: false,
                reason: 'You have to be the ticket owner or have the required role to close this ticket.',
            };
        }

        ticket.status = TicketStatus.Closed;
        await message.edit({
            embeds: [createEmbed(client, member, ticket)],
            components: [createTicketComponents(ticket)],
        });

        await Ticket.updateOne(
            { channelId: channelId },
            {
                $set: {
                    status: TicketStatus.Closed,
                    closedBy: member.id,
                },
            },
        );

        await channel.permissionOverwrites.edit(member.id, {
            ViewChannel: false,
        });

        const embed = new EmbedBuilder()
            .setTitle(`Ticket #${formatNumber(ticket.ticketNumber)} was closed`)
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(
                `Your ticket has been closed by <@${member.id}>. You can view the transcript by clicking the button below.`,
            )
            .setFooter({ text: client.config.embed.footer })
            .setTimestamp();

        try {
            const ticketMember = await member.guild.members.fetch(ticket.userId);
            const dmChannel = await ticketMember.createDM();
            await dmChannel.send({
                embeds: [embed],
                components: [getRatingRow(ticket._id), getTranscriptRow(ticket.channelId)],
            });
            await dmChannel.delete();
        } catch {
            logger.error(`Could not send message to user ${ticket.userId}.`);
        }

        return {
            isClosed: true,
            ticket: ticket,
        };
    } catch (error) {
        return {
            isClosed: false,
            reason: (error as Error).message,
        };
    }
}

type ReopenTicket = {
    isReopened: boolean;
    reason?: string;
    ticket?: ITicket;
};

export async function reopenTicket(client: Bot, member: GuildMember, channelId: string): Promise<ReopenTicket> {
    try {
        const { ticket, message, channel } = await fetchTicketDetails(client, channelId, member, true);

        if (ticket.status !== TicketStatus.Closed) {
            return {
                isReopened: false,
                reason: 'Ticket is not closed.',
            };
        }

        ticket.status = TicketStatus.Open;
        ticket.claimedBy = '';

        await message.edit({
            embeds: [createEmbed(client, member, ticket)],
            components: [createTicketComponents(ticket)],
        });

        await Ticket.updateOne(
            { channelId: channelId },
            {
                $set: {
                    status: TicketStatus.Open,
                    claimedBy: '',
                    closedBy: '',
                },
            },
        );

        await channel.permissionOverwrites.edit(member.id, {
            ViewChannel: true,
        });

        const logEmbed = createLogEmbed({
            client,
            title: 'Ticket Reopened',
            description: `Ticket #${formatNumber(ticket.ticketNumber)} owned by <@${ticket.userId}> has been reopened.`,
            details: {
                moderator: member.id,
                reason: 'Ticket reopened by staff member.',
            },
        });

        await sendLog(client, logEmbed);

        return {
            isReopened: true,
            ticket: ticket,
        };
    } catch (error) {
        return {
            isReopened: false,
            reason: (error as Error).message,
        };
    }
}

type DeleteTicket = {
    isDeleted: boolean;
    reason?: string;
};

export async function deleteTicket(client: Bot, member: GuildMember, channelId: string): Promise<DeleteTicket> {
    try {
        const { ticket, message, channel } = await fetchTicketDetails(client, channelId, member, true);

        if (ticket.status !== TicketStatus.Closed) {
            return {
                isDeleted: false,
                reason: 'Ticket is not closed.',
            };
        }

        ticket.status = TicketStatus.Deleted;
        ticket.deletedBy = member.id;

        await message.edit({
            embeds: [createEmbed(client, member, ticket)],
            components: [createTicketComponents(ticket)],
        });

        await Ticket.updateOne(
            { channelId: channelId },
            {
                $set: {
                    status: TicketStatus.Deleted,
                    deletedBy: member.id,
                },
            },
        );

        await channel.delete('Ticket deleted by staff member.');

        const logEmbed = createLogEmbed({
            client,
            title: 'Ticket Deleted',
            description: `Ticket #${formatNumber(ticket.ticketNumber)} owned by <@${ticket.userId}> has been deleted.`,
            details: {
                moderator: member.id,
                reason: 'Ticket deleted by staff member.',
            },
        });

        await sendLog(client, logEmbed, [getTranscriptRow(ticket.channelId)]);

        return {
            isDeleted: true,
        };
    } catch (error) {
        return {
            isDeleted: false,
            reason: (error as Error).message,
        };
    }
}

export function formatNumber(input: number): string {
    if (input <= 9999) {
        return input.toString().padStart(4, '0');
    } else {
        return input.toString();
    }
}

function createTicketComponents(ticket?: ITicket, isDisabled = false): ActionRowBuilder<ButtonBuilder> {
    let isClaimDisabled = false;
    let isCloseDisabled = false;

    if (ticket) {
        if (ticket.status === TicketStatus.Claimed) isClaimDisabled = true;
        if (ticket.status === TicketStatus.Closed) {
            isClaimDisabled = true;
            isCloseDisabled = true;
        }
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎟')
            .setLabel('Claim')
            .setDisabled(isClaimDisabled || isDisabled),
    );

    if (ticket?.status === TicketStatus.Closed) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_reopen')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔓')
                .setLabel('Reopen')
                .setDisabled(!isCloseDisabled || isDisabled),
        );
    } else {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
                .setLabel('Close')
                .setDisabled(isCloseDisabled || isDisabled),
        );
    }

    return row;
}

function createEmbed(client: Bot, member: GuildMember, ticket: ITicket): EmbedBuilder {
    let description = 'Tell us why you created a ticket. Do not ping any staff members to get faster responses.\n\n';
    description += `:tickets: **Claimed by:** ${
        ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'No one has claimed this ticket yet.'
    }\n`;
    description += `${ticket.status === TicketStatus.Closed ? ':lock:' : ':unlock:'} **Ticket Status**: ${
        ticket.status === TicketStatus.Closed ? 'Closed' : 'Open'
    }`;

    return new EmbedBuilder()
        .setAuthor({
            name: `${member.user.tag} - Ticket #${formatNumber(ticket.ticketNumber)}`,
            iconURL: member.user.displayAvatarURL(),
        })
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(description)
        .setFooter({ text: client.config.embed.footer })
        .setTimestamp();
}

type TicketDetails = {
    ticket: ITicket;
    message: Message;
    channel: TextChannel;
};

async function fetchTicketDetails(
    client: Bot,
    channelId: string,
    member: GuildMember,
    needAdmin: boolean = false,
): Promise<TicketDetails> {
    const ticket = await Ticket.findOne({ channelId: channelId });
    if (!ticket) throw new Error("You're not in a ticket channel.");

    if (needAdmin && !member.roles.cache.has(client.config.ticketSupportRole)) {
        throw new Error('You do not have the required role use this feature.');
    }

    const channel = await member.guild.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
        throw new Error('Could not find ticket channel.');
    }

    const message = await channel.messages.fetch(ticket.initialMessageId);
    if (!message) {
        throw new Error('Could not find ticket message.');
    }

    return {
        ticket: ticket,
        message: message,
        channel: channel,
    };
}

type ReopenMessage = {
    embed: EmbedBuilder;
    components: ActionRowBuilder<ButtonBuilder>;
};

export function getReopenMessage(client: Bot, ticket: ITicket): ReopenMessage {
    const embed = new EmbedBuilder()
        .setTitle(`Closed Ticket #${formatNumber(ticket.ticketNumber)}`)
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription('Your ticket has been closed. If you wish to reopen it, click the button below.')
        .setFooter({ text: client.config.embed.footer })
        .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_reopen')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔓')
            .setLabel('Reopen'),
        new ButtonBuilder().setCustomId('ticket_delete').setStyle(ButtonStyle.Danger).setEmoji('🗑').setLabel('Delete'),
    );

    return {
        embed: embed,
        components: row,
    };
}

export async function sendReasonModal(client: Bot, interaction: ButtonInteraction | ChatInputCommandInteraction) {
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
        .setRequired(true)
        .setMinLength(20)
        .setMaxLength(1000);

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
                content: ':x: You must provide a reason for this ticket.',
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

export function getRatingRow(ticketId: string, rating: number = 0): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();

    for (let i = 1; i <= 5; i++) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_rating-${i}-${ticketId}`)
                .setStyle(i <= rating ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji('⭐')
                .setLabel(`${i}`)
                .setDisabled(rating > 0),
        );
    }

    return row;
}

export function getTranscriptRow(channelId: string): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setEmoji('📄')
            .setLabel('View Transcript')
            .setURL(`https://coinzbot.xyz/ticket/${channelId}`),
    );
}
