import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import User, { BusinessData } from "../../../utils/User";
import { Info } from "../../../interfaces/ICommand";
import Business from "../../../models/Business";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (!data.business) {
            await interaction.reply({ content: `You don't own or work at a business. Create one using </${this.info.name} create:1048340073470513155>.`, ephemeral: true });
            return;
        }

        const allowedRoles = ["ceo", "executive"];
        if (!allowedRoles.includes(data.employee.role)) {
            await interaction.reply({ content: "You don't have permission to use this command. You need to be a ceo or executive." });
            return;
        }

        const amount = interaction.options.getInteger("amount", true);

        if (amount > data.business.balance) {
            await interaction.reply({ content: "You can't pay more than your business has.", ephemeral: true });
            return;
        }

        await interaction.deferReply();
        let remainingAmount = amount;
        for (const employee of data.business.employees) {
            const payout = Math.round(amount * (employee.payout / 100));

            if (payout > remainingAmount) continue;
            remainingAmount -= payout;

            await User.addMoney(employee.userId, payout);
            await Business.updateOne(
                { name: data.business.name, "employees.userId": employee.userId },
                { $inc: { "employees.$.moneyEarned": payout } },
            );
        }

        await Business.updateOne(
            { name: data.business.name },
            { $inc: { balance: -(amount - remainingAmount) } },
        );

        await interaction.editReply({ content: `You paid out :coin: ${amount - remainingAmount} to your employees.` });
    }
}