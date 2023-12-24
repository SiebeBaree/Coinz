import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../domain/Command';

export default {
    data: {
        name: '',
        description: '',
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the balance of another user.',
                required: false,
            },
        ],
    },
    async execute() {},
} satisfies Command;
