import { schedule } from "node-cron";
import { getStockData, getCryptoData, isMarketOpen, uploadCryptoData, uploadStockData } from "./investing.js"
import Cooldown from "../models/Cooldown.js"
import Premium from "../models/Premium.js"
import { writeFile, readFileSync } from "fs"

// Stock Cron
schedule("*/40 * * * 1-5", async () => {
    if (process.env.NODE_ENV === "production") {
        if (!isMarketOpen()) return;
        const data = await getStockData();
        if (data === null) return bot.logger.warn("Stocks Cron went wrong... No data found.");
        await uploadStockData(data);
    }
}, {
    scheduled: true,
    timezone: "America/New_York"
});

// Crypto Cron
schedule("*/3 * * * *", async () => {
    if (process.env.NODE_ENV === "production") {
        const data = await getCryptoData();
        if (data === null) return bot.logger.warn("Crypto Cron went wrong... No data found.");
        await uploadCryptoData(data);
    }
});

// Removed Expired Cooldowns Cron
schedule("*/30 * * * *", async function () {
    const deleted = await Cooldown.deleteMany({ expiresOn: { $lte: parseInt(Date.now() / 1000) } });
    bot.logger.log(`Removed ${deleted.deletedCount} expired cooldowns.`);
});

// Update Stats Cron
schedule("*/30 * * * *", async function () {
    try {
        const promises = [
            bot.cluster.fetchClientValues('guilds.cache.size'),
            bot.cluster.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
        ];

        Promise.all(promises)
            .then(results => {
                let stats = JSON.parse(readFileSync('./src/assets/stats.json'));

                const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
                const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);

                stats.guilds = totalGuilds;
                stats.members = totalMembers;
                writeFile("./src/assets/stats.json", JSON.stringify(stats, null, 4), function writeJSON(err) {
                    if (err) return bot.logger.error(err);
                });
            }).catch();
    } catch (e) {
        bot.logger.error(e);
    }
});

// Remove expired premium status from users and guilds
schedule("30 5 * * *", async function () {
    try {
        const now = Math.floor(Date.now() / 1000);
        await Premium.deleteMany({ premiumExpiresAt: { $lte: now } });
    } catch (e) {
        bot.logger.error(e);
    }
});
