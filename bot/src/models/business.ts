import { Schema, model } from 'mongoose';
import { Positions, type InventoryItem } from '../lib/types';

export type IEmployee = {
    employeeId: string;
    userId: string;
    position: number;
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
    employees: IEmployee[];
    inventory: InventoryItem[];
    factories: IFactory[];
};

const Employee = new Schema<IEmployee>({
    employeeId: { type: String, required: true },
    userId: { type: String, required: true, index: true, unique: true },
    position: { type: Number, default: Positions.Employee },
    hiredOn: { type: Number, default: Date.now() },
    moneyEarned: { type: Number, default: 0 },
});

const Item = new Schema<InventoryItem>({
    itemId: { type: String, required: true },
    amount: { type: Number, default: 1 },
});

const Factory = new Schema<IFactory>({
    factoryId: { type: Number, required: true },
    level: { type: Number, default: 0 },
    production: { type: String, default: '' },
    status: { type: String, default: 'standby' },
    produceOn: { type: Number, default: 0 },
});

export const businessSchema = new Schema<IBusiness>({
    name: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, default: 0 },
    taxRate: { type: Number, default: 5 },
    employees: [{ type: Employee }],
    inventory: [{ type: Item }],
    factories: [{ type: Factory }],
});

export default model<IBusiness>('Business', businessSchema);
