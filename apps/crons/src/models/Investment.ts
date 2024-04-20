import { Schema, model } from 'mongoose';

export type IInvestment = {
    ticker: string;
    type: string;
    fullName: string;
    price: string;
    changed: string;
    expires: Date;
};

export const investmentSchema = new Schema<IInvestment>(
    {
        ticker: {
            type: String,
            required: true,
            unique: true,
        },
        type: {
            type: String,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        price: {
            type: String,
            required: true,
        },
        changed: {
            type: String,
            default: '0',
        },
        expires: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true },
);

export default model<IInvestment>('Investment', investmentSchema, 'Investment');
