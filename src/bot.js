import Bot from "./structures/Bot.js"
import { ActivityType, GatewayIntentBits, Partials } from "discord.js"
import Cluster from "discord-hybrid-sharding"
import { AutoPoster } from "topgg-autoposter";
import mongoose from "mongoose"
const { connect } = mongoose;

const ACTIVITY_NAME = process.env.NODE_ENV === "production" ? "/help | coinzbot.xyz" : "Only for Beta Testers";
const bot = global.bot = new Bot({
    partials: [Partials.Channel],
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
    presence: {
        activities: [{
            name: ACTIVITY_NAME,
            type: ActivityType.Watching
        }], status: "online"
    },
    shards: Cluster.data.SHARD_LIST,
    shardCount: Cluster.data.TOTAL_SHARDS
});

// Connect to MongoDB Database
const DB_NAME = process.env.NODE_ENV === "production" ? "coinz" : "coinz_beta";
connect(process.env.DATABASE_URI, {
    dbName: DB_NAME,
    useNewUrlParser: true,
    maxPoolSize: 100,
    minPoolSize: 5,
    family: 4,
    heartbeatFrequencyMS: 30000,
    keepAlive: true,
    keepAliveInitialDelay: 300000
}).then(() => bot.logger.ready('Connected to MongoDB'));

bot.login();
bot.rest.on('rateLimit', rateLimitData => {
    bot.logger.warn(`RATELIMITED for ${Math.floor(rateLimitData.timeout / 1000)} seconds | Limit: ${rateLimitData.limit} requests | Global? ${rateLimitData.global ? "yes" : "no"}`);
});

bot.on('ready', async () => {
    if (bot.cluster.count - 1 === bot.cluster.id) {
        if (process.env.NODE_ENV === "production") {
            AutoPoster(process.env.API_TOPGG, bot)
            const { default: app } = await import("./lib/api.js");

            const port = process.env.PORT || 8700;
            app.listen(port, () => bot.logger.ready(`Vote Webhooks available on port: ${port}`));
        }

        // Load Global Crons
        await import("./lib/crons.js");
    }

    // Load Cluster Crons
    await import("./lib/clusterCrons.js");
});

// Global Error Handler
const ignoredErrors = ["DiscordAPIError[10008]: Unknown Message"];
process.on('uncaughtException', (err) => {
    if (!ignoredErrors.includes(`${err.name}: ${err.message}`)) {
        bot.logger.error(err.stack);
    }
});

process.on('unhandledRejection', (err) => {
    if (!ignoredErrors.includes(`${err.name}: ${err.message}`)) {
        bot.logger.error(err.stack);
    }
});