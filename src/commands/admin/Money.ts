import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Database from "../../utils/Database";
import Member from "../../models/Member";

export default class extends Command implements ICommand {
    readonly info = {
        name: "money",
        description: "Set/Add/Remove money from a user",
        options: [
            {
                name: "option",
                description: "Set/Add/Remove money from a user",
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
                name: "location",
                description: "Wallet or Bank",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "wallet",
                        value: "wallet",
                    },
                    {
                        name: "bank",
                        value: "bank",
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
        const location = interaction.options.getString("location", true);

        await interaction.deferReply({ ephemeral: true });
        await Database.getMember(user.id, true);

        if (option === "set") {
            if (location === "wallet") {
                await Member.updateOne({ id: user.id }, { wallet: amount });
            } else if (location === "bank") {
                await Member.updateOne({ id: user.id }, { bank: amount });
            }

            await interaction.editReply(`Set ${user.tag}'s ${location} to :coin: ${amount}`);
        } else if (option === "add") {
            if (location === "wallet") {
                await Member.updateOne({ id: user.id }, { $inc: { wallet: amount } });
            } else if (location === "bank") {
                await Member.updateOne({ id: user.id }, { $inc: { bank: amount } });
            }

            await interaction.editReply(`Added :coin: ${amount} to ${user.tag}'s ${location}`);
        } else if (option === "remove") {
            if (location === "wallet") {
                await Member.updateOne({ id: user.id }, { $inc: { wallet: -amount } });
            } else if (location === "bank") {
                await Member.updateOne({ id: user.id }, { $inc: { bank: -amount } });
            }

            await interaction.editReply(`Removed :coin: ${amount} from ${user.tag}'s ${location}`);
        }
    }
}