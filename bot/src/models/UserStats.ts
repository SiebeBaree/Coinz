import { Schema, model } from "mongoose";

// Businesses Owned: Number of businesses owned by the user
// Jobs Applied: Number of jobs applied for by the user
// Total Investments: Number of investments bought by the user
// Daily Activity: Number of commands/actions performed by the user per day

export interface IUserStats {
    id: string;
    totalEarned: number;
    totalSpend: number;
    games: {
        won: number;
        lost: number;
        tied: number;
        moneySpent: number;
        moneyEarned: number;
        moneyLost: number;
    };
    treesCutDown: number;
    totalTreeHeight: number;
    luckyWheelSpins: number;
    timesWorked: number;
    fishCaught: number;
    animalsKilled: number;
    timesRobbed: number;
    timesPlotHarvested: number;
    timesPlotWatered: number;
    moneyEarnedOnBusinesses: number;
    dailyActivity: {
        startDay: Date;
        totalCommands: number;
    };
    moneyDonated: number;
    moneyReceived: number;
    investments: {
        amountOfTimesBought: number;
        amountOfTimesSold: number;
        totalBuyPrice: number;
    }
}

export const userStatsSchema = new Schema<IUserStats>({
    id: { type: String, required: true, unique: true, index: true },
    totalEarned: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    games: {
        won: { type: Number, default: 0 },
        lost: { type: Number, default: 0 },
        tied: { type: Number, default: 0 },
        moneySpent: { type: Number, default: 0 },
        moneyEarned: { type: Number, default: 0 },
        moneyLost: { type: Number, default: 0 },
    },
    treesCutDown: { type: Number, default: 0 },
    totalTreeHeight: { type: Number, default: 0 },
    luckyWheelSpins: { type: Number, default: 0 },
    timesWorked: { type: Number, default: 0 },
    fishCaught: { type: Number, default: 0 },
    animalsKilled: { type: Number, default: 0 },
    timesRobbed: { type: Number, default: 0 },
    timesPlotHarvested: { type: Number, default: 0 },
    timesPlotWatered: { type: Number, default: 0 },
    moneyEarnedOnBusinesses: { type: Number, default: 0 },
    dailyActivity: {
        startDay: { type: Date, default: Date.now },
        totalCommands: { type: Number, default: 0 },
    },
    moneyDonated: { type: Number, default: 0 },
    moneyReceived: { type: Number, default: 0 },
    investments: {
        amountOfTimesBought: { type: Number, default: 0 },
        amountOfTimesSold: { type: Number, default: 0 },
        totalBuyPrice: { type: Number, default: 0 },
    }
}, { timestamps: true });

export default model<IUserStats>("UserStats", userStatsSchema);