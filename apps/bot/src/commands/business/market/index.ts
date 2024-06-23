import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../domain/Command';
import { getBusiness } from '../../../utils';
import buy from './buy';
import list from './list';
import sell from './sell';

export default {
    data: {
        name: 'market',
        description: 'Buy and sell items for your business.',
        category: 'business',
        options: [
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get all items listed on the global market.',
                options: [
                    {
                        name: 'item',
                        type: ApplicationCommandOptionType.String,
                        description: 'The id or name of the item you want to get a list of.',
                        required: false,
                    },
                ],
            },
            {
                name: 'buy',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy items for your business from the global market.',
                options: [
                    {
                        name: 'listing-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The id of the listing you want to buy.',
                        required: true,
                    },
                ],
            },
            {
                name: 'sell',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Sell items from your business to the global market.',
                options: [
                    {
                        name: 'item',
                        type: ApplicationCommandOptionType.String,
                        description: 'The id or name of the item you want to sell.',
                        required: true,
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The amount of the item you want to sell.',
                        required: true,
                    },
                    {
                        name: 'price',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The price per item you want to sell.',
                        required: false,
                    },
                ],
            },
        ],
        usage: ['list [item]', 'buy <listing-id>', 'sell <item-id> <quantity> [price]'],
    },
    async execute(client, interaction) {
        const data = await getBusiness(interaction.user.id);
        if (!data) {
            await interaction.reply({
                content:
                    'You do not own or work at a business yet. Use `/business info` and press the create button to start one.',
                ephemeral: true,
            });
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case 'list':
                await list(client, interaction, data);
                break;
            case 'buy':
                await buy(client, interaction, data);
                break;
            case 'sell':
                await sell(client, interaction, data);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
