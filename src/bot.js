import Bot from "./structures/Bot.js"
import { ActivityType, GatewayIntentBits, Partials } from "discord.js"
import Cluster from "discord-hybrid-sharding"
import topgg from "@top-gg/sdk"
import Stats from "sharding-stats"
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

if (process.env.NODE_ENV === "production") {
    // Connect to Sharding Stats
    const statsClient = new Stats.Client(bot, {
        customPoster: true,
        authorizationkey: process.env.API_SHARDINGSTATS,
        stats_uri: process.env.WEBSERVER_URL,
    });

    setInterval(() => postStats(), 20_000);
}

async function postStats() {
    const shards = [...bot.ws.shards.values()];
    const guilds = [...bot.guilds.cache.values()];
    for (let i = 0; i < shards.length; i++) {
        const filteredGuilds = guilds ? guilds
            .filter(x => x.shardId === shards[i].id)
            .filter(Boolean)
            : [];

        const body = {
            id: shards[i] ? shards[i].id : -1,
            cluster: bot.cluster?.id,
            ping: shards[i] ? shards[i].ping : -1,
            guildcount: filteredGuilds.length,
            cpu: await statsClient.receiveCPUUsage(),
            ram: statsClient.getRamUsageinMB()
        }

        try {
            await statsClient.sendPostData(body);
        } catch {

        }
    }
}

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
    if (process.env.NODE_ENV === "production") await postStats() // To send the values on startup

    if (bot.cluster.count - 1 === bot.cluster.id) {
        if (process.env.NODE_ENV === "production") {
            const { default: app } = await import("./lib/api.js");

            const port = process.env.PORT || 8700;
            app.listen(port, () => bot.logger.ready(`Vote Webhooks available on port: ${port}`));
        }

        // Load Bot Crons Once
        await import("./lib/botCrons.js");

        const api = new topgg.Api(process.env.API_TOPGG);
        setInterval(async () => {
            const guilds = await bot.cluster.broadcastEval(c => c.guilds.cache.size);
            await api.postStats({
                serverCount: guilds.reduce((prev, val) => prev + val, 0),
                shardCount: bot.cluster.info.TOTAL_SHARDS,
            });
        }, 1800000);
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