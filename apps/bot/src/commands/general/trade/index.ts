import {
    //     ActionRowBuilder,
    ApplicationCommandOptionType,
    //     EmbedBuilder,
    //     ModalBuilder,
    //     TextInputBuilder,
    //     TextInputStyle,
} from 'discord.js';
import type { Command } from '../../../domain/Command';
import create from './create';
import list from './list';
import view from './view';

export default {
    data: {
        name: 'trade',
        description: 'Trade items with another user.',
        category: 'general',
        options: [
            {
                name: 'view',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Update an active trade or get information about a trade.',
                options: [
                    {
                        name: 'trade-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The ID of the trade you want to view.',
                        required: true,
                    },
                ],
            },
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'List all your trades and trades with you.',
                options: [],
            },
            {
                name: 'create',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Create a new trade with another user.',
                options: [
                    {
                        name: 'user',
                        type: ApplicationCommandOptionType.User,
                        description: 'The user you want to trade with.',
                        required: true,
                    },
                ],
            },
        ],
        usage: ['view <trade-id>', 'list', 'create <user>'],
    },
    async execute(client, interaction, member) {
        switch (interaction.options.getSubcommand()) {
            case 'view':
                await view(client, interaction, member);
                break;
            case 'list':
                await list(client, interaction);
                break;
            case 'create':
                await create(client, interaction, member);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
