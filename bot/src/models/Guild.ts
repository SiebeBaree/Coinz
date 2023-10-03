import { Schema, model } from "mongoose";

export interface IGuild {
    id: string;
    banned: boolean;
    embedColor: string;
    currency: string;
}

const guildSchema = new Schema<IGuild>({
    id: { type: String, required: true, unique: true, index: true },
    banned: { type: Boolean, default: false },
}, { timestamps: true });

export default model<IGuild>("Guild", guildSchema);