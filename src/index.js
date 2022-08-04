require('dotenv').config();
const { ShardingManager } = require('discord.js');

const manager = new ShardingManager('./src/bot.js', { totalShards: 1, token: process.env.DISCORD_TOKEN });
manager.spawn();