import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder, ButtonStyle,
    ChatInputCommandInteraction, Colors,
    EmbedBuilder,
} from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import Member, { IMember } from "../../models/Member";
import Business from "../../models/Business";
import UserStats from "../../models/UserStats";

export default class extends Command implements ICommand {
    readonly info = {
        name: "reset",
        description: "Reset your account on EVERY server.",
        options: [
            {
                name: "confirm",
                type: ApplicationCommandOptionType.String,
                description: "Type \"confirm\" to confirm.",
                required: true,
            },
        ],
        category: "misc",
        cooldown: 86400,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const confirm = interaction.options.getString("confirm", true);
        if (confirm !== "confirm") {
            const embed = new EmbedBuilder()
                .setTitle("You must type \"confirm\" to confirm.")
                .setColor(Colors.Red)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? this.client.config.embed.icon });
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });

        if (member.business !== "") {
            const business = await Business.findOne({ name: member.business });
            if (business) {
                const ceo = business.employees.find((e) => e.role === "ceo");

                if (ceo?.userId === interaction.user.id) {
                    for (const employee of business.employees) {
                        await Member.updateOne({ id: employee.userId }, { $set: { business: "" } });
                    }

                    await Business.deleteOne({ name: member.business });
                } else {
                    await Business.updateOne(
                        { name: member.business },
                        { $pull: { employees: { userId: interaction.user.id } } },
                    );
                }
            }
        }

        await Member.deleteOne({ id: interaction.user.id });
        await UserStats.deleteOne({ id: interaction.user.id });
        const embed = new EmbedBuilder()
            .setTitle("Successfully reset your account!")
            .setDescription("Your account has been reset on EVERY server you're in.")
            .setColor(Colors.Green)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? this.client.config.embed.icon });
        await interaction.editReply({ embeds: [embed] });
    }
}