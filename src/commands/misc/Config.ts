import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import Helpers from "../../utils/Helpers";
import moment from "moment";
import Filter from "bad-words";

export default class extends Command implements ICommand {
    readonly info = {
        name: "config",
        description: "Change settings for your account.",
        options: [
            {
                name: "notification",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Set the status of a notification.",
                options: [
                    {
                        name: "notification",
                        type: ApplicationCommandOptionType.String,
                        description: "The notification you want to change.",
                        required: true,
                        choices: [
                            {
                                name: "Vote Notifications",
                                value: "vote",
                                focused: true,
                            },
                            {
                                name: "Vote Reminders",
                                value: "vote-reminder",
                                focused: true,
                            },
                            {
                                name: "Steal Notification",
                                value: "steal",
                                focused: true,
                            },
                        ],
                    },
                    {
                        name: "value",
                        type: ApplicationCommandOptionType.String,
                        description: "Enable/Disable the notification.",
                        required: true,
                        choices: [
                            {
                                name: "Enable",
                                value: "true",
                                focused: true,
                            },
                            {
                                name: "Disable",
                                value: "false",
                            },
                        ],
                    },
                ],
            },
            {
                name: "profile",
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: "Change your profile settings.",
                options: [
                    {
                        name: "profile-color",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Change your profile color.",
                        options: [
                            {
                                name: "color",
                                type: ApplicationCommandOptionType.String,
                                description: "The color you want to change to.",
                                required: true,
                                choices: [
                                    {
                                        name: "Default",
                                        value: this.client.config.embed.color,
                                        focused: true,
                                    },
                                    {
                                        name: "White",
                                        value: "#F2F3F5",
                                    },
                                    {
                                        name: "Black",
                                        value: "#000001",
                                    },
                                    {
                                        name: "Red",
                                        value: "#CF0A0A",
                                    },
                                    {
                                        name: "Blue",
                                        value: "#009EFF",
                                    },
                                    {
                                        name: "Pink",
                                        value: "#F56EB3",
                                    },
                                    {
                                        name: "Purple",
                                        value: "#A555EC",
                                    },
                                    {
                                        name: "Green",
                                        value: "#00A758",
                                    },
                                    {
                                        name: "Dark Grey",
                                        value: "#2F3136",
                                    },
                                    {
                                        name: "Teal",
                                        value: "#00B9A8",
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        name: "set-birthday",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Set your birthday.",
                        options: [
                            {
                                name: "birthday",
                                type: ApplicationCommandOptionType.String,
                                description: "Your birthday in the format of DD/MM/YYYY.",
                                required: true,
                                min_length: 8,
                                max_length: 10,
                            },
                        ],
                    },
                    {
                        name: "set-bio",
                        type: ApplicationCommandOptionType.Subcommand,
                        description: "Set your bio for your profile.",
                        options: [
                            {
                                name: "bio",
                                type: ApplicationCommandOptionType.String,
                                description: "Your bio for your profile, leave blank to remove your bio.",
                                required: true,
                                min_length: 0,
                                max_length: 100,
                            },
                        ],
                    },
                ],
            },
            {
                name: "passive-mode",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Turn passive mode on or off.",
                options: [
                    {
                        name: "value",
                        type: ApplicationCommandOptionType.String,
                        description: "Enable/Disable passive mode.",
                        required: true,
                        choices: [
                            {
                                name: "Enable",
                                value: "true",
                                focused: true,
                            },
                            {
                                name: "Disable",
                                value: "false",
                            },
                        ],
                    },
                ],
            },
        ],
        category: "misc",
    };

    private readonly filter: Filter;

    constructor(bot: Bot, file: string) {
        super(bot, file);
        this.filter = new Filter({
            list: ["dank memer"],
        });
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        switch (interaction.options.getSubcommand()) {
            case "notification":
                await this.configNotification(interaction, member);
                break;
            case "profile-color":
                await this.configProfileColor(interaction, member);
                break;
            case "set-birthday":
                await this.configSetBirthday(interaction);
                break;
            case "set-bio":
                await this.configSetBio(interaction);
                break;
            case "passive-mode":
                await this.configPassiveMode(interaction, member);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    private async configNotification(interaction: ChatInputCommandInteraction, member: IMember) {
        const notification = interaction.options.getString("notification", true);
        const value = interaction.options.getString("value", true);

        if (value === "true" && member.notifications.includes(notification)) {
            await interaction.reply({ content: "You already have this notification enabled.", ephemeral: true });
            return;
        } else if (value !== "true" && !member.notifications.includes(notification)) {
            await interaction.reply({ content: "You already have this notification disabled.", ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });
        if (value === "true") {
            await Member.updateOne({ id: interaction.user.id }, { $push: { notifications: notification } });
        } else {
            await Member.updateOne({ id: interaction.user.id }, { $pull: { notifications: notification } });
        }

        await interaction.editReply({ content: `Successfully ${value === "true" ? "enabled" : "disabled"} the notification.` });
    }

    private async configProfileColor(interaction: ChatInputCommandInteraction, member: IMember) {
        const color = interaction.options.getString("color", true);

        if (member.profileColor === color) {
            await interaction.reply({ content: "You already have this profile color set.", ephemeral: true });
            return;
        }

        await Member.updateOne({ id: interaction.user.id }, { profileColor: color });

        const embed = new EmbedBuilder()
            .setTitle(`Changed your profile color to \`${color}\`.`)
            .setColor(<ColorResolvable>color);
        await interaction.reply({ embeds: [embed] });
    }

    private async configSetBirthday(interaction: ChatInputCommandInteraction) {
        const birthday = interaction.options.getString("birthday", true);

        // check if the birthday is valid
        const date = moment(birthday, "DD/MM/YYYY");
        if (!date.isValid()) {
            await interaction.reply({ content: "Invalid birthday format, please use DD/MM/YYYY.", ephemeral: true });
            return;
        }

        // check if the birthday is in the future
        if (date.isAfter(moment())) {
            await interaction.reply({ content: "Your birthday can't be in the future.", ephemeral: true });
            return;
        }

        // check if the birthday is more than 100 years ago
        if (date.isBefore(moment().subtract(100, "years"))) {
            await interaction.reply({ content: "Your birthday can't be more than 100 years ago.", ephemeral: true });
            return;
        }

        // check if the birthday is less than 13 years ago
        if (date.isAfter(moment().subtract(13, "years"))) {
            await interaction.reply({ content: "You must be at least 13 years old to use Discord.", ephemeral: true });
            return;
        }

        await Member.updateOne({ id: interaction.user.id }, { birthday: date.toDate() });
        const embed = new EmbedBuilder()
            .setTitle(`Set your birthday to \`${date.format("DD/MM/YYYY")}\`.`)
            .setColor(<ColorResolvable>this.client.config.embed.darkColor);
        await interaction.reply({ embeds: [embed] });
    }

    private async configSetBio(interaction: ChatInputCommandInteraction) {
        const bio = interaction.options.getString("bio", true);
        if (this.filter.isProfane(bio)) {
            await interaction.reply({ content: "Your bio contains a banned word.", ephemeral: true });
            return;
        }

        if (bio.length > 100) {
            await interaction.reply({ content: "Your bio can only be 100 characters long.", ephemeral: true });
            return;
        }

        await Member.updateOne({ id: interaction.user.id }, { $set: { bio: bio } });

        if (bio.length === 0) {
            await interaction.reply({ content: "Successfully removed your bio." });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("Set your bio to")
            .setDescription(">>> " + bio)
            .setColor(<ColorResolvable>this.client.config.embed.darkColor);
        await interaction.reply({ embeds: [embed] });
    }

    private async configPassiveMode(interaction: ChatInputCommandInteraction, member: IMember) {
        const value = interaction.options.getString("value", true);

        const cooldown = await Cooldown.getRemainingCooldown(interaction.user.id, "config.passive-mode");
        if (cooldown > 0) {
            await interaction.reply({ content: `:x: You have to wait ${Helpers.msToTime(cooldown * 1000)} toggle your passive mode again.`, ephemeral: true });
            return;
        }

        if (value === "true" && member.passiveMode) {
            await interaction.reply({ content: "You already have passive mode enabled.", ephemeral: true });
            return;
        } else if (value !== "true" && !member.passiveMode) {
            await interaction.reply({ content: "You already have passive mode disabled.", ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        await Cooldown.setCooldown(interaction.user.id, "config.passive-mode", 86400 * 7);
        await Member.updateOne({ id: interaction.user.id }, { passiveMode: value === "true" });

        await interaction.editReply({ content: `Successfully ${value === "true" ? "enabled" : "disabled"} passive mode.` });
    }
}