import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Database from "../../utils/Database";
import Member from "../../models/Member";
import Achievement from "../../utils/Achievement";

export default class extends Command implements ICommand {
    readonly info = {
        name: "badge",
        description: "Add/Remove a badge from a user",
        options: [
            {
                name: "option",
                description: "Add/Remove a badge from a user",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "add",
                        value: "add",
                    },
                    {
                        name: "remove",
                        value: "remove",
                    },
                ],
            },
            {
                name: "user",
                description: "The user to add/remove a badge of",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: "badge",
                description: "The id or name of the badge to add/remove",
                type: ApplicationCommandOptionType.Integer,
                required: true,
                min_length: 1,
                max_length: 32,
            },
        ],
        category: "admin",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.guildId !== this.client.config.adminServerId) return;

        const user = interaction.options.getUser("user", true);
        const badge = interaction.options.getString("badge", true).toLowerCase();
        const option = interaction.options.getString("option", true);

        await interaction.deferReply({ ephemeral: true });
        const member = await Database.getMember(user.id, true);

        if (option === "add") {
            if (member.badges.includes(badge)) {
                await interaction.editReply("That user already has that badge!");
            } else {
                const achievement = Achievement.getById(badge) ?? Achievement.getByName(badge);

                if (!achievement) {
                    await interaction.editReply("That badge doesn't exist!");
                    return;
                }

                await Member.updateOne({ id: user.id }, { $push: { badges: badge } });
                await interaction.editReply(`Added <:${achievement.id}:${achievement.emoji}> **${achievement.name}** to ${user.tag}!`);
            }
        } else if (option === "remove") {
            if (!member.badges.includes(badge)) {
                await interaction.editReply("That user doesn't have that badge!");
                return;
            }

            await Member.updateOne({ id: user.id }, { $pull: { badges: badge } });
            await interaction.editReply(`Removed \`${badge}\` from ${user.tag}!`);
        }
    }
}