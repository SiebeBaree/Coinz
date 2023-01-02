import { Schema, model } from "mongoose";
import { embed } from "../assets/config.json";

export interface IGuild {
    id: string;
    banned: boolean;
    airdrops: {
        status: boolean;
        channel: string;
        nextDrop: number;
        interval: {
            min: number;
            max: number;
        };
        tries: number;
    };
    currency: string;
    embedColor: string;
}

const guildSchema = new Schema<IGuild>({
    id: { type: String, required: true, unique: true, index: true },
    banned: { type: Boolean, default: false },
    airdrops: {
        status: { type: Boolean, default: false },
        channel: { type: String, default: "" },
        nextDrop: { type: Number, default: 0 },
        interval: {
            min: { type: Number, default: 3600 },
            max: { type: Number, default: 43200 },
        },
        tries: { type: Number, default: 0 },
    },
    currency: { type: String, default: ":coin:" },
    embedColor: { type: String, default: embed.color },
}, { timestamps: true });

export default model<IGuild>("Guild", guildSchema);