import { Schema, model } from 'mongoose';

export enum TradeStatus {
    COMPLETED = 'COMPLETED',
    DENIED = 'DENIED',
    EXPIRED = 'EXPIRED',
    PENDING = 'PENDING',
    WAITING_FOR_CONFIRMATION = 'WAITING_FOR_CONFIRMATION',
}

export type TradeItem = {
    userId: string;
    itemId: string;
    quantity: number;
};

export type Trade = {
    tradeId: string;
    userId: string;
    toUserId: string;
    items: TradeItem[];
    status: TradeStatus;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

const tradeItemSchema = new Schema<TradeItem>({
    userId: { type: String, required: true },
    itemId: { type: String, required: true },
    quantity: { type: Number, required: true },
});

export const tradeSchema = new Schema<Trade>(
    {
        tradeId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        toUserId: { type: String, required: true, index: true },
        items: { type: [tradeItemSchema], default: [] },
        status: { type: String, default: TradeStatus.PENDING, enum: Object.values(TradeStatus) },
        expiresAt: { type: Date, required: true },
    },
    {
        collection: 'Trade',
        timestamps: true,
    },
);

export default model<Trade>('Trade', tradeSchema);
