import { schedule } from "node-cron";
import { processAirdrop } from "./airdrop.js"
import Guild from "../models/Guild.js"

// Airdrop Cron
schedule("*/45 * * * * *", async function () {
    try {
        const guilds = await Guild.find({
            $and: [
                { airdropStatus: true },
                { airdropChannel: { $ne: "" } },
                { airdropNext: { $lte: parseInt(Date.now() / 1000) } }
            ]
        });

        for (let i = 0; i < guilds.length; i++) await processAirdrop(guilds[i], [...bot.cluster.ids.keys()]);
    } catch (e) {
        bot.logger.error(e.stack);
    }
});
