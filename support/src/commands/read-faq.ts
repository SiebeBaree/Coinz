// eslint-disable-next-line import/no-extraneous-dependencies
import { ApplicationCommandType } from 'discord-api-types/v10';
import { type MessageContextMenuCommandInteraction } from 'discord.js';
import type { Command } from '../domain/Command';

export default {
    data: {
        name: 'Read FAQ',
        type: ApplicationCommandType.Message,
    },
    async execute(_, interaction: MessageContextMenuCommandInteraction) {
        await interaction.reply({
            content:
                `${interaction.targetMessage.author}, please read the FAQ before asking questions.\n` +
                'Your question is already answered there. You can find the FAQ here: [**Coinz Website**](<https://coinzbot.xyz/guide/faq>)',
        });
    },
} satisfies Command;
