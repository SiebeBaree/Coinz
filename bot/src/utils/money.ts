import type { IMember } from '../models/Member';
import Member from '../models/Member';
import UserStats from '../models/UserStats';
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
    maxBet = -1,
): Promise<number | string> {
    if (maxBet < 0) maxBet = 10_000;

    let bet = 0;
    if (['all', 'max'].includes(formattedBet.toLowerCase())) {
        if (member.wallet < minBet) return "You don't have any money in your wallet.";
        bet = member.wallet > maxBet ? maxBet : member.wallet;
    } else {
        bet = parseStrToNum(formattedBet);

        if (isNaN(bet)) return "That's not a valid number.";
        if (bet < minBet) return `You need to bet at least :coin: ${formatNumber(minBet)}.`;
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
                    'games.moneySpent': bet,
                },
            },
            { upsert: true },
        );
    }

    return bet;
}

export async function addExperience(userId: string, amount?: number): Promise<number> {
    if (amount === undefined) {
        amount = getRandomNumber(1, 4);
    }

    await Member.updateOne({ id: userId }, { $inc: { experience: amount } }, { upsert: true });

    return amount;
}
