import { Schema, model } from "mongoose";
import { embed } from "../assets/config.json";

export interface IPremium {
    active: boolean;
    userId: string;
    expires: number;
}

export interface IGuild {
    id: string;
    banned: boolean;
    embedColor: string;
    premium: IPremium;
}

const Premium = new Schema<IPremium>({
    active: { type: Boolean, default: false },
    userId: { type: String, default: "" },
    expires: { type: Number, default: 0 },
});

const guildSchema = new Schema<IGuild>({
    id: { type: String, required: true, unique: true, index: true },
    banned: { type: Boolean, default: false },
    embedColor: { type: String, default: embed.color },
    premium: { type: Premium, default: {} },
}, { timestamps: true });

export default model<IGuild>("Guild", guildSchema);