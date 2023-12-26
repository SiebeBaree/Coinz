import type { GuildMember } from 'discord.js';
import { Events } from 'discord.js';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';
import { claimTicket } from '../utils/ticket';

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(client, interaction) {
        if (interaction.isChatInputCommand()) {
            if (!interaction.guild || !interaction.guild.available || interaction.user.bot) return;

            const command = client.commands.get(interaction.commandName);

            if (!command || command.data.enabled === false) {
                throw new Error(`Command '${interaction.commandName}' not found.`);
            }

            if (command.data.deferReply === true) {
                await interaction.deferReply();
            }

            try {
                await command.execute(client, interaction);
            } catch (error) {
                logger.error((error as Error).stack ?? (error as Error).message);

                const errorMsg = 'There was an error while executing this command! Please try again.';
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: errorMsg });
                } else {
                    await interaction.reply({ content: errorMsg, ephemeral: true });
                }
            }
        } else if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
            const action = interaction.customId.split('_')[1];

            if (action === 'claim') {
                const claim = await claimTicket(client, interaction.member as GuildMember, interaction.channelId);

                if (!claim.isClaimed) {
                    await interaction.reply({ content: claim.reason ?? 'Unable to claim ticket.', ephemeral: true });
                    return;
                }

                await interaction.reply({
                    content: 'You have successfully claimed this ticket.',
                    ephemeral: true,
                });
            } else if (action === 'edit') {
            } else {
            }
        }
    },
} satisfies Event<Events.InteractionCreate>;
