import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../domain/Command';

export default {
    data: {
        name: 'suggestion',
        description: 'Manage suggestions.',
        options: [
            {
                name: 'status',
                type: ApplicationCommandOptionType.String,
                description: 'Change the status of a suggestion.',
                required: true,
                choices: [
                    {
                        name: 'Planned',
                        value: 'planned',
                    },
                    {
                        name: 'Deny',
                        value: 'deny',
                    },
                    {
                        name: 'Released',
                        value: 'released',
                    },
                ],
            },
        ],
    },
    async execute() {},
} satisfies Command;
