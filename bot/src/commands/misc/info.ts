import type { Command } from '../../domain/Command';

export default {
    data: {
        name: 'info',
        description: 'Ping!',
    },
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
} satisfies Command;
