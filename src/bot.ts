import { ActivityType, GatewayIntentBits, Guild, Partials } from "discord.js";
import { postBotStats } from "discordbotlist";
import { connect, set } from "mongoose";
import topgg from "@top-gg/sdk";
import Bot from "./structs/Bot";
import axios from "axios";

class Main {
    private client: Bot;
    private readonly ACTIVITY_NAME = process.env.NODE_ENV === "production" ? "/help | coinzbot.xyz" : "Experimental Features";

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
                    name: this.ACTIVITY_NAME,
                    type: ActivityType.Watching,
                }],
            },
        });

    }

    async init() {
        await this.client.login(process.env.DISCORD_TOKEN);

        // Connect to MongoDB Database
        set("strictQuery", false);
        connect(process.env.DATABASE_URI ?? "", {
            maxPoolSize: 100,
            minPoolSize: 5,
            family: 4,
            heartbeatFrequencyMS: 30000,
            keepAlive: true,
            keepAliveInitialDelay: 300000,
        })
            .then(() => this.client.logger.info("Connected to MongoDB"))
            .catch(this.client.logger.error);

        this.client.on("ready", async () => {
            if (this.client.cluster?.id === (this.client.cluster?.info.CLUSTER_COUNT ?? 1) - 1) {
                if (process.env.NODE_ENV === "production") {
                    const topggApi = new topgg.Api(process.env.API_BOTLIST_DBL ?? "");

                    setInterval(async () => {
                        try {
                            const guilds = await this.client.cluster?.broadcastEval(c => c.guilds.cache.size)
                                .then(results => results.reduce((prev, val) => prev + val, 0));
                            const users = await this.client.cluster?.broadcastEval(c => c.guilds.cache.reduce((acc: number, guild: Guild) => acc + guild.memberCount, 0))
                                .then(results => results.reduce((acc, memberCount) => acc + memberCount, 0));
                            this.client.logger.info(`Coinz Stats: ${guilds} guilds, ${users} users`);

                            // Posting to top.gg
                            await topggApi.postStats({
                                serverCount: guilds ?? 0,
                                shardCount: this.client.cluster?.info.TOTAL_SHARDS ?? 1,
                            });

                            // Posting to discordbotlist.com
                            postBotStats(process.env.API_BOTLIST_DBL ?? "", this.client.user?.id ?? "", {
                                guilds: guilds ?? 0,
                                users: users ?? 0,
                            });

                            // Posting to discords.com
                            axios.post(`https://discords.com/bots/api/bot/${this.client.user?.id}`, {
                                body: {
                                    server_count: guilds ?? 0,
                                },
                                headers: {
                                    Authorization: process.env.API_BOTLIST_DISCORDS,
                                },
                            });

                            // Posting to discord.bots.gg
                            axios.post(`https://discord.bots.gg/api/v1/bots/${this.client.user?.id}/stats`, {
                                body: {
                                    guildCount: guilds ?? 0,
                                    shardCount: this.client.cluster?.info.TOTAL_SHARDS ?? 1,
                                },
                                headers: {
                                    Authorization: process.env.API_BOTLIST_DISCORD_BOTS_GG,
                                },
                            });
                        } catch (err) {
                            this.client.logger.error(err);
                        }
                    }, 1800000);
                }
            }
        });

        // Global Error Handler
        const ignoredErrors = ["DiscordAPIError[10008]"];
        process.on("uncaughtException", (err: Error) => {
            if (!ignoredErrors.includes(`${err.name}`)) {
                this.client.logger.error(err.stack);
            }
        });

        process.on("unhandledRejection", (err: Error) => {
            if (!ignoredErrors.includes(`${err.name}`)) {
                this.client.logger.error(err.stack);
            }
        });
    }
}

// Start the bot
new Main().init();