import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Achievement from "../../utils/Achievement";
import Embed from "../../utils/Embed";

export default class extends Command implements ICommand {
    readonly info = {
        name: "achievement",
        description: "Get a list of all achievements or refresh your achievements.",
        options: [
            {
                name: "list",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get a list with all achievements.",
                options: [],
            },
            {
                name: "refresh",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Scan for new achievements you might have received.",
                options: [],
            },
            {
                name: "select",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Select an achievement to display on your profile.",
                options: [
                    {
                        name: "achievement",
                        type: ApplicationCommandOptionType.String,
                        description: "The achievement you want to select.",
                        required: true,
                    },
                ],
            },
        ],
        category: "misc",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        switch (interaction.options.getSubcommand()) {
            case "list":
                await this.getList(interaction, member);
                break;
            case "refresh":
                await this.getRefresh(interaction, member);
                break;
            case "select":
                await this.getSelect(interaction, member);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    async getList(interaction: ChatInputCommandInteraction, member: IMember) {
        const createList = (page: number, itemsPerPage = 3): string => {
            const achievements = Array.from(Achievement.all.values()).splice(page * itemsPerPage, itemsPerPage);

            let returnValue = "";
            achievements.forEach((achievement) => {
                const progress = achievement.progress(member);

                let name = achievement.name;
                if (member.badges.includes(achievement.id)) name = `~~${name}~~`;

                returnValue += `<:${achievement.id}:${achievement.emoji}> **${name}**${progress ? ` (${progress})` : ""}\n> ${achievement.description}\n\n`;
            });
            return returnValue.trim();
        };

        const createEmbed = (desc: string, page: number, maxPage: number): EmbedBuilder => {
            return new EmbedBuilder()
                .setTitle("Achievements List")
                .setDescription(desc ?? "No achievements found.")
                .setColor(<ColorResolvable>this.client.config.embed.color)
                .setFooter({ text: `/${this.info.name} refresh to get new achievements. ─ Page ${page + 1} of ${maxPage}.` });
        };

        let page = 0;
        const ItemsPerPage = 7;
        const maxPage = Math.ceil(Achievement.all.size / ItemsPerPage);

        const message = await interaction.reply({ embeds: [createEmbed(createList(page, ItemsPerPage), page, maxPage)], components: Embed.getPageButtons(page, maxPage), fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: maxPage > 10 ? maxPage : 10, time: 90_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (i.customId.startsWith("page_")) {
                switch (i.customId) {
                    case "page_ToFirstPage":
                        page = 0;
                        break;
                    case "page_ToPreviousPage":
                        page--;
                        break;
                    case "page_ToNextPage":
                        page++;
                        break;
                    case "page_ToLastPage":
                        page = maxPage - 1;
                        break;
                }

                await i.update({ embeds: [createEmbed(createList(page, ItemsPerPage), page, maxPage)], components: Embed.getPageButtons(page, maxPage) });
            }
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: Embed.getPageButtons(page, maxPage, true) });
        });
    }

    async getRefresh(interaction: ChatInputCommandInteraction, member: IMember) {
        const achievements = Array.from(Achievement.all.values())
            .filter((achievement) => achievement.hasAchieved(member) && !member.badges.includes(achievement.id));

        if (!achievements.length) return await interaction.reply({ content: "You don't have any new achievements.", ephemeral: true });
        await Member.updateOne({ id: member.id }, { $push: { badges: { $each: achievements.map((achievement) => achievement.id) } } });

        const embed = new EmbedBuilder()
            .setTitle("New Achievements")
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(achievements.map((achievement) => `<:${achievement.id}:${achievement.emoji}> **${achievement.name}**`).join("\n"));
        await interaction.reply({ embeds: [embed] });
    }

    async getSelect(interaction: ChatInputCommandInteraction, member: IMember) {
        const achievementName = interaction.options.getString("achievement", true).toLowerCase();

        const achievement = Achievement.getById(achievementName) ?? Achievement.getByName(achievementName);
        if (!achievement) return await interaction.reply({ content: "That achievement doesn't exist.", ephemeral: true });
        if (!member.badges.includes(achievement.id)) return await interaction.reply({ content: "You don't have that achievement.", ephemeral: true });

        await Member.updateOne({ id: member.id }, { $set: { displayedBadge: achievement.id } });
        await interaction.reply({ content: `You have selected the achievement <:${achievement.id}:${achievement.emoji}> **${achievement.name}**.` });
    }
}