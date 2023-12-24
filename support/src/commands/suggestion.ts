import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../domain/Command';

export default {
    data: {
        name: '',
        description: '',
        options: [
            {
                name: 'status',
                type: ApplicationCommandOptionType.String,
                description: '',
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
