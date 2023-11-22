import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import Bot from './domain/Bot';
import { getInfo } from 'discord-hybrid-sharding';
import { connect } from 'mongoose';
import logger from "./utils/logger";

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

    connect(process.env.DATABASE_URI!)
        .then(() => logger.debug("Connected to MongoDB"))
        .catch(logger.error);

    await bot.login(process.env.DISCORD_TOKEN!);
})();

process.on("uncaughtException", (err: Error) => {
    logger.error(err.stack);
});

process.on("unhandledRejection", (err: Error) => {
    logger.error(err.stack);
});