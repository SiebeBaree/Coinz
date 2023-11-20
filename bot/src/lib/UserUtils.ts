import Member from "../models/Member";
import Database from "./Database";
import Utils from "./Utils";

export default class UserUtils {
    static async addMoney(userId: string, amount: number): Promise<void> {
        await Member.updateOne({ id: userId }, { $inc: { wallet: amount } }, { upsert: true });
    }

    static async removeMoney(userId: string, amount: number, goNegative = false): Promise<void> {
        if (goNegative) {
            await this.addMoney(userId, -amount);
        } else {
            const member = await Database.getMember(userId);
            await this.addMoney(userId, member.wallet < amount ? -member.wallet : -amount);
        }
    }

    // TODO: Rework leveling system make it harder to level up each level
    static getLevel(experience: number): number {
        return Math.floor(experience / 100);
    }

    static getExperience(level: number): number {
        return level * 100;
    }

    static async addExperience(userId: string, amount?: number): Promise<number> {
        if (amount === undefined) {
            amount = Utils.getRandomNumber(1, 4);
        }

        await Member.updateOne(
            { id: userId },
            { $inc: { experience: amount } },
            { upsert: true },
        );

        return amount;
    }
}