import { ChatInputCommandInteraction } from "discord.js";
import { Info } from "../../../interfaces/ICommand";
import Member, { IMember } from "../../../models/Member";
import Bot from "../../../structs/Bot";
import jobs from "../../../assets/jobs.json";
import User from "../../../utils/User";

export default class {
    private readonly client: Bot;
    private readonly info: Info;

    constructor(client: Bot, info: Info) {
        this.client = client;
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const currentJob = jobs.find((j) => j.name === member.job);
        if (currentJob) {
            await interaction.reply({ content: `You already have a job. Please leave your current job with </${this.info.name} quit:983096143284174858>.`, ephemeral: true });
            return;
        }

        const jobName = interaction.options.getString("job-name", true);
        const jobIndex = jobs.findIndex((job) => job.name.toLowerCase() === jobName.toLowerCase());

        if (jobIndex === -1) {
            await interaction.reply({ content: "Invalid job name.", ephemeral: true });
            return;
        }

        const job = jobs[jobIndex];
        if (member.business !== "" && !job.canCombineWithBusiness) {
            await interaction.reply({ content: `You cannot be working as a ${job.name} and be working in a business. Please leave your business using </business leave:1048340073470513155>.`, ephemeral: true });
            return;
        }

        if (job.minLvl > User.getLevel(member.experience)) {
            await interaction.reply({ content: `You must be level ${job.minLvl} to work as a ${job.name}.`, ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        // check if member has all required items in their inventory
        const missingItems = job.required.filter((item) => !member.inventory.some((i) => i.itemId === item && i.amount >= 1));

        if (missingItems.length > 0) {
            await interaction.editReply({
                content: `You are missing the following items: ${missingItems.map((i) => {
                    const item = this.client.items.getById(i);
                    if (!item) return `\`${i}\``;
                    return `<:${item.itemId}:${item.emoteId}> **${item.name}**`;
                }).join(", ")}`,
            });
            return;
        }

        // remove required items from inventory
        job.required.forEach(async (item) => {
            const index = member.inventory.findIndex((i) => i.itemId === item);
            if (index === -1) return;

            if (member.inventory[index].amount > 1) {
                await Member.updateOne({ id: member.id, "inventory.itemId": item }, { $inc: { "inventory.$.amount": -1 } });
            } else {
                await Member.updateOne({ id: member.id }, { $pull: { inventory: { itemId: item } } });
            }
        });

        await Member.updateOne({ id: member.id }, { job: job.name });
        await interaction.editReply({ content: `You are now working as a ${job.name}.` });
    }
}