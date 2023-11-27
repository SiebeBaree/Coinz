import type { ColorResolvable } from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type { Command } from '../../domain/Command';
import Member from '../../models/Member';
import { parseStrToNum } from '../../utils';

export default {
    data: {
        name: 'withdraw',
        description: 'Withdraw money from your bank to your wallet.',
        category: 'general',
        options: [
            {
                name: 'amount',
                type: ApplicationCommandOptionType.String,
                description: 'Enter an amount that you want to withdraw.',
                required: true,
            },
        ],
        extraFields: [
            {
                name: 'Amount Formatting',
                value: 'You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1000000~~ **1M**\n~~1300~~ **1.3K**\nUse `all` or `max` to use the maximum money you have.',
                inline: false,
            },
        ],
    },
    async execute(client, interaction, member) {
        const amountStr = interaction.options.getString('amount', true);

        let amount = 0;
        if (amountStr.toLowerCase() === 'all' || amountStr.toLowerCase() === 'max') {
            if (member.bank <= 0) {
                await interaction.reply({ content: "You don't have any money in your wallet.", ephemeral: true });
                return;
            }

            amount = member.bank;
        } else {
            amount = parseStrToNum(amountStr);

            if (amount === undefined || Number.isNaN(amount)) {
                await interaction.reply({
                    content: "That's not a valid amount. Please use a number or use formatting like 1k, 1m, 1.3k, ...",
                    ephemeral: true,
                });
                return;
            } else if (amount <= 0) {
                await interaction.reply({ content: 'You need to deposit at least :coin: 1.', ephemeral: true });
                return;
            } else if (amount > member.bank) {
                await interaction.reply({
                    content: `You don't have that much in your bank account. You only have :coin: ${member.wallet} in your bank account.`,
                    ephemeral: true,
                });
                return;
            }
        }

        await Member.updateOne({ id: member.id }, { $inc: { wallet: amount, bank: -amount } });
        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Withdrawn Money',
                iconURL: interaction.user.avatarURL() ?? client.config.embed.icon,
            })
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(`Successfully withdrawn :coin: ${amount} from your bank.`)
            .addFields([
                { name: 'Wallet Balance', value: `:coin: ${member.wallet + amount}`, inline: true },
                { name: 'Bank Balance', value: `:coin: ${member.bank - amount}`, inline: true },
            ]);
        await interaction.reply({ embeds: [embed] });
    },
} satisfies Command;
