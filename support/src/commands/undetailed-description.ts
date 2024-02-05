// eslint-disable-next-line import/no-extraneous-dependencies
import { ApplicationCommandType } from 'discord-api-types/v10';
import type { MessageContextMenuCommandInteraction } from 'discord.js';
import type { Command } from '../domain/Command';

export default {
    data: {
        name: 'Undetailed Description',
        type: ApplicationCommandType.Message
    },
    async execute(_, interaction: MessageContextMenuCommandInteraction) {
        await interaction.reply({
            content: `${interaction.targetMessage.author}, if you want that we seriously look at your post, please provide a detailed description.`,
        });
    },
} satisfies Command;
