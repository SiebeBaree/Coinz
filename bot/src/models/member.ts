import { Schema, model } from 'mongoose';
import type { InventoryItem } from '../lib/types';

export type IInvestment = {
    ticker: string;
    amount: string;
    buyPrice: number;
};

export type IPlot = {
    plotId: number;
    status: string;
    harvestOn: number;
    crop: string;
    soilQuality: number;
};

type ITree = {
    height: number;
    plantedAt: number;
    timesWatered: number;
    wateredAt: number;
    nextEventAt: number;
    isCuttingDown: number;
    extraHeight: number;
};

export type IMember = {
    id: string;
    banned: boolean;
    votes: number;
    spins: number;
    wallet: number;
    bank: number;
    bankLimit: number;
    experience: number;
    job: string;
    streak: number;
    lastStreak: Date;
    passiveMode: boolean;
    inventory: InventoryItem[];
    investments: IInvestment[];
    plots: IPlot[];
    lastWatered: number;
    profileColor: string;
    displayedBadge: string;
    birthday: Date;
    country: string;
    badges: string[];
    tree: ITree;
    premium: number;
};

const Item = new Schema<InventoryItem>({
    itemId: { type: String, required: true },
    amount: { type: Number, default: 1 },
});

const Investment = new Schema<IInvestment>({
    ticker: { type: String, required: true },
    amount: { type: String, required: true },
    buyPrice: { type: Number, required: true },
});

const Plot = new Schema<IPlot>({
    plotId: { type: Number, required: true },
    status: { type: String, default: 'empty' },
    harvestOn: { type: Number, default: 0 },
    crop: { type: String, default: '' },
    soilQuality: { type: Number, default: 100, min: 0, max: 100 },
});

const Tree = new Schema<ITree>({
    height: { type: Number, default: 0 },
    plantedAt: { type: Number, default: 0 },
    timesWatered: { type: Number, default: 0 },
    wateredAt: { type: Number, default: 0 },
    nextEventAt: { type: Number, default: 0 },
    isCuttingDown: { type: Number, default: 0 },
    extraHeight: { type: Number, default: 0 },
});

export const member = new Schema<IMember>(
    {
        id: { type: String, required: true, unique: true, index: true },
        banned: { type: Boolean, default: false },
        votes: { type: Number, default: 0 },
        spins: { type: Number, default: 0 },
        wallet: { type: Number, default: 0 },
        bank: { type: Number, default: 0 },
        bankLimit: { type: Number, default: 7_500 },
        experience: { type: Number, default: 0 },
        job: { type: String, default: '' },
        streak: { type: Number, default: 0 },
        lastStreak: { type: Date, default: new Date(0) },
        passiveMode: { type: Boolean, default: false },
        inventory: [{ type: Item, default: [] }],
        investments: [{ type: Investment, default: [] }],
        plots: [{ type: Plot, default: [] }],
        lastWatered: { type: Number, default: 0 },
        profileColor: { type: String, default: '' },
        displayedBadge: { type: String, default: '' },
        birthday: { type: Date, default: new Date(0) },
        country: { type: String, default: '' },
        badges: [{ type: String, default: [] }],
        tree: { type: Tree, default: {} },
        premium: { type: Number, default: 0 },
    },
    { timestamps: true },
);

export default model<IMember>('Member', member);
