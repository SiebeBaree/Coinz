import process from 'node:process';
import { setInterval } from 'node:timers';
import { getInfo } from 'discord-hybrid-sharding';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { connect } from 'mongoose';
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

    bot.once('ready', async () => {
        const updateStatsInDb = async () => {
            const guilds = [...bot.guilds.cache.values()];
            let users = 0;
            for (const guild of guilds) {
                users += guild.memberCount;
            }

            const botStat = await BotStats.findOne({ updatedAt: { $gte: new Date().setHours(0, 0, 0, 0) } });
            if (botStat) {
                const clusterIndex = botStat.clusters.findIndex((cluster) => cluster.id === bot.cluster.id);
                if (clusterIndex === -1) {
                    botStat.clusters.push({
                        id: bot.cluster.id,
                        guilds: guilds.length,
                        users: users,
                        totalShards: Number.parseInt(process.env.SHARDS_PER_CLUSTER!, 10),
                    });
                    await botStat.save();
                } else {
                    await BotStats.updateOne(
                        { _id: botStat._id, 'clusters.id': bot.cluster.id },
                        {
                            $set: {
                                'clusters.$.guilds': guilds.length,
                                'clusters.$.users': users,
                                'clusters.$.totalShards': Number.parseInt(process.env.SHARDS_PER_CLUSTER!, 10),
                            },
                        },
                    );
                }
            } else {
                const newBotStat = new BotStats({
                    clusters: [
                        {
                            id: bot.cluster.id,
                            guilds: guilds.length,
                            users: users,
                            totalShards: Number.parseInt(process.env.SHARDS_PER_CLUSTER!, 10),
                        },
                    ],
                });
                await newBotStat.save();
            }
        };

        // Update stats in the database every day
        setInterval(updateStatsInDb, 1000 * 60 * 60 * 24);

        await updateStatsInDb();
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
