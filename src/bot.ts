import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { connect, set } from "mongoose";
import Bot from "./structs/Bot";

class Main {
    private client: Bot;
    private readonly ACTIVITY_NAME = process.env.NODE_ENV === "production" ? "/help | coinzbot.xyz" : "Only for Beta Testers";

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
        const DB_NAME = process.env.NODE_ENV === "production" ? "coinz_v3" : "coinz_v3_beta";
        set("strictQuery", false);
        connect(process.env.DATABASE_URI ?? "", {
            dbName: DB_NAME,
            maxPoolSize: 100,
            minPoolSize: 5,
            family: 4,
            heartbeatFrequencyMS: 30000,
            keepAlive: true,
            keepAliveInitialDelay: 300000,
        })
            .then(() => console.log("Connected to MongoDB"))
            .catch(console.error);
    }
}

// Start the bot
new Main().init();