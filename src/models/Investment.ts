import { Schema, model, Types } from "mongoose";

export interface IInvestment {
    ticker: string;
    type: string;
    fullName: string;
    price: Types.Decimal128;
    previousClose: Types.Decimal128;
    lastUpdated: number;
}

const investmentSchema = new Schema<IInvestment>({
    ticker: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    fullName: { type: String, required: true },
    price: { type: Types.Decimal128, default: 0 },
    previousClose: { type: Types.Decimal128, default: 0 },
    lastUpdated: { type: Number, default: 0 },
});

export default model<IInvestment>("Investment", investmentSchema);