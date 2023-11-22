import { ClusterManager } from 'discord-hybrid-sharding'
import logger from './utils/logger';

const manager = new ClusterManager(`${__dirname}/bot.js`, {
    totalShards: parseInt(process.env.SHARDS_PER_CLUSTER!) * parseInt(process.env.TOTAL_CLUSTERS!),
    shardsPerClusters: parseInt(process.env.SHARDS_PER_CLUSTER!),
    totalClusters: parseInt(process.env.TOTAL_CLUSTERS!),
    mode: 'process',
    token: process.env.DISCORD_TOKEN,
});

manager.on('clusterCreate', cluster => logger.info(`Launched Cluster ${cluster.id}`));
manager.spawn({ delay: 7000, timeout: -1 });