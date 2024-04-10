import type { ChatInputCommandInteraction } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { type BusinessData } from '../../../lib/types';
import Business from '../../../models/business';
import type { IMember } from '../../../models/member';
import Member from '../../../models/member';
import UserStats from '../../../models/userStats';
import { msToTime, parseStrToNum } from '../../../utils';

const COMMAND_NAME = 'business.invest';
const COOLDOWN_TIME = 60 * 60 * 24; // 24 hours

export default async function invest(
    client: Bot,
    interaction: ChatInputCommandInteraction,
    member: IMember,
    data: BusinessData,
) {
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

    const amountStr = interaction.options.getString('amount', true);
    const amount = parseStrToNum(amountStr);

    if (amount < 100) {
        await interaction.reply({
            content: 'You need to invest at least :coin: 100.',
            ephemeral: true,
        });
        return;
    } else if (amount > member.wallet) {
        await interaction.reply({
            content: 'You do not have enough money in your wallet to invest that amount.',
            ephemeral: true,
        });
        return;
    } else if (amount > 2000) {
        await interaction.reply({
            content: `You cannot invest more than :coin: 2000.`,
            ephemeral: true,
        });
        return;
    }

    await client.cooldown.setCooldown(interaction.user.id, COMMAND_NAME, COOLDOWN_TIME);
    await interaction.reply({
        content: `You have successfully invested :coin: ${amount} into **${data.business.name}**.`,
        ephemeral: true,
    });

    await Business.updateOne({ name: data.business.name }, { $inc: { balance: amount } });
    await Member.updateOne({ id: member.id }, { $inc: { wallet: -amount } });
    await UserStats.updateOne({ id: member.id }, { $inc: { totalSpend: -amount } }, { upsert: true });
}
