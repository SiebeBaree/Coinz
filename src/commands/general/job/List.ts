import { ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder } from "discord.js";
import { Info } from "../../../interfaces/ICommand";
import { IMember } from "../../../models/Member";
import Bot from "../../../structs/Bot";
import jobs from "../../../assets/jobs.json";
import User from "../../../utils/User";
import Embed from "../../../utils/Embed";

export default class {
    private readonly client: Bot;
    private readonly info: Info;

    constructor(client: Bot, info: Info) {
        this.client = client;
        this.info = info;
    }

    private readonly ItemsPerPage = 4;

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        let page = 0;
        const maxPage = Math.ceil(jobs.length / this.ItemsPerPage);

        const message = await interaction.reply({ embeds: [this.getEmbed(member, page, 1)], components: Embed.getPageButtons(page, maxPage), fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 15, idle: 20_000, time: 75_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (i.customId.startsWith("page_")) page = Embed.calculatePageNumber(i.customId, page, maxPage);
            await i.update({ embeds: [this.getEmbed(member, page, maxPage)], components: Embed.getPageButtons(page, maxPage) });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: Embed.getPageButtons(page, maxPage, true) });
        });
    }

    getEmbed(member: IMember, page: number, maxPage: number): EmbedBuilder {
        const level = User.getLevel(member.experience);

        const selectedJobs = jobs.slice(page * this.ItemsPerPage, (page + 1) * this.ItemsPerPage);
        const desc = `:moneybag: **To apply for a job use** </${this.info.name} apply:983096143284174858>**.**\n:o: **You can only apply for jobs with** :white_check_mark:\n:mans_shoe: **Leave a job by using** </${this.info.name} leave:983096143284174858>**.**\n\n` +
            selectedJobs.map((job) => {
                const icon = level >= job.minLvl ? ":white_check_mark:" : ":o:";
                const items = job.required.map((i) => {
                    const item = this.client.items.getById(i);
                    if (!item) return `\`${i}\``;
                    return `<:${item.itemId}:${item.emoteId}> **${item.name}**`;
                }).join(", ");
                return `${icon} **${job.name}** ― :coin: ${job.salary} / hour\n> Minimum Level: \`${job.minLvl}\`${items ? `\n> Required Items: ${items}` : ""}`;
            }).join("\n\n");

        return new EmbedBuilder()
            .setTitle("List of jobs")
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: `/${this.info.name} apply [job-name] to apply for a job. ─ Page ${page + 1} of ${maxPage}.` })
            .setDescription(desc);
    }
}