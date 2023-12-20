import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../domain/Command';

export default {
    data: {
        name: 'business',
        description: 'Start your own business and earn the big bucks!',
        category: 'business',
        options: [
            {
                name: 'info',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get an overview of your business.',
                options: [
                    {
                        name: 'name',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of the business you want to get info about.',
                        required: false,
                    },
                ],
            },
            {
                name: 'sell-item',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Sell an item from the inventory of your business.',
                options: [
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The item ID of the item you want to sell.',
                        required: true,
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The amount of items you want to sell.',
                        required: false,
                        min_value: 1,
                        max_value: 200,
                    },
                ],
            },
            {
                name: 'supply',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy supplies to use in your factories.',
                options: [
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The item you want to buy.',
                        required: true,
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The amount of items you want to buy.',
                        required: false,
                        min_value: 1,
                        max_value: 500,
                    },
                ],
            },
            {
                name: 'employee',
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: 'Hire or fire employees for your business.',
                options: [
                    {
                        name: 'hire',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Hire an employee.',
                    },
                    {
                        name: 'fire',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Fire an employee from your business.',
                    },
                ],
            },
        ],
    },
    async execute(_, interaction) {
        await interaction.reply({
            content: 'This command is a subcommand group, please use one of the subcommands.',
            ephemeral: true,
        });
    },
} satisfies Command;
