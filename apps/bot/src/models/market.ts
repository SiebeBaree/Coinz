import { Schema, model } from 'mongoose';
import { MarketStatus } from '../lib/types';

export type IMarket = {
    listingId: string;
    businessName: string;
    soldTo: string;
    itemId: string;
    quantity: number;
    pricePerUnit: number;
    status: MarketStatus;
    createdAt: Date;
    updatedAt: Date;
};

export const marketSchema = new Schema<IMarket>(
    {
        listingId: { type: String, required: true, unique: true, index: true },
        businessName: { type: String, required: true },
        soldTo: { type: String, default: '' },
        itemId: { type: String, required: true, index: true },
        quantity: { type: Number, required: true },
        pricePerUnit: { type: Number, required: true },
        status: { type: String, default: MarketStatus.Listed },
    },
    {
        timestamps: true,
    },
);

export default model<IMarket>('Market', marketSchema);
