const { ActivityType, GatewayIntentBits } = require('discord.js');

const Bot = require('./structures/Bot.js');
const bot = global.bot = new Bot({ intents: GatewayIntentBits.Guilds, presence: { activities: [{ name: "/help | coinzbot.xyz", type: ActivityType.Watching }], status: "online" } });

bot.login();

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