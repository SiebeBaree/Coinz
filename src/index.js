require('dotenv').config();
const { ShardingManager } = require('discord.js');
const loggerStruct = require('./structures/Logger');

const manager = new ShardingManager('./src/bot.js', { token: process.env.DISCORD_TOKEN });
const logger = new loggerStruct(manager);

manager.on('shardCreate', shard => logger.load(`Loading shard ${shard.id}.`));
manager.spawn();