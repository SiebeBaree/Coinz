import dotenv from "dotenv";
dotenv.config();

import { ClusterManager } from "discord-hybrid-sharding";

class Manager {
    async init() {
        const manager = new ClusterManager(`${__dirname}/bot.js`, {
            token: process.env.DISCORD_TOKEN,
        });

        manager.on("clusterCreate", cluster => console.log(`Launched Cluster ${cluster.id}`));
        manager.spawn({ delay: 7_000, timeout: -1 });
    }
}

// Start the manager
new Manager().init();