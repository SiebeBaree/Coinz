import { ClusterManager } from 'discord-hybrid-sharding';
import logger from './utils/logger';

const manager = new ClusterManager(`${__dirname}/bot.js`, {
    totalShards: Number.parseInt(process.env.SHARDS_PER_CLUSTER!) * Number.parseInt(process.env.TOTAL_CLUSTERS!),
    shardsPerClusters: Number.parseInt(process.env.SHARDS_PER_CLUSTER!),
    totalClusters: Number.parseInt(process.env.TOTAL_CLUSTERS!),
    mode: 'process',
    token: process.env.DISCORD_TOKEN,
});

manager.on('clusterCreate', (cluster) => logger.info(`Launched Cluster ${cluster.id}`));
manager.spawn({ delay: 7_000, timeout: -1 });
