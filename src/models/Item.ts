import { Schema, model } from "mongoose";
import Item from "../interfaces/Item";

const itemSchema = new Schema<Item>({
    itemId: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    name: { type: String, required: true },
    emoteId: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String, required: false },
    buyPrice: { type: Number, required: false },
    sellPrice: { type: Number, required: false },
    multiplier: { type: Number, required: false },
    duration: { type: Number, required: false },
});

export default model<Item>("Item", itemSchema);