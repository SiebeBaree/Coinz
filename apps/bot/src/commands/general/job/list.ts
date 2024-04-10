import type { ChatInputCommandInteraction, ColorResolvable } from 'discord.js';
import { ComponentType, EmbedBuilder } from 'discord.js';
import jobs from '../../../data/jobs.json';
import type Bot from '../../../domain/Bot';
import type { IMember } from '../../../models/member';
import { filter, getLevel } from '../../../utils';
import { calculatePageNumber, getPageButtons } from '../../../utils/embed';

function getEmbed(client: Bot, member: IMember, page: number, maxPage: number, ItemsPerPage: number): EmbedBuilder {
    const level = getLevel(member.experience);

    const selectedJobs = jobs.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
    const desc =
        `:moneybag: **To apply for a job use** \`/job apply <job-name>\`**.**\n:x: **You can only apply for jobs with** :white_check_mark:\n:mans_shoe: **Leave a job by using** \`/job leave\`**.**\n\n` +
        selectedJobs
            .map((job) => {
                const icon = level >= job.minLvl ? ':white_check_mark:' : ':x:';
                const items = job.requiredItems
                    .map((i) => {
                        const item = client.items.getById(i);
                        if (!item) return `\`${i}\``;
                        return client.items.getItemString(item);
                    })
                    .join(', ');
                return `${icon} **${job.name}** ― :coin: ${job.salary} / hour\n> Min. Level: \`${
                    job.minLvl
                }\` ― Work needed per week: \`${job.workPerWeek}\`${items ? `\n> Required Items: ${items}` : ''}`;
            })
            .join('\n\n');

    return new EmbedBuilder()
        .setTitle('List of jobs')
        .setColor(client.config.embed.color as ColorResolvable)
        .setFooter({ text: `/job apply [job-name] to apply for a job. ─ Page ${page + 1} of ${maxPage}.` })
        .setDescription(desc);
}

export default async function jobList(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    let page = 0;
    const ItemsPerPage = 6;
    const maxPage = Math.ceil(jobs.length / ItemsPerPage);

    const message = await interaction.reply({
        embeds: [getEmbed(client, member, page, maxPage, ItemsPerPage)],
        components: getPageButtons(page, maxPage),
        fetchReply: true,
    });
    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        max: 15,
        idle: 20_000,
        time: 75_000,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i) => {
        if (i.customId.startsWith('page_')) page = calculatePageNumber(i.customId, page, maxPage);
        await i.update({
            embeds: [getEmbed(client, member, page, maxPage, ItemsPerPage)],
            components: getPageButtons(page, maxPage),
        });
    });

    collector.on('end', async () => {
        await interaction.editReply({ components: getPageButtons(page, maxPage, true) });
    });
}
