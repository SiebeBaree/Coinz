import Business, { IBusiness, IEmployee } from "../models/Business";
import Member, { IMember } from "../models/Member";
import Database from "./Database";
import Helpers from "./Helpers";

export type BusinessData = {
    id: string;
    business?: IBusiness;
    isOwner: boolean;
    employee: IEmployee;
}

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

    static getLevel(experience: number): number {
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

    static async addGameExperience(member: IMember): Promise<number> {
        if (member.premium.active && member.premium.tier === 2) {
            return await this.addExperience(member.id, Helpers.getRandomNumber(5, 8));
        } else {
            return await this.addExperience(member.id, Helpers.getRandomNumber(1, 4));
        }
    }

    static async removeBetMoney(formattedBet: string, member: IMember, removeMoney = true, minBet = 50, maxBet = -1): Promise<string | number> {
        maxBet = maxBet === -1 ? (member.premium.active && member.premium.tier === 2 ? 15_000 : (member.premium.active ? 10_000 : 5_000)) : maxBet;

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

    static async getBusiness(member: IMember): Promise<BusinessData> {
        const data: BusinessData = {
            id: member.id,
            employee: {
                userId: member.id,
                role: "employee",
                payout: 15,
                hiredOn: Math.floor(Date.now() / 1000),
                moneyEarned: 0,
                timesWorked: 0,
            },
            isOwner: false,
        };
        if (member.business === "") return data;

        const business = await Database.getBusiness(member.business);
        if (!business) return data;

        data.business = business;
        data.employee = business.employees.find((e) => e.userId === member.id) ?? data.employee;
        if (data.employee?.role === "ceo") data.isOwner = true;

        return data;
    }

    static async addEmployee(name: string, member: IMember, role = "employee", payout = 15): Promise<boolean> {
        // find business
        const business = await Business.findOne({ name: name });
        if (!business) {
            return false;
        }

        // check if user is already an employee
        if (business.employees.find((e) => e.userId === member.id)) {
            return false;
        }

        await Business.updateOne(
            { name: name },
            {
                $push: {
                    employees: {
                        userId: member.id,
                        role: role,
                        payout: payout,
                        hiredOn: Math.floor(Date.now() / 1000),
                        moneyEarned: 0,
                        timesWorked: 0,
                    },
                },
            },
        );

        return true;
    }
}