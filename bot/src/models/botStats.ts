import { Schema, model } from 'mongoose';

export type IBotStats = {
    guilds: number;
    users: number;
    shards: number;
    commands: number;
    updatedAt: Date;
};

export const botStatsSchema = new Schema<IBotStats>(
    {
        guilds: { type: Number, required: true },
        users: { type: Number, required: true },
        shards: { type: Number, required: true },
        commands: { type: Number, required: true },
    },
    { timestamps: true },
);

export default model<IBotStats>('BotStats', botStatsSchema, 'BotStats');
