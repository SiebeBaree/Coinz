import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../domain/Command';

export default {
    data: {
        name: 'undetailed-description',
        description: 'Sends a message to the user that the description is not detailed enough.',
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
