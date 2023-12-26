import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type Bot from '../domain/Bot';
import type { Command } from '../domain/Command';
import { createTicket } from '../utils/ticket';

async function getCreateTicket(client: Bot, interaction: ChatInputCommandInteraction) {
    if (interaction.member === null || interaction.guild === null || interaction.member.user.bot) {
        await interaction.reply({
            content: 'An error occurred while trying to create a ticket. Please try again later.',
            ephemeral: true,
        });
        return;
    }

    const response = await createTicket(
        client,
        interaction.guild,
        interaction.member as GuildMember,
        'default',
        'test',
    );

    if (!response.isCreated) {
        await interaction.reply({
            content: `:x: ${response.reason}`,
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
        content: `:white_check_mark: Your ticket has been created. You can find it at <#${response.ticketId}>.`,
        ephemeral: true,
    });
}

export default {
    data: {
        name: 'ticket',
        description: 'Create, close and manage tickets.',
        options: [
            {
                name: 'create',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Create a ticket.',
            },
            // {
            //     name: 'close',
            //     type: ApplicationCommandOptionType.Subcommand,
            //     description: '',
            // },
            // {
            //     name: 'claim',
            //     type: ApplicationCommandOptionType.Subcommand,
            //     description: '',
            // },
            // {
            //     name: 'edit',
            //     type: ApplicationCommandOptionType.Subcommand,
            //     description: '',
            // },
        ],
    },
    async execute(client, interaction) {
        switch (interaction.options.getSubcommand()) {
            case 'create':
                await getCreateTicket(client, interaction);
                break;
            // case 'close':
            //     await closeTicket(client, interaction);
            //     break;
            // case 'claim':
            //     await claimTicket(client, interaction);
            //     break;
            // case 'edit':
            //     await editTicket(client, interaction);
            //     break;
            default:
                await interaction.reply({
                    content:
                        'Invalid arguments... Please ping one of the staff members if you think this is a mistake.',
                    ephemeral: true,
                });
        }
    },
} satisfies Command;
