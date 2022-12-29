import dotenv from "dotenv";
dotenv.config();

import Cluster from 'discord-hybrid-sharding';
import loggerStruct from './structures/Logger.js';
import "./lib/crons.js";

const manager = new Cluster.Manager(`./src/bot.js`, {
    shardsPerClusters: 2,
    mode: 'process',
    token: process.env.DISCORD_TOKEN,
});
const logger = new loggerStruct(manager);

manager.on('clusterCreate', cluster => logger.load(`Launched Cluster ${cluster.id}`));
manager.spawn({ timeout: -1 });
