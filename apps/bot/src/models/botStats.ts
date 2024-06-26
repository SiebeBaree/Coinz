import { Schema, model } from 'mongoose';

type ICluster = {
    id: number;
    guilds: number;
    users: number;
    totalShards: number;
};

export type IBotStats = {
    clusters: ICluster[];
    updatedAt: Date;
    createdAt: Date;
};

const ClusterSchema = new Schema<ICluster>({
    id: { type: Number, required: true },
    guilds: { type: Number, required: true },
    users: { type: Number, required: true },
    totalShards: { type: Number, required: true },
});

export const botStatsSchema = new Schema<IBotStats>(
    {
        clusters: [{ type: ClusterSchema }],
    },
    { timestamps: true },
);

export default model<IBotStats>('BotStats', botStatsSchema, 'BotStats');
