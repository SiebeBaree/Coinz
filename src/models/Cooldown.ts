import { Schema, model } from "mongoose";

export interface ICooldown {
    id: string;
    command: string;
    expires: number;
}

const cooldownSchema = new Schema<ICooldown>({
    id: { type: String, required: true, index: true },
    command: { type: String, required: true },
    expires: { type: Number, default: Math.floor(Date.now() / 1000) },
});

export default model<ICooldown>("Cooldown", cooldownSchema);