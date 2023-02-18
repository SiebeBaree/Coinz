import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Helpers from "../../utils/Helpers";

export default class extends Command implements ICommand {
    readonly info = {
        name: "deposit",
        description: "Deposit money from your wallet to your bank account.",
        options: [
            {
                name: "amount",
                type: ApplicationCommandOptionType.String,
                description: "Enter an amount that you want to deposit.",
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
            if (member.wallet <= 0) {
                await interaction.reply({ content: "You don't have any money in your wallet.", ephemeral: true });
                return;
            } else if (member.bank >= member.bankLimit) {
                await interaction.reply({ content: "You don't have enough space in your bank to deposit all your money. Use </balance:983096143179284511> to upgrade your bank limit.", ephemeral: true });
                return;
            }

            amount = member.wallet + member.bank > member.bankLimit ? member.bankLimit - member.bank : member.wallet;
        } else {
            amount = Helpers.parseFormattedNumber(amountStr);

            if (amount === undefined || isNaN(amount)) {
                await interaction.reply({ content: "That's not a valid amount. Please use a number or use formatting like 1k, 1m, 1.3k, ...", ephemeral: true });
                return;
            } else if (amount <= 0) {
                await interaction.reply({ content: "You need to deposit at least :coin: 1.", ephemeral: true });
                return;
            } else if (amount > member.wallet) {
                await interaction.reply({ content: `You don't have that much in your wallet. You only have :coin: ${member.wallet} in your wallet.`, ephemeral: true });
                return;
            }
        }

        if (amount + member.bank > member.bankLimit) {
            await interaction.reply({ content: `You don't have enough space in your bank to deposit :coin: ${amount}. Use </balance:983096143179284511> to upgrade your bank limit.`, ephemeral: true });
            return;
        }

        await interaction.deferReply();
        await Member.updateOne({ id: member.id }, { $inc: { wallet: -amount, bank: amount } });

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Deposited Money", iconURL: interaction.user.avatarURL() || undefined })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`Successfully deposited :coin: ${amount} to your bank.`)
            .addFields(
                { name: "Wallet Balance", value: `:coin: ${member.wallet - amount}`, inline: true },
                { name: "Bank Balance", value: `:coin: ${member.bank + amount}`, inline: true },
            );
        await interaction.editReply({ embeds: [embed] });
    }
}