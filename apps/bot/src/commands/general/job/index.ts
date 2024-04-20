import { ApplicationCommandOptionType } from 'discord.js';
import jobs from '../../../data/jobs.json';
import type { Command } from '../../../domain/Command';
import jobApply from './apply';
import jobLeave from './leave';
import jobList from './list';
import jobWork from './work';

export default {
    data: {
        name: 'job',
        description: 'Get a job to pay for the bills.',
        category: 'misc',
        options: [
            {
                name: 'work',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Work an hour to earn money.',
                options: [],
            },
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list with all jobs.',
                options: [],
            },
            {
                name: 'leave',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Leave your current job.',
                options: [],
            },
            {
                name: 'apply',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Apply for a job.',
                options: [
                    {
                        name: 'job-name',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of the job you want to apply for.',
                        required: true,
                        choices: jobs.map((job) => ({ name: job.name, value: job.name })),
                    },
                ],
            },
        ],
        usage: ['work', 'list', 'leave', 'apply <job-name>'],
    },
    async execute(client, interaction, member) {
        switch (interaction.options.getSubcommand()) {
            case 'work':
                await jobWork(client, interaction, member);
                break;
            case 'list':
                await jobList(client, interaction, member);
                break;
            case 'leave':
                await jobLeave(interaction, member);
                break;
            case 'apply':
                await jobApply(client, interaction, member);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
