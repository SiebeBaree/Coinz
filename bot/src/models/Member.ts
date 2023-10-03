import { Schema, model, Types } from "mongoose";
import InventoryItem from "../domain/IInventoryItem";

export interface IInvestment {
    ticker: string;
    amount: Types.Decimal128;
    buyPrice: number;
}

export interface IPlot {
    plotId: number;
    status: string;
    harvestOn: number;
    crop: string;
    soilQuality: number;
}

interface ITree {
    height: number;
    planted: number;
    timesWatered: number;
    preference: string;
    lastWatered: number;
    nextEvent: number;
    seedType: string;
}

export interface IMember {
    id: string;
    votes: number;
    spins: number;
    wallet: number;
    bank: number;
    bankLimit: number;
    experience: number;
    job: string;
    business: string;
    streak: number;
    lastStreak: Date;
    passiveMode: boolean;
    inventory: InventoryItem[];
    stocks: IInvestment[];
    plots: IPlot[];
    lastWatered: number;
    profileColor: string;
    displayedBadge: string;
    birthday: Date;
    bio: string;
    badges: string[];
    tree: ITree;
}

const Item = new Schema<InventoryItem>({
    itemId: { type: String, required: true },
    amount: { type: Number, default: 1 },
});

const Investment = new Schema<IInvestment>({
    ticker: { type: String, required: true },
    amount: { type: Types.Decimal128, required: true },
    buyPrice: { type: Number, required: true },
});

const Plot = new Schema<IPlot>({
    plotId: { type: Number, required: true },
    status: { type: String, default: "empty" },
    harvestOn: { type: Number, default: 0 },
    crop: { type: String, default: "" },
    soilQuality: { type: Number, default: 100, min: 0, max: 100 },
});

const Tree = new Schema<ITree>({
    height: { type: Number, default: 0 },
    planted: { type: Number, default: 0 },
    timesWatered: { type: Number, default: 0 },
    preference: { type: String, default: "default" },
    lastWatered: { type: Number, default: 0 },
    nextEvent: { type: Number, default: 0 },
    seedType: { type: String, default: "" },
});

export const memberSchema = new Schema<IMember>({
    id: { type: String, required: true, unique: true, index: true },
    votes: { type: Number, default: 0 },
    spins: { type: Number, default: 0 },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    bankLimit: { type: Number, default: 7500 },
    experience: { type: Number, default: 0 },
    job: { type: String, default: "" },
    business: { type: String, default: "" },
    streak: { type: Number, default: 0 },
    lastStreak: { type: Date, default: new Date(0) },
    passiveMode: { type: Boolean, default: false },
    inventory: [{ type: Item, default: [] }],
    stocks: [{ type: Investment, default: [] }],
    plots: [{ type: Plot, default: [] }],
    lastWatered: { type: Number, default: 0 },
    profileColor: { type: String, default: "" },
    displayedBadge: { type: String, default: "" },
    birthday: { type: Date, default: new Date(0) },
    bio: { type: String, default: "", minlength: 0, maxlength: 100 },
    badges: [{ type: String, default: [] }],
    tree: { type: Tree, default: {} },
}, { timestamps: true });

export default model<IMember>("Member", memberSchema);