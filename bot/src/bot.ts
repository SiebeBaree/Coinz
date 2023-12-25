import process from 'node:process';
import { setInterval } from 'node:timers';
import { getInfo } from 'discord-hybrid-sharding';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { connect } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
// eslint-disable-next-line import/no-extraneous-dependencies
import Stats from 'sharding-stats';
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

    bot.once('ready', () => {
        if (process.env.NODE_ENV === 'production') {
            const statsClient = new Stats.Client(bot, {
                customPoster: true,
                authorizationkey: process.env.API_SHARDINGSTATS,
                stats_uri: process.env.WEBSERVER_URL,
            });

            const postStats = async () => {
                const shards = [...bot.ws.shards.values()];
                const guilds = [...bot.guilds.cache.values()];
                for (const shard of shards) {
                    const filteredGuilds = guilds ? guilds.filter((x) => x.shardId === shard.id).filter(Boolean) : [];

                    const body = {
                        id: shard ? shard.id : -1,
                        cluster: bot.cluster?.id,
                        ping: shard ? shard.ping : -1,
                        guildCount: filteredGuilds.length,
                        memberCount: filteredGuilds.reduce((a, b) => a + b.memberCount, 0),
                    };

                    await statsClient.sendPostData(body);
                }
            };

            setInterval(postStats, 1000 * 15);
        }
    });

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
