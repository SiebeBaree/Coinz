import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Database from "../../utils/Database";
import Member from "../../models/Member";

export default class extends Command implements ICommand {
    readonly info = {
        name: "tickets",
        description: "Set/Add/Remove tickets from a user",
        options: [
            {
                name: "option",
                description: "Set/Add/Remove tickets from a user",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "set",
                        value: "set",
                    },
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
                description: "The user to set the money of",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: "amount",
                description: "The amount of money to set",
                type: ApplicationCommandOptionType.Integer,
                required: true,
                min: 0,
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
        const amount = interaction.options.getInteger("amount", true);
        const option = interaction.options.getString("option", true);

        await interaction.deferReply({ ephemeral: true });
        await Database.getMember(user.id, true);

        if (option === "set") {
            await Member.updateOne({ id: user.id }, { $set: { tickets: amount } });
            await interaction.editReply(`Set ${user.tag}'s <:ticket:1032669959161122976> ${amount}`);
        } else if (option === "add") {
            await Member.updateOne({ id: user.id }, { $inc: { tickets: amount } });
            await interaction.editReply(`Added <:ticket:1032669959161122976> ${amount} to ${user.tag}`);
        } else if (option === "remove") {
            await Member.updateOne({ id: user.id }, { $inc: { tickets: -amount } });
            await interaction.editReply(`Removed <:ticket:1032669959161122976> ${amount} from ${user.tag}`);
        }
    }
}