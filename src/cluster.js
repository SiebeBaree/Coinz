import dotenv from "dotenv";
dotenv.config();

import Cluster from 'discord-hybrid-sharding';
import loggerStruct from './structures/Logger.js';

const manager = new Cluster.Manager(`./src/bot.js`, {
    // totalClusters: 2,
    shardsPerClusters: 2,
    totalShards: 4,
    mode: 'process',
    token: process.env.DISCORD_TOKEN,
});
const logger = new loggerStruct(manager);

manager.on('clusterCreate', cluster => logger.load(`Launched Cluster ${cluster.id}`));
manager.spawn({ timeout: -1 });
