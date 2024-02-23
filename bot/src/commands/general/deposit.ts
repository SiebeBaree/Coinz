import type { ColorResolvable } from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type { Command } from '../../domain/Command';
import Member from '../../models/member';
import { parseStrToNum } from '../../utils';

export default {
    data: {
        name: 'deposit',
        description: 'Deposit money from your wallet to your bank account.',
        category: 'general',
        options: [
            {
                name: 'amount',
                type: ApplicationCommandOptionType.String,
                description: 'Enter an amount that you want to deposit.',
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
        usage: ['<amount>'],
    },
    async execute(client, interaction, member) {
        const amountStr = interaction.options.getString('amount', true);

        let amount = 0;
        if (amountStr.toLowerCase() === 'all' || amountStr.toLowerCase() === 'max') {
            if (member.wallet <= 0) {
                await interaction.reply({ content: "You don't have any money in your wallet.", ephemeral: true });
                return;
            } else if (member.bank >= member.bankLimit) {
                await interaction.reply({
                    content:
                        "You don't have enough space in your bank to deposit all your money. Use `/balance` to upgrade your bank limit.",
                    ephemeral: true,
                });
                return;
            }

            amount = member.wallet + member.bank > member.bankLimit ? member.bankLimit - member.bank : member.wallet;
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
            } else if (amount > member.wallet) {
                await interaction.reply({
                    content: `You don't have that much in your wallet. You only have :coin: ${member.wallet} in your wallet.`,
                    ephemeral: true,
                });
                return;
            }
        }

        if (amount + member.bank > member.bankLimit) {
            await interaction.reply({
                content: `You don't have enough space in your bank to deposit :coin: ${amount}. Use \`balance\` to upgrade your bank limit.`,
                ephemeral: true,
            });
            return;
        }

        await Member.updateOne({ id: member.id }, { $inc: { wallet: -amount, bank: amount } });
        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Deposited Money',
                iconURL: interaction.user.avatarURL() ?? client.config.embed.icon,
            })
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(`Successfully deposited :coin: ${amount} to your bank.`)
            .addFields([
                { name: 'Wallet Balance', value: `:coin: ${member.wallet - amount}`, inline: true },
                { name: 'Bank Balance', value: `:coin: ${member.bank + amount}`, inline: true },
            ]);
        await interaction.reply({ embeds: [embed] });
    },
} satisfies Command;
