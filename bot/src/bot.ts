import process from 'node:process';
import { setInterval } from 'node:timers';
import { getInfo } from 'discord-hybrid-sharding';
import { ActivityType, GatewayIntentBits, type Guild, Partials } from 'discord.js';
import { connect } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
// eslint-disable-next-line import/no-extraneous-dependencies
import Stats from 'sharding-stats';
import Bot from './domain/Bot';
import BotStats from './models/botStats';
import logger from './utils/logger';

(async () => {
    const bot = new Bot({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
        partials: [Partials.Channel],
        presence: {
            activities: [
                {
                    name: 'custom status',
                    state: '/help | coinzbot.xyz',
                    type: ActivityType.Custom,
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

        if (bot.cluster.id === bot.cluster.info.CLUSTER_COUNT - 1) {
            const updateStatsInDb = async () => {
                const guilds = await bot.cluster
                    .broadcastEval((c) => c.guilds.cache.size)
                    .then((results) => results.reduce((prev, val) => prev + val, 0));
                const users = await bot.cluster
                    .broadcastEval((c) =>
                        c.guilds.cache.reduce((acc: number, guild: Guild) => acc + guild.memberCount, 0),
                    )
                    .then((results) => results.reduce((acc, memberCount) => acc + memberCount, 0));
                const shards = bot.cluster.info.TOTAL_SHARDS;

                const botStat = new BotStats({
                    guilds: guilds,
                    users: users,
                    shards: shards,
                    updatedAt: new Date(),
                });
                await botStat.save();
            };

            // Update stats in the database every 2 hours
            setInterval(updateStatsInDb, 1000 * 60 * 120);

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            updateStatsInDb();
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
