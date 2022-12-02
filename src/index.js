import dotenv from "dotenv";
dotenv.config();

import { ShardingManager } from 'discord.js';
import loggerStruct from './structures/Logger.js';

const manager = new ShardingManager('./src/bot.js', { token: process.env.DISCORD_TOKEN });
const logger = new loggerStruct(manager);

logger.log(`Running bot in ${process.env.NODE_ENV} mode.`);
manager.on('shardCreate', shard => logger.load(`Loading shard ${shard.id}.`));
manager.spawn();