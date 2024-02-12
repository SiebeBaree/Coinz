import type { ChatInputCommandInteraction } from 'discord.js';
import type { IMember } from '../../../models/member';
import Member from '../../../models/member';

export default async function jobLeave(interaction: ChatInputCommandInteraction, member: IMember) {
    if (member.job === '') {
        await interaction.reply({
            content: "You don't have a job. Apply for a job using `/job apply <job-name>`.",
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({ content: 'You have successfully left your job.', ephemeral: true });
    await Member.updateOne({ id: member.id }, { $set: { job: '' } });
}
