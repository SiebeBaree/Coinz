import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../domain/Command';
import { Positions } from '../../../lib/types';
import { getBusiness } from '../../../utils';
import employee from './employee';
import info from './info';
import invest from './invest';
import pay from './pay';
import supply from './supply';

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
                name: 'invest',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Invest money in your business.',
                options: [
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.String,
                        description: 'The amount of money you want to invest in your business.',
                        required: true,
                    },
                ],
            },
            {
                name: 'pay',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Pay you and your employees an equal amount of money.',
                options: [
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.String,
                        description: 'The amount of money you want to pay each of your employees.',
                        required: true,
                    },
                ],
            },
            {
                name: 'supply',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Pay you and your employees an equal amount of money.',
                options: [
                    {
                        name: 'item',
                        type: ApplicationCommandOptionType.String,
                        description: 'The item id or name you want to supply to your business.',
                        required: true,
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Number,
                        description: 'The amount of the item you want to supply to your business.',
                        min_value: 1,
                        max_value: 1000,
                    },
                ],
            },
            {
                name: 'employee',
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: 'Manage your employees for your business.',
                options: [
                    {
                        name: 'hire',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Hire an employee.',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The user you want to hire.',
                                required: true,
                            },
                        ],
                    },
                    {
                        name: 'fire',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Fire an employee from your business. (Use only one of the options)',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The user you want to fire from your business.',
                                required: false,
                            },
                            {
                                name: 'employee-id',
                                type: ApplicationCommandOptionType.String,
                                description: 'The id of the employee you want to fire.',
                                required: false,
                            },
                            {
                                name: 'username',
                                type: ApplicationCommandOptionType.String,
                                description: 'The username of the employee you want to fire.',
                                required: false,
                            },
                        ],
                    },
                    {
                        name: 'promote',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Promote or demote an employee.',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The employee you want to change the position of.',
                                required: true,
                            },
                            {
                                name: 'position',
                                type: ApplicationCommandOptionType.Number,
                                description: 'The position of that employee.',
                                required: true,
                                choices: [
                                    {
                                        name: 'Employee',
                                        value: Positions.Employee,
                                    },
                                    {
                                        name: 'Manager',
                                        value: Positions.Manager,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
        usage: [
            'info [name]',
            'invest <amount>',
            'pay <amount>',
            'supply <item> [amount]',
            'employee hire <user>',
            'employee fire <user | employee-id | username>',
            'employee promote <user> <position>',
        ],
    },
    async execute(client, interaction, member) {
        const data = await getBusiness(interaction.user.id);
        if (interaction.options.getSubcommand() === 'info') {
            await info(client, interaction, member, data);
            return;
        }

        if (!data) {
            await interaction.reply({
                content:
                    'You do not own or work at a business yet. Use `/business info` and press the create button to start one.',
                ephemeral: true,
            });
            return;
        }

        if (interaction.options.getSubcommandGroup() === 'employee') {
            await employee(client, interaction, member, data);
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case 'supply':
                await supply(client, interaction, data);
                break;
            case 'pay':
                await pay(client, interaction, data);
                break;
            case 'invest':
                await invest(client, interaction, member, data);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
