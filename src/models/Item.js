import { Schema, model, Types } from 'mongoose';

const Item = Schema({
    itemId: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    name: { type: String, required: true },
    emoteId: { type: String, default: "" },
    animated: { type: Boolean, default: false },
    shortDescription: { type: String, required: true },
    longDescription: { type: String, default: "" },
    buyPrice: { type: Number, required: true },
    sellPrice: { type: Number, required: true },
    multiplier: { type: Types.Decimal128, default: 0.0 },
    duration: { type: Number, default: 0 }
});

export default model('Item', Item, 'items');