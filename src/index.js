require('dotenv').config();
const { ShardingManager } = require('discord.js');
const logger = require('./tools/logger');

const manager = new ShardingManager('./src/bot.js', { totalShards: 1, token: process.env.TOKEN });

manager.on('shardCreate', shard => logger.load(`Loading shard ${shard.id}.`));

manager.spawn();