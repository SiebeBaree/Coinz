import { Events } from 'discord.js';
import type { Event } from '../domain/Event';

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(client, interaction) {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                throw new Error(`Command '${interaction.commandName}' not found.`);
            }

            await command.execute(client, interaction);
        }
    },
} satisfies Event<Events.InteractionCreate>;
