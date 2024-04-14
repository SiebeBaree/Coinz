import { ApplicationCommandType } from 'discord-api-types/v10';
import { type MessageContextMenuCommandInteraction } from 'discord.js';
import type Bot from '../domain/Bot';
import type { Command } from '../domain/Command';

export default {
    data: {
        name: 'Read FAQ',
        type: ApplicationCommandType.Message,
    },
    async execute(client: Bot, interaction: MessageContextMenuCommandInteraction) {
        await interaction.reply({
            content:
                `${interaction.targetMessage.author}, please read the FAQ before asking questions.\n` +
                `Your question is already answered there. You can find the FAQ here: [**Coinz Website**](<${client.config.website}/guide/faq>)`,
        });
    },
} satisfies Command;
