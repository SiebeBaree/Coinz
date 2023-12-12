import { join } from 'node:path';
import process from 'node:process';
import { ClusterManager } from 'discord-hybrid-sharding';
import logger from './utils/logger';

const manager = new ClusterManager(join(__dirname, 'bot.js'), {
    totalShards:
        Number.parseInt(process.env.SHARDS_PER_CLUSTER!, 10) * Number.parseInt(process.env.TOTAL_CLUSTERS!, 10),
    shardsPerClusters: Number.parseInt(process.env.SHARDS_PER_CLUSTER!, 10),
    totalClusters: Number.parseInt(process.env.TOTAL_CLUSTERS!, 10),
    mode: 'process',
    token: process.env.DISCORD_TOKEN,
});

manager.on('clusterCreate', (cluster) => logger.info(`Launched Cluster ${cluster.id}`));
void manager.spawn({ delay: 7_000, timeout: -1 });
