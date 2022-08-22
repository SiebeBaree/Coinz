require('dotenv').config();
const { ActivityType, GatewayIntentBits } = require('discord.js');
const { schedule } = require('node-cron');
const axios = require('axios');
const { AutoPoster } = require('topgg-autoposter');

const Bot = require('./structures/Bot.js');
const bot = global.bot = new Bot({ intents: GatewayIntentBits.Guilds, presence: { activities: [{ name: "/help | coinzbot.xyz", type: ActivityType.Watching }], status: "online" } });

bot.login();
AutoPoster(process.env.API_TOPGG, bot);

schedule('0 * * * *', async function () {
    const promises = [
        bot.shard.fetchClientValues('guilds.cache.size'),
        bot.shard.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
    ];

    Promise.all(promises)
        .then(results => {
            const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
            const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);

            await axios.post('https://discordbotlist.com/api/v1/bots/938771676433362955/stats', {
                guilds: totalGuilds,
                users: totalMembers
            }, {
                headers: {
                    "Authorization": process.env.API_DISCORDBOTLIST
                }
            });
        }).catch();
});

bot.rest.on('rateLimit', rateLimitData => {
    bot.logger.warn(`RATELIMITED for ${parseInt(rateLimitData.timeout / 1000)} seconds | Limit: ${rateLimitData.limit} requests | Global? ${rateLimitData.global ? "yes" : "no"}`);
});

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