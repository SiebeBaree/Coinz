import { Schema, model } from 'mongoose';

export type Command = {
    name: string;
    description: string;
    category: string;
    cooldown: number;
    usage: string[];
    premium: number;
};

export const commandSchema = new Schema<Command>({
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    cooldown: { type: Number, default: 0 },
    usage: { type: [String], default: [] },
    premium: { type: Number, default: 0 },
});

export default model<Command>('Command', commandSchema, 'Commands');
