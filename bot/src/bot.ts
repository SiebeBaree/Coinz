import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { connect } from "mongoose";
import Bot from "./domain/Bot";
import { getInfo } from "discord-hybrid-sharding";

class Main {
    private readonly client: Bot;
    private readonly IGNORED_ERRORS = [
        "DiscordAPIError[10008]"
    ];

    constructor() {
        this.client = new Bot({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [
                Partials.Channel,
            ],
            presence: {
                activities: [{
                    name: process.env.NODE_ENV === "production" ? "/help | coinzbot.xyz" : "",
                    type: ActivityType.Watching,
                }],
            },
            shardCount: getInfo().TOTAL_SHARDS,
            shards: getInfo().SHARD_LIST,
        });
    }

    async init() {
        await this.client.login(process.env.DISCORD_TOKEN);

        connect(process.env.DATABASE_URI!)
            .then(() => this.client.logger.debug("Connected to MongoDB"))
            .catch(this.client.logger.error);

        process.on("uncaughtException", (err: Error) => {
            if (!this.IGNORED_ERRORS.includes(`${err.name}`)) {
                this.client.logger.error(err.stack);
            }
        });

        process.on("unhandledRejection", (err: Error) => {
            if (!this.IGNORED_ERRORS.includes(`${err.name}`)) {
                this.client.logger.error(err.stack);
            }
        });
    }
}

new Main().init().then(r => r).catch(e => console.error(e));