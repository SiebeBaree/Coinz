import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import Member, { IMember } from "../../models/Member";
import User from "../../lib/User";
import UserStats from "../../models/UserStats";

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
                max_value: 5000,
            },
        ],
        category: "general",
        cooldown: 7200,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const user = interaction.options.getUser("user", true);
        const amountStr = interaction.options.getString("amount", true);

        let amount: number = 1;
        if (amountStr.toLowerCase() === "all" || amountStr.toLowerCase() === "max") {
            if (member.wallet <= 0) {
                await this.client.cooldown.deleteCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: "You don't have any money in your wallet to give to someone!", ephemeral: true });
                return;
            }

            amount = Math.min(member.wallet, 5_000);
        } else {
            const newAmount = await User.removeBetMoney(amountStr, member, false, 1, 5_000);

            if (typeof newAmount === "string") {
                await this.client.cooldown.deleteCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: newAmount, ephemeral: true });
                return;
            }

            amount = newAmount;
        }

        if (user.id === interaction.user.id || user.bot) {
            await this.client.cooldown.deleteCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: ":x: You can't give money to yourself or a bot.", ephemeral: true });
            return;
        } else if (member.wallet < amount) {
            await this.client.cooldown.deleteCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: ":x: You don't have that much money in your wallet.", ephemeral: true });
            return;
        }

        const receiver = await Member.findOne({ id: user.id });
        if (!receiver) {
            await interaction.reply({ content: ":x: That user doesn't have an account yet.", ephemeral: true });
            return;
        }

        await interaction.reply({ content: `:white_check_mark: You've sent :coin: ${amount} to **${user.tag}**.` });
        await User.removeMoney(interaction.user.id, amount);
        await User.addMoney(user.id, amount);

        await UserStats.updateOne(
            { id: interaction.user.id },
            { $inc: { moneyDonated: amount } },
            { upsert: true },
        );
        await UserStats.updateOne(
            { id: user.id },
            { $inc: { moneyReceived: amount } },
            { upsert: true },
        );

        this.client.logger.info(`PAY | User ${interaction.user.tag} (${interaction.user.id}) gave ${amount} to ${user.tag} (${user.id}).`);
    }
}