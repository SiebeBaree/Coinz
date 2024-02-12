import type { ChatInputCommandInteraction } from 'discord.js';
import jobs from '../../../data/jobs.json';
import type Bot from '../../../domain/Bot';
import type { Job } from '../../../lib/types';
import type { IMember } from '../../../models/member';
import Member from '../../../models/member';
import { getLevel, msToTime } from '../../../utils';

export default async function jobApply(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const currentJob = jobs.find((j) => j.name === member.job);
    if (currentJob) {
        await interaction.reply({
            content: `You already have a job. Please leave your current job with \`/job leave\`.`,
            ephemeral: true,
        });
        return;
    }

    const cooldown = await client.cooldown.getCooldown(member.id, 'job.apply');
    if (cooldown) {
        await interaction.reply({
            content: `You can apply for a job again in ${msToTime(
                Math.abs(Number.parseInt(cooldown, 10) - Math.floor(Date.now() / 1_000)) * 1_000,
            )}.`,
            ephemeral: true,
        });
        return;
    }

    const jobName = interaction.options.getString('job-name', true);
    const job = jobs.find((j) => j.name === jobName) as Job | undefined;
    if (!job) {
        await interaction.reply({ content: 'Invalid job name.', ephemeral: true });
        return;
    }

    if (job.minLvl > getLevel(member.experience)) {
        await interaction.reply({
            content: `You must be level ${job.minLvl} to work as a ${job.name}.`,
            ephemeral: true,
        });
        return;
    }

    const missingItems = job.requiredItems.filter(
        (item) => !member.inventory.some((i) => i.itemId === item && i.amount >= 1),
    );

    if (missingItems.length > 0) {
        await interaction.reply({
            content: `You are missing the following items: ${missingItems
                .map((i) => {
                    const item = client.items.getById(i);
                    if (!item) return `\`${i}\``;
                    return client.items.getItemString(item);
                })
                .join(', ')}`,
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({ content: `You are now working as a ${job.name}.`, ephemeral: true });
    await client.cooldown.setCooldown(member.id, 'job.apply', 259_200);

    for (const requiredItem of job.requiredItems) {
        const item = client.items.getInventoryItem(requiredItem, member);
        if (!item) continue;
        await client.items.removeItem(item.itemId, member, 1);
    }

    await Member.updateOne({ id: member.id }, { job: job.name });
}
