import { Schema, model } from "mongoose";

export interface IPremium {
    id: string;
    userTier: number;
    guildTier: number;
    userExpires: number;
    guildExpires: number;
    guildsActivated: string[];
}

const premiumSchema = new Schema<IPremium>({
    id: { type: String, required: true, unique: true, index: true },
    userTier: { type: Number, default: 0 },
    guildTier: { type: Number, default: 0 },
    userExpires: { type: Number, default: 0 },
    guildExpires: { type: Number, default: 0 },
    guildsActivated: { type: [String], default: [] },
}, { timestamps: true });

export default model<IPremium>("Premium", premiumSchema);