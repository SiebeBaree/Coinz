import type { ChatInputCommandInteraction, ForumChannel, ColorResolvable } from 'discord.js';
import { ApplicationCommandOptionType, ChannelType, EmbedBuilder } from 'discord.js';
import type Bot from '../domain/Bot';
import type { Command } from '../domain/Command';

const MODERATOR_TAGS = ['Planned', 'Denied', 'Released'];

async function getChangeStatus(client: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const channel = await client.channels.fetch(interaction.channelId);
    if (!channel) {
        await interaction.editReply({
            content: 'An error occurred while trying to change the status of this suggestion. Please try again later.',
        });
        return;
    }

    if (channel.type !== ChannelType.PublicThread || channel.parentId !== client.config.channels.suggestions) {
        await interaction.editReply({
            content: 'You can only change the status of a suggestion in the suggestions channel.',
        });
        return;
    }

    const forum = channel.parent as ForumChannel;
    const status = interaction.options.getString('status', true);
    const tag = forum.availableTags.find((tag) => tag.name === status);

    if (!tag) {
        await interaction.editReply({ content: 'Invalid tag.' });
        return;
    }

    if (channel.appliedTags.includes(tag.id)) {
        await interaction.editReply({ content: `You can't change the status to ${status} because it's already set.` });
        return;
    }

    const tags: string[] = [];
    for (const tag of forum.availableTags) {
        if (MODERATOR_TAGS.includes(tag.name)) {
            tags.push(tag.id);
        }
    }

    const appliedTags = channel.appliedTags.filter((tag) => !tags.includes(tag));
    await channel.setAppliedTags(
        [...appliedTags, tag.id],
        `Suggestion status change to ${status} by ${interaction.user.tag}`,
    );
    await interaction.editReply({
        content: `Suggestion status changed to ${status}.`,
    });

    if (status === 'Planned') {
        await channel.send({
            embeds: [
                getEmbed(
                    client,
                    `Suggestion ${status}`,
                    `This suggestion has been marked as **${status}**.\nThe new feature will be released in a future update. ` +
                        'If you have any additional information, please add it here. Thank you!',
                ),
            ],
        });
    } else {
        await channel.setLocked(true, `Locked channel by ${interaction.user.tag}`);
        await channel.send({
            embeds: [
                getEmbed(
                    client,
                    `Suggestion ${status}`,
                    `This suggestion has been marked as **${status}**.\nThe post is now closed. ` +
                        'To add any additional information, please create a new suggestion and link to this one. Thank you!',
                ),
            ],
        });
    }
}

function getEmbed(client: Bot, title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle(title)
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(description);
}

export default {
    data: {
        name: 'suggestion',
        description: 'Manage suggestions.',
        options: [
            {
                name: 'change-status',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Change the status of a suggestion.',
                options: [
                    {
                        name: 'status',
                        type: ApplicationCommandOptionType.String,
                        description: 'Change the status of a suggestion.',
                        required: true,
                        choices: [
                            {
                                name: 'Planned',
                                value: 'Planned',
                            },
                            {
                                name: 'Deny',
                                value: 'Denied',
                            },
                            {
                                name: 'Released',
                                value: 'Released',
                            },
                        ],
                    },
                ],
            },
        ],
    },
    async execute(client, interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'change-status':
                await getChangeStatus(client, interaction);
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
