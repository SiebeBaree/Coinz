import { Schema, model } from "mongoose";
import { embed } from "../assets/config.json";

export interface IGuild {
    id: string;
    banned: boolean;
    embedColor: string;
}

const guildSchema = new Schema<IGuild>({
    id: { type: String, required: true, unique: true, index: true },
    banned: { type: Boolean, default: false },
    embedColor: { type: String, default: embed.color },
}, { timestamps: true });

export default model<IGuild>("Guild", guildSchema);