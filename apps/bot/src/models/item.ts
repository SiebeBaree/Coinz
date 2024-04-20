import { Schema, model } from 'mongoose';

export type Item = {
    itemId: string;
    category: string;
    name: string;
    emoteId: string;
    description: string;
    longDescription?: string;
    buyPrice?: number;
    sellPrice?: number;
    multiplier?: number;
    duration?: number;
};

export const itemSchema = new Schema<Item>(
    {
        itemId: { type: String, required: true, unique: true, index: true },
        category: { type: String, required: true },
        name: { type: String, required: true, index: true },
        emoteId: { type: String, required: true },
        description: { type: String, required: true },
        longDescription: { type: String, required: false },
        buyPrice: { type: Number, required: false },
        sellPrice: { type: Number, required: false },
        multiplier: { type: Number, required: false },
        duration: { type: Number, required: false },
    },
    {
        collection: 'Item',
    },
);

export default model<Item>('Item', itemSchema);
