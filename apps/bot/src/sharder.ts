import { join } from 'node:path';
import process from 'node:process';
import { ClusterManager } from 'discord-hybrid-sharding';
import logger from './utils/logger';

const SHARDS_PER_CLUSTER = Number.parseInt(process.env.SHARDS_PER_CLUSTER!, 10);
const TOTAL_CLUSTERS = Number.parseInt(process.env.TOTAL_CLUSTERS!, 10);

const manager = new ClusterManager(join(__dirname, 'bot.ts'), {
    totalShards: SHARDS_PER_CLUSTER * TOTAL_CLUSTERS,
    shardsPerClusters: SHARDS_PER_CLUSTER,
    totalClusters: TOTAL_CLUSTERS,
    mode: 'process',
    token: process.env.DISCORD_TOKEN,
});

manager.on('clusterCreate', (cluster) => logger.info(`Launched Cluster ${cluster.id}`));
void manager.spawn({ delay: 7_000, timeout: -1 });
