import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";
import Database from "../../utils/Database";

export default class extends Command implements ICommand {
    readonly info = {
        name: "pay",
        description: "Give some of your money to another user.",
        options: [
            {
                name: "user",
                type: ApplicationCommandOptionType.User,
                description: "The user you want to give money to.",
                required: true,
            },
            {
                name: "amount",
                type: ApplicationCommandOptionType.Integer,
                description: "The amount of money you want to give.",
                required: true,
                min_value: 1,
                max_value: 7000,
            },
        ],
        category: "general",
        cooldown: 21600,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const user = interaction.options.getUser("user", true);
        const amount = interaction.options.getInteger("amount", true);

        if (user.id === interaction.user.id || user.bot) {
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: ":x: You can't give money to yourself or a bot.", ephemeral: true });
            return;
        }

        if (member.wallet < amount) {
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: ":x: You don't have that much money in your wallet.", ephemeral: true });
            return;
        }

        await interaction.deferReply();
        await Database.getMember(user.id, true);
        await User.addMoney(user.id, amount);
        await User.removeMoney(interaction.user.id, amount);
        await interaction.editReply({ content: `:white_check_mark: You've sent :coin: ${amount} to **${user.tag}**.` });
    }
}