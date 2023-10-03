import "dotenv/config";
import { ClusterManager } from "discord-hybrid-sharding";
import Logger from "./domain/Logger";

const SHARDS_PER_CLUSTER = 5;
const TOTAL_CLUSTERS = 5;

class Manager {
    async init() {
        const logger = new Logger().logger;
        const manager = new ClusterManager(`${__dirname}/bot.js`, {
            totalShards: process.env.NODE_ENV === "production" ? SHARDS_PER_CLUSTER * TOTAL_CLUSTERS : "auto",
            totalClusters: process.env.NODE_ENV === "production" ? TOTAL_CLUSTERS : 1,
            shardsPerClusters: process.env.NODE_ENV === "production" ? SHARDS_PER_CLUSTER : 1,
            token: process.env.DISCORD_TOKEN,
        });

        manager.on("clusterCreate", cluster => logger.info(`Booting Cluster ${cluster.id}`));
        await manager.spawn({ delay: 7_000, timeout: -1 });
    }
}

new Manager().init().then(r => r).catch(e => console.error(e));