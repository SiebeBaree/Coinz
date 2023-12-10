export type Cluster = {
    id: number;
    averagePing: number;
    totalGuildCount: number;
    shards: Shard[];
}

export type Shard = {
    id: number;
    ping: number;
    guildCount: number;
}