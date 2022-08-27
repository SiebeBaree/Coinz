const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType, Colors } = require('discord.js');
const MemberModel = require("../../models/Member");

class Notification extends Command {
    info = {
        name: "notification",
        description: "Enable or disable notifications in Coinz.",
        options: [
            {
                name: 'status',
                type: ApplicationCommandOptionType.String,
                description: 'Enable or disable the notification.',
                required: true,
                choices: [
                    {
                        name: "enable",
                        value: "enable"
                    },
                    {
                        name: "disable",
                        value: "disable"
                    }
                ]
            },
            {
                name: 'notification',
                type: ApplicationCommandOptionType.String,
                description: 'What notification you want to enable/disable.',
                required: true,
                choices: [
                    {
                        name: "Vote",
                        value: "vote"
                    },
                    {
                        name: "Vote Reminders",
                        value: "voteReminder"
                    },
                    {
                        name: "Pickpocketing Alerts",
                        value: "steal"
                    }
                ]
            }
        ],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (data.user.notifs === undefined || data.user.notifs.vote === undefined) {
            data.user.notifs = {
                vote: true,
                voteReminder: true,
                steal: true
            };
        }

        const notification = interaction.options.getString('notification') || "vote";
        const statusStr = interaction.options.getString('status') || "enable";
        const status = statusStr === "enable";

        if (data.user.notifs[notification] === status) return await interaction.editReply({ content: `You already have this notification ${status ? "enabled" : "disabled"}.` });
        data.user.notifs[notification] = status;

        await MemberModel.updateOne(
            { id: interaction.member.id },
            { $set: { notifs: data.user.notifs } }
        );

        let notif;
        switch (notification) {
            case "voteReminder":
                notif = "Vote Reminder";
                break;
            case "steal":
                notif = "Pickpocketing Alerts";
                break;
            default:
                notif = "Vote";
                break;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${status ? "Enabled" : "Disabled"} the notification`)
            .setColor(status ? Colors.Green : Colors.Red)
            .setDescription(`You ${status ? "enabled" : "disabled"} the ${notif} notification. You won't get any notifications from this until you turn it back on.`)
        await interaction.editReply({ embeds: [embed] });
    }
}

module.exports = Notification;