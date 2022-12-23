import Command from "../../structures/Command.js"
import { EmbedBuilder, ApplicationCommandOptionType, Colors } from "discord.js"
import MemberModel from "../../models/Member.js"

export default class extends Command {
    info = {
        name: "user-config",
        description: "Change your user settings in every server.",
        options: [
            {
                name: 'set-notification',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Set the status of a notification.',
                options: [
                    {
                        name: 'notification',
                        type: ApplicationCommandOptionType.String,
                        description: 'The notification you want to change.',
                        required: true,
                        choices: [
                            {
                                name: "Vote Notifications",
                                value: "vote",
                                focused: true
                            },
                            {
                                name: "Vote Reminders",
                                value: "voteReminder"
                            }
                        ]
                    },
                    {
                        name: 'value',
                        type: ApplicationCommandOptionType.String,
                        description: 'Enable/Disable the setting.',
                        required: true,
                        choices: [
                            {
                                name: "Enable",
                                value: "true",
                                focused: true
                            },
                            {
                                name: "Disable",
                                value: "false"
                            },
                            {
                                name: "Default",
                                value: "default"
                            }
                        ]
                    }
                ]
            },
            {
                name: 'profile-color',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Change your profile color. (Only for premium users)',
                options: [
                    {
                        name: 'color',
                        type: ApplicationCommandOptionType.String,
                        description: 'The color you want to change to.',
                        required: true,
                        choices: [
                            {
                                name: "Default",
                                value: bot.config.embed.color,
                                focused: true
                            },
                            {
                                name: "White",
                                value: "#F2F3F5"
                            },
                            {
                                name: "Black",
                                value: "#000001"
                            },
                            {
                                name: "Red",
                                value: "#CF0A0A"
                            },
                            {
                                name: "Blue",
                                value: "#009EFF"
                            },
                            {
                                name: "Pink",
                                value: "#F56EB3"
                            },
                            {
                                name: "Purple",
                                value: "#A555EC"
                            },
                            {
                                name: "Green",
                                value: "#00A758"
                            },
                            {
                                name: "Dark Grey",
                                value: "#2F3136"
                            },
                            {
                                name: "Teal",
                                value: "#00B9A8"
                            }
                        ]
                    }
                ]
            }
        ],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "set-notification") return await this.configNotifications(interaction, data);
        if (interaction.options.getSubcommand() === "profile-color") return await this.configProfileColor(interaction, data);
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.`, ephemeral: true });
    }

    async configNotifications(interaction, data) {
        const notificationNames = {
            vote: 'Vote',
            voteReminder: 'Vote Reminder',
            steal: 'Steal'
        };

        await interaction.deferReply();
        if (data.user.notifications === undefined) data.user.notifications = [];
        const notification = interaction.options.getString('notification') || "vote";
        let value = interaction.options.getString('value') || "true";

        if (value === "default") {
            data.user.notifications.filter(item => item !== notification);
        } else if (data.user.notifications.includes(notification)) {
            return await interaction.editReply({ content: `You already have this notification ${value === "true" ? "enabled" : "disabled"}.` });
        }

        await MemberModel.updateOne(
            { id: interaction.member.id },
            { $set: { notifications: data.user.notifications } }
        );

        if (value === "default") value = "true";
        const embed = new EmbedBuilder()
            .setTitle(`Changed status of a notification.`)
            .setColor(value === "true" ? Colors.Green : Colors.Red)
            .setDescription(`Changed the status of the \`${notificationNames[notification]}\` notification to \`${value === "true" ? "enabled" : "disabled"}\`.`)
        await interaction.editReply({ embeds: [embed] });
    }

    async configProfileColor(interaction, data) {
        if (!data.premium.isPremium) return await interaction.reply({ content: `You need to be a premium user to change your profile color. For more info use \`/premium\`.`, ephemeral: true });

        await interaction.deferReply();
        const color = interaction.options.getString('color') ?? bot.config.embed.color;

        await MemberModel.updateOne(
            { id: interaction.member.id },
            { $set: { profileColor: color } },
            { upsert: true }
        );

        const embed = new EmbedBuilder()
            .setTitle(`Changed your profile color to \`${color}\`.`)
            .setColor(color)
        await interaction.editReply({ embeds: [embed] });
    }
}