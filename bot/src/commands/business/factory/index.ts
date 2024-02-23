import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../domain/Command';

export default {
    data: {
        name: 'factory',
        description: 'Create products from your supply and sell them for profit!',
        category: 'business',
        options: [
            {
                name: 'view',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'View and manage your factories.',
                options: [],
            },
            {
                name: 'list-items',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'et a list of all the items your factories can produce.',
                options: [],
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
