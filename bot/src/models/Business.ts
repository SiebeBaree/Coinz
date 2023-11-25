import { Schema, model } from 'mongoose';
import type { InventoryItem } from '../lib/types';

export type IEmployee = {
    userId: string;
    role: string;
    payout: number;
    hiredOn: number;
    moneyEarned: number;
};

export type IFactory = {
    factoryId: number;
    level: number;
    production: string;
    status: string;
    produceOn: number;
};

export type IBusiness = {
    name: string;
    balance: number;
    taxRate: number;
    risk: number;
    employees: IEmployee[];
    inventory: InventoryItem[];
    factories: IFactory[];
};

const Employee = new Schema<IEmployee>({
    userId: { type: String, required: true },
    role: { type: String, default: 'employee' },
    payout: { type: Number, default: 15, min: 10, max: 100 },
    hiredOn: { type: Number, default: Math.floor(Date.now() / 1_000) },
    moneyEarned: { type: Number, default: 0 },
});

const Item = new Schema<InventoryItem>({
    itemId: { type: String, required: true },
    amount: { type: Number, default: 1 },
});

const Factory = new Schema<IFactory>({
    factoryId: { type: Number, required: true },
    level: { type: Number, default: 0 },
    production: { type: String, default: 'none' },
    status: { type: String, default: 'standby' },
    produceOn: { type: Number, default: 0 },
});

export const businessSchema = new Schema<IBusiness>(
    {
        name: { type: String, required: true, unique: true, index: true },
        balance: { type: Number, default: 0 },
        taxRate: { type: Number, default: 0 },
        risk: { type: Number, default: 0 },
        employees: [{ type: Employee, default: [] }],
        inventory: [{ type: Item, default: [] }],
        factories: [{ type: Factory, default: [] }],
    },
    { timestamps: true },
);

export default model<IBusiness>('Business', businessSchema);
