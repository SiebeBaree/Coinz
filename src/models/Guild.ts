import { Schema, model } from "mongoose";
import { embed } from "../assets/config.json";

interface IAirdrop {
    status: boolean;
    channel: string;
    nextDrop: number;
    interval: {
        min: number;
        max: number;
    };
    tries: number;
}

export interface IPremium {
    active: boolean;
    userId: string;
    expires: number;
}

export interface IGuild {
    id: string;
    banned: boolean;
    airdrop: IAirdrop;
    embedColor: string;
    premium: IPremium;
}

const Airdrop = new Schema<IAirdrop>({
    status: { type: Boolean, default: false },
    channel: { type: String, default: "" },
    nextDrop: { type: Number, default: 0 },
    interval: {
        min: { type: Number, default: 3600 },
        max: { type: Number, default: 43200 },
    },
    tries: { type: Number, default: 0 },
});

const Premium = new Schema<IPremium>({
    active: { type: Boolean, default: false },
    userId: { type: String, default: "" },
    expires: { type: Number, default: 0 },
});

const guildSchema = new Schema<IGuild>({
    id: { type: String, required: true, unique: true, index: true },
    banned: { type: Boolean, default: false },
    airdrop: { type: Airdrop, default: {} },
    embedColor: { type: String, default: embed.color },
    premium: { type: Premium, default: {} },
}, { timestamps: true });

export default model<IGuild>("Guild", guildSchema);