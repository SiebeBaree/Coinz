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
                description: 'Change the status of a user setting.',
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
}