import { ChatInputCommandInteraction, EmbedBuilder, Colors, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Business from "../../models/Business";

export default class extends Command implements ICommand {
    readonly info = {
        name: "reset",
        description: "Reset your account on EVERY server.",
        options: [],
        category: "misc",
        cooldown: 86400,
        deferReply: true,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const confirmEmbed = new EmbedBuilder()
            .setTitle("Are you sure you want to reset your account?")
            .setDescription("This will reset your account on EVERY server you're in.")
            .setColor(Colors.Red)
            .setTimestamp(new Date())
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined });

        const confirmRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("reset_confirm")
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("reset_cancel")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Secondary),
            );

        const message = await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow] });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 15_000, max: 1, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (i.customId === "reset_confirm") {
                await i.deferUpdate();
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

                await Member.updateOne(
                    { id: interaction.user.id },
                    {
                        $set: {
                            premium: {
                                active: member.premium.active,
                                expires: member.premium.expires,
                                tier: member.premium.tier,
                            },
                        },
                    },
                );

                const successEmbed = new EmbedBuilder()
                    .setTitle("Successfully reset your account!")
                    .setDescription("Your account has been reset on EVERY server you're in.")
                    .setColor(Colors.Green)
                    .setTimestamp(new Date())
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined });
                await interaction.editReply({ embeds: [successEmbed] });
            } else if (i.customId === "reset_cancel") {
                const cancelEmbed = new EmbedBuilder()
                    .setTitle("Cancelled")
                    .setDescription("Your account has not been reset on ANY server.")
                    .setColor(Colors.Red)
                    .setTimestamp(new Date())
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined });
                await i.update({ embeds: [cancelEmbed] });
            }
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [] });
        });
    }
}