import { Schema, model, Types } from 'mongoose';

const Stock = Schema({
    ticker: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    fullName: { type: String, required: true },
    price: { type: Types.Decimal128, required: true },
    previousClose: { type: Types.Decimal128, default: 0 },
    lastUpdated: { type: Number, default: 0 }
});

export default model('Stock', Stock, 'stocks');