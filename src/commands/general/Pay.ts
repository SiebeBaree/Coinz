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
                type: ApplicationCommandOptionType.String,
                description: "The amount of money you want to give.",
                required: true,
                min_value: 1,
                max_value: 8000,
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
        const amountStr = interaction.options.getString("amount", true);

        let amount = 1;
        if (amountStr.toLowerCase() === "all" || amountStr.toLowerCase() === "max") {
            if (member.wallet <= 0) {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: "You don't have any money in your wallet to give to someone!", ephemeral: true });
                return;
            }

            amount = Math.min(member.wallet, 8_000);
        } else {
            const newAmount = await User.removeBetMoney(amountStr, member, false, 1, 8_000);

            if (typeof newAmount === "string") {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: newAmount, ephemeral: true });
                return;
            }

            amount = newAmount;
        }

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

        await interaction.reply({ content: `:white_check_mark: You've sent :coin: ${amount} to **${user.tag}**.` });
        await Database.getMember(user.id, true);
        await User.addMoney(user.id, amount);
        await User.removeMoney(interaction.user.id, amount, true);
    }
}