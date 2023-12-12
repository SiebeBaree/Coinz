import process from 'node:process';
import { getInfo } from 'discord-hybrid-sharding';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { connect } from 'mongoose';
import Bot from './domain/Bot';
import logger from './utils/logger';

(async () => {
    const bot = new Bot({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
        partials: [Partials.Channel],
        presence: {
            activities: [
                {
                    name: '/help | coinzbot.xyz',
                    type: ActivityType.Watching,
                },
            ],
        },
        shardCount: getInfo().TOTAL_SHARDS,
        shards: getInfo().SHARD_LIST,
    });

    try {
        await connect(process.env.DATABASE_URI!);
        logger.info('Connected to the database.');
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }

    await bot.login(process.env.DISCORD_TOKEN!);
})();

const ignoredErrors = ['DiscordAPIError[10008]'];
process.on('uncaughtException', (err: Error) => {
    if (!ignoredErrors.includes(`${err.name}`)) {
        logger.error(err.stack);
    }
});

process.on('unhandledRejection', (err: Error) => {
    if (!ignoredErrors.includes(`${err.name}`)) {
        logger.error(err.stack);
    }
});
