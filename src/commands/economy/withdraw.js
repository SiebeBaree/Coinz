import Command from '../../structures/Command.js'
import { EmbedBuilder, ApplicationCommandOptionType } from 'discord.js'
import { extractNumber } from '../../lib/helpers.js'
import Member from '../../models/Member.js'

export default class extends Command {
    info = {
        name: "withdraw",
        description: "Withdraw money from your bank to your wallet.",
        options: [
            {
                name: 'amount',
                type: ApplicationCommandOptionType.String,
                description: 'Enter an amount that you want to withdraw.',
                required: true
            }
        ],
        category: "economy",
        extraFields: [
            { name: "Amount Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1000000~~ **1M**\n~~1300~~ **1.3K**\nUse `all` or `max` to use the maximum money you have.", inline: false }
        ],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const amountStr = interaction.options.getString('amount');

        let amount = 0;
        if (["all", "max"].includes(amountStr.toLowerCase())) {
            if (data.user.bank <= 0) return await interaction.reply({ content: `You don't have any money in your bank account.`, ephemeral: true });
            amount = data.user.bank;
        } else {
            amount = extractNumber(amountStr);
            if (amount === undefined || isNaN(amount)) return await interaction.reply({ content: `That's not a valid amount. Please use a number or use formatting like 1k, 1m, 1.3k, ...`, ephemeral: true });
            if (amount <= 0) return await interaction.reply({ content: `You need to withdraw at least :coin: 1.`, ephemeral: true });
            if (amount > data.user.bank) return await interaction.reply({ content: `You don't have that much in your bank account. You only have :coin: ${data.user.bank}.`, ephemeral: true });
        }
        await interaction.deferReply();

        await Member.updateOne({ id: interaction.member.id }, {
            $inc: {
                wallet: amount,
                bank: -amount
            }
        });

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Withdrawn Money`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setDescription(`Successfully withdrawn :coin: ${amount} from your bank.`)
            .addFields(
                { name: 'New Wallet Balance', value: `:coin: ${data.user.wallet + amount}`, inline: true },
                { name: 'New Bank Balance', value: `:coin: ${data.user.bank - amount}`, inline: true }
            )
        await interaction.editReply({ embeds: [embed] });
    }
}