import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Helpers from "../../utils/Helpers";

export default class extends Command implements ICommand {
    readonly info = {
        name: "withdraw",
        description: "Withdraw money from your bank to your wallet.",
        options: [
            {
                name: "amount",
                type: ApplicationCommandOptionType.String,
                description: "Enter an amount that you want to withdraw.",
                required: true,
            },
        ],
        category: "general",
        extraFields: [
            { name: "Amount Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1000000~~ **1M**\n~~1300~~ **1.3K**\nUse `all` or `max` to use the maximum money you have.", inline: false },
        ],
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const amountStr = interaction.options.getString("amount", true);

        let amount = 0;
        if (["all", "max"].includes(amountStr.toLowerCase())) {
            if (member.bank <= 0) {
                await interaction.reply({ content: "You don't have any money in your bank account.", ephemeral: true });
                return;
            }

            amount = member.bank;
        } else {
            amount = Helpers.parseFormattedNumber(amountStr);

            if (amount === undefined || isNaN(amount)) {
                await interaction.reply({ content: "That's not a valid amount. Please use a number or use formatting like 1k, 1m, 1.3k, ...", ephemeral: true });
                return;
            } else if (amount <= 0) {
                await interaction.reply({ content: "You need to withdraw at least :coin: 1.", ephemeral: true });
                return;
            } else if (amount > member.bank) {
                await interaction.reply({ content: `You don't have that much in your bank account. You only have :coin: ${member.bank} in your bank account.`, ephemeral: true });
                return;
            }
        }

        await interaction.deferReply();
        await Member.updateOne({ id: member.id }, { $inc: { wallet: amount, bank: -amount } });

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Withdrawn Money", iconURL: interaction.user.avatarURL() || undefined })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`Successfully withdrawn :coin: ${amount} from your bank.`)
            .addFields(
                { name: "Wallet Balance", value: `:coin: ${member.wallet + amount}`, inline: true },
                { name: "Bank Balance", value: `:coin: ${member.bank - amount}`, inline: true },
            );
        await interaction.editReply({ embeds: [embed] });
    }
}