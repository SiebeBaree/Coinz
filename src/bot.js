require('dotenv').config();
const { ActivityType, GatewayIntentBits, Partials } = require('discord.js');
const { connect } = require("mongoose");

const Bot = require('./structures/Bot.js');
const bot = global.bot = new Bot({
    partials: [Partials.Channel],
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
    presence: {
        activities: [{
            name: "Only for Beta Testers",
            type: ActivityType.Watching
        }], status: "online"
    }
});

bot.login();
bot.rest.on('rateLimit', rateLimitData => {
    bot.logger.warn(`RATELIMITED for ${parseInt(rateLimitData.timeout / 1000)} seconds | Limit: ${rateLimitData.limit} requests | Global? ${rateLimitData.global ? "yes" : "no"}`);
});

// Connect to MongoDB Database
connect(process.env.DATABASE_URI, {
    dbName: 'coinz_beta',
    useNewUrlParser: true,
    maxPoolSize: 100,
    minPoolSize: 5,
    family: 4,
    heartbeatFrequencyMS: 30000,
    keepAlive: true,
    keepAliveInitialDelay: 300000
}).then(() => bot.logger.ready('Connected to MongoDB'));

// Post stats to Top.gg & Discord Bot List
require("./scripts/autoPoster.js");

// Create Webhook
const app = require("./scripts/api.js");

const port = process.env.PORT || 8700;
app.listen(port, () => bot.logger.ready(`Vote Webhooks available on http://localhost:${port}`));

// Load Crons
require("./scripts/crons.js");

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