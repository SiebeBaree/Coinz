import { Schema, model } from 'mongoose';
import { MarketStatus } from '../lib/types';

export type IMarket = {
    businessName: string;
    itemId: string;
    quantity: number;
    pricePerUnit: number;
    status: MarketStatus;
    createdAt: Date;
};

export const marketSchema = new Schema<IMarket>(
    {
        businessName: { type: String, required: true },
        itemId: { type: String, required: true, index: true },
        quantity: { type: Number, required: true },
        pricePerUnit: { type: Number, required: true },
        status: { type: Number, default: MarketStatus.Listed },
    },
    {
        timestamps: true,
    },
);

export default model<IMarket>('Market', marketSchema);
