import InventoryItem from "../interfaces/InventoryItem";
import Member, { IMember } from "../models/Member";
import Database from "./Database";
import Helpers from "./Helpers";

export default class User {
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

    static async addItem(userId: string, itemId: string, amount: 1, inventory?: InventoryItem[]): Promise<void> {
        if (inventory === undefined) {
            const member = await Database.getMember(userId, true);
            inventory = member.inventory;
        }

        if (inventory.length > 0 && this.userHasItem(inventory, itemId)) {
            await Member.updateOne(
                { id: userId, "inventory.itemId": itemId },
                { $inc: { "inventory.$.amount": amount } },
            );
        } else {
            await Member.updateOne({ id: userId }, {
                $push: { inventory: { itemId: itemId, amount: amount } },
            });
        }
    }

    static async removeItem(userId: string, itemId: string, amount: 1, inventory?: InventoryItem[]): Promise<boolean> {
        if (inventory === undefined) {
            const member = await Database.getMember(userId, true);
            inventory = member.inventory;
        }

        if (inventory.length === 0 || !this.userHasItem(inventory, itemId)) {
            return false;
        }

        const item = inventory.find((i) => i.itemId === itemId);
        if (item === undefined) return false;

        if (item.amount <= amount) {
            await Member.updateOne(
                { id: userId, "inventory.itemId": itemId },
                { $pull: { inventory: { itemId: itemId } } },
            );
        } else {
            await Member.updateOne(
                { id: userId, "inventory.itemId": itemId },
                { $inc: { "inventory.$.amount": -amount } },
            );
        }

        return true;
    }

    static userHasItem(inventory: InventoryItem[], itemId: string): boolean {
        return inventory.some((item) => item.itemId === itemId);
    }

    static async getLevel(experience: number): Promise<number> {
        return Math.floor(experience / 100);
    }

    static async addExperience(userId: string, amount?: number): Promise<number> {
        if (amount === undefined) {
            amount = Helpers.getRandomNumber(1, 4);
        }

        await Member.updateOne(
            { id: userId },
            { $inc: { experience: amount } },
            { upsert: true },
        );

        return amount;
    }

    static async removeBetMoney(formattedBet: string, member: IMember, isPremium = false, removeMoney = true, minBet = 50, maxBet = -1): Promise<string | number> {
        maxBet = maxBet === -1 ? (isPremium ? 10_000 : 5_000) : maxBet;

        let bet = 0;
        if (["all", "max"].includes(formattedBet.toLowerCase())) {
            if (member.wallet < minBet) return "You don't have any money in your wallet.";
            bet = member.wallet > maxBet ? maxBet : member.wallet;
        } else {
            bet = Helpers.parseFormattedNumber(formattedBet);

            if (isNaN(bet)) return "That's not a valid number.";
            if (bet < minBet) return `You need to bet at least :coin: ${Helpers.formatNumber(minBet)}.`;
            if (bet > maxBet) return `You can't bet more than :coin: ${Helpers.formatNumber(maxBet)}.`;
            if (bet > member.wallet) return "You don't have that much money in your wallet.";
        }

        if (removeMoney) await this.removeMoney(member.id, bet);
        return bet;
    }
}