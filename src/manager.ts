import dotenv from "dotenv";
dotenv.config();

import { ClusterManager } from "discord-hybrid-sharding";
import Logger from "./structs/Logger";

class Manager {
    async init() {
        const logger = new Logger().logger;
        const manager = new ClusterManager(`${__dirname}/bot.js`, {
            totalShards: process.env.NODE_ENV === "production" ? 9 : "auto",
            totalClusters: process.env.NODE_ENV === "production" ? 3 : 1,
            shardsPerClusters: process.env.NODE_ENV === "production" ? 3 : 1,
            token: process.env.DISCORD_TOKEN,
        });

        manager.on("clusterCreate", cluster => logger.info(`Booting Cluster ${cluster.id}`));
        manager.spawn({ delay: 7_000, timeout: -1 });
    }
}

// Start the manager
new Manager().init();