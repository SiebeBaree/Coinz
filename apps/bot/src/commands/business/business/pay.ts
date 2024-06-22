import { EmbedBuilder } from 'discord.js';
import type { ColorResolvable, ChatInputCommandInteraction } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { Positions, type BusinessData } from '../../../lib/types';
import Business from '../../../models/business';
import Member from '../../../models/member';
import UserStats from '../../../models/userStats';
import { msToTime, parseStrToNum } from '../../../utils';

const COMMAND_NAME = 'business.pay';
const COOLDOWN_TIME = 60 * 60 * 24 * 7; // 7 days

export default async function pay(client: Bot, interaction: ChatInputCommandInteraction, data: BusinessData) {
    const cooldown = await client.cooldown.getCooldown(interaction.user.id, COMMAND_NAME);
    if (cooldown) {
        await interaction.reply({
            content: `Please wait ${msToTime(
                Math.abs(Number.parseInt(cooldown, 10) - Math.floor(Date.now() / 1_000)) * 1_000,
            )} before using this command again.`,
            ephemeral: true,
        });
        return;
    }

    if (data.employee.position < Positions.CEO) {
        await interaction.reply({
            content: 'You need to be the CEO or a higher position to use this command.',
            ephemeral: true,
        });
        return;
    }

    const amountStr = interaction.options.getString('amount', true);
    const amount = parseStrToNum(amountStr);

    if (amount < 500) {
        await interaction.reply({
            content: 'You need to pay at least :coin: 500 to your employees.',
            ephemeral: true,
        });
        return;
    } else if (amount > data.business.balance) {
        await interaction.reply({
            content: 'You do not have enough money in your company bank to pay that amount.',
            ephemeral: true,
        });
        return;
    }

    const moneyPerEmployee = Math.floor(amount / data.business.employees.length);
    const remainder = amount % data.business.employees.length;
    const totalAmount = amount - remainder;

    const embed = new EmbedBuilder()
        .setTitle('Business Pay')
        .setDescription('You have successfully payed your employees.')
        .setColor(client.config.embed.color as ColorResolvable)
        .setFooter({ text: client.config.embed.footer })
        .setTimestamp()
        .setFields([
            { name: 'Total Amount', value: `:coin: ${totalAmount}`, inline: true },
            { name: 'Amount per Employee', value: `:coin: ${moneyPerEmployee}`, inline: true },
        ]);

    await client.cooldown.setCooldown(interaction.user.id, COMMAND_NAME, COOLDOWN_TIME);
    await interaction.reply({ embeds: [embed] });

    await Business.updateOne({ name: data.business.name }, { $inc: { balance: -totalAmount } });
    for (const employee of data.business.employees) {
        await Member.updateOne({ id: employee.userId }, { $inc: { wallet: moneyPerEmployee } });
        await UserStats.updateOne(
            { id: employee.userId },
            { $inc: { totalEarned: moneyPerEmployee } },
            { upsert: true },
        );
        await Business.updateOne(
            { name: data.business.name, 'employees.userId': employee.userId },
            { $inc: { 'employees.$.moneyEarned': moneyPerEmployee } },
        );
    }
}
