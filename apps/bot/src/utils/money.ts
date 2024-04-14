import config from '../data/config.json';
import type { IMember } from '../models/member';
import Member from '../models/member';
import UserStats from '../models/userStats';
import { formatNumber, getRandomNumber, parseStrToNum } from './index';

export async function addMoney(userId: string, amount: number): Promise<void> {
    await Member.updateOne(
        {
            id: userId,
        },
        { $inc: { wallet: amount } },
        { upsert: true },
    );

    await UserStats.updateOne(
        {
            id: userId,
        },
        {
            $inc: {
                totalEarned: amount > 0 ? amount : 0,
                totalSpend: amount < 0 ? amount : 0,
            },
        },
        { upsert: true },
    );
}

export async function removeMoney(userId: string, amount: number): Promise<void> {
    await addMoney(userId, -amount);
}

export async function removeBetMoney(
    formattedBet: string,
    member: IMember,
    removeMoneyFromPlayer = true,
    minBet = 50,
    maxBet = 5_000,
    premium = 0,
): Promise<number | string> {
    let bet = 0;
    if (['all', 'max'].includes(formattedBet.toLowerCase())) {
        if (member.wallet < minBet) return "You don't have any money in your wallet.";
        bet = member.wallet > maxBet ? maxBet : member.wallet;
    } else {
        bet = parseStrToNum(formattedBet);

        if (Number.isNaN(bet)) return "That's not a valid number.";
        if (bet < minBet) return `You need to bet at least :coin: ${formatNumber(minBet)}.`;
        if (bet > maxBet && premium === 0)
            return `You can't bet more than :coin: ${formatNumber(maxBet)}. You can increase your max bet by becoming a Coinz Plus or Pro subscriber. [**Upgrade now**](${config.website}/premium)`;
        if (bet > maxBet) return `You can't bet more than :coin: ${formatNumber(maxBet)}.`;
        if (bet > member.wallet) return "You don't have that much money in your wallet.";
    }

    if (removeMoneyFromPlayer) {
        await removeMoney(member.id, bet);

        await UserStats.updateOne(
            {
                id: member.id,
            },
            {
                $inc: {
                    totalSpend: bet,
                    'games.moneySpent': bet,
                },
            },
            { upsert: true },
        );
    }

    return bet;
}

export async function addExperience(member: IMember, amount?: number): Promise<number> {
    let xp = amount ?? getRandomNumber(1, 4);
    if (member.premium >= 2) xp *= 2;
    await Member.updateOne({ id: member.id }, { $inc: { experience: xp } }, { upsert: true });
    return xp;
}
