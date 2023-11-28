import { Schema, model } from 'mongoose';
import type { InventoryItem } from '../lib/types';

export type IFactory = {
    factoryId: number;
    level: number;
    production: string;
    status: string;
    produceOn: number;
};

export type IBusiness = {
    userId: string;
    name: string;
    employees: number;
    inventory: InventoryItem[];
    factories: IFactory[];
};

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
        userId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, unique: true, index: true },
        employees: { type: Number, default: 0 },
        inventory: [{ type: Item, default: [] }],
        factories: [{ type: Factory, default: [] }],
    },
);

export default model<IBusiness>('Business', businessSchema);
