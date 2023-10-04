import Member, { IMember } from "../models/Member";
import Utils from "./Utils";
import Database from "./Database";

export default class User {
    static async addMoney(userId: string, amount: number): Promise<void> {
        await Member.updateOne({ id: userId }, { $inc: { wallet: amount } }, { upsert: true });
    }

    static async removeMoney(userId: string, amount: number, goNegative = true): Promise<void> {
        if (goNegative) {
            await this.addMoney(userId, -amount);
        } else {
            const member = await Database.getMember(userId, true);
            await this.addMoney(userId, member.wallet < amount ? -member.wallet : -amount);
        }
    }

    static async removeBetMoney(formattedBet: string, member: IMember, removeMoney = true, minBet = 50, maxBet = -1): Promise<string | number> {
        if (maxBet < 0) maxBet = 10_000;

        let bet = 0;
        if (["all", "max"].includes(formattedBet.toLowerCase())) {
            if (member.wallet < minBet) return "You don't have any money in your wallet.";
            bet = member.wallet > maxBet ? maxBet : member.wallet;
        } else {
            bet = Utils.parseFormattedNumber(formattedBet);

            if (isNaN(bet)) return "That's not a valid number.";
            if (bet < minBet) return `You need to bet at least :coin: ${Utils.formatNumber(minBet)}.`;
            if (bet > maxBet) return `You can't bet more than :coin: ${Utils.formatNumber(maxBet)}.`;
            if (bet > member.wallet) return "You don't have that much money in your wallet.";
        }

        if (removeMoney) await this.removeMoney(member.id, bet);
        return bet;
    }
}