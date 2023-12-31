import { Schema, model } from 'mongoose';

export type IShard = {
    shardId: number;
    guilds: number;
    users: number;
    ping: number;
};

export type ICluster = {
    clusterId: number;
    shards: IShard[];
};

export type IBotStats = {
    totalGuilds: number;
    totalUsers: number;
    totalCommands: number;
    totalInvestments: number;
    clusters: ICluster[];
    createdAt: Date;
    updatedAt: Date;
};

const shardSchema = new Schema<IShard>(
    {
        shardId: { type: Number, required: true },
        guilds: { type: Number, required: true },
        users: { type: Number, required: true },
        ping: { type: Number, required: true },
    },
);

const clusterSchema = new Schema<ICluster>(
    {
        clusterId: { type: Number, required: true },
        shards: [{ type: shardSchema, required: true }],
    },
);

export const botStatsSchema = new Schema<IBotStats>(
    {
        totalGuilds: { type: Number, required: true },
        totalUsers: { type: Number, required: true },
        totalCommands: { type: Number, required: true },
        totalInvestments: { type: Number, required: true },
        clusters: [{ type: clusterSchema, required: true }],
    },
    { timestamps: true },
);

export default model<IBotStats>('BotStats', botStatsSchema, 'BotStats');
