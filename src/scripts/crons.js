const { schedule } = require("node-cron");
const moment = require("moment");

const {
    getStockData,
    getCryptoData,
    isMarketOpen,
    uploadCryptoData,
    uploadStockData
} = require("./helpers.js");
const { processAirdrop } = require("./airdrop.js");
const CooldownModel = require("../models/Cooldown.js");
const GuildModel = require("../models/Guild.js");
const fs = require("fs");

// Stock Cron
schedule("*/40 * * * 1-5", async () => {
    if (!isMarketOpen()) return;
    const data = await getStockData();
    if (data === null) return bot.logger.warn("Stocks Cron went wrong... No data found.");
    await uploadStockData(data);
}, {
    scheduled: true,
    timezone: "America/New_York"
});

// Crypto Cron
schedule("*/3 * * * *", async () => {
    const data = await getCryptoData();
    if (data === null) return bot.logger.warn("Crypto Cron went wrong... No data found.");
    await uploadCryptoData(data);
});

// Removed Expired Cooldowns Cron
schedule("*/30 * * * *", async function () {
    const deleted = await CooldownModel.deleteMany({ expiresOn: { $lte: parseInt(Date.now() / 1000) } });
    bot.logger.log(`[${moment().format("DD/MM/YYYY HH:mm")}] Removed ${deleted.deletedCount} expired cooldowns.`);
});

// Airdrop Cron
schedule("*/20 * * * * *", async function () {
    try {
        if (!bot.isReady()) return;

        const guilds = await GuildModel.find({
            $and: [
                { airdropStatus: true },
                { airdropChannel: { $ne: "" } },
                { airdropNext: { $lte: parseInt(Date.now() / 1000) } }
            ]
        });

        for (let i = 0; i < guilds.length; i++) await processAirdrop(guilds[i]);
    } catch (e) {
        bot.logger.error(e);
    }
});

// Update Stats Cron
schedule("0 * * * * *", async function () {
    try {
        if (!bot.isReady()) return;

        const promises = [
            bot.shard.fetchClientValues('guilds.cache.size'),
            bot.shard.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
        ];

        Promise.all(promises)
            .then(results => {
                let stats = require("../assets/stats.json");
                const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
                const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);

                stats.guilds = totalGuilds;
                stats.members = totalMembers;
                fs.writeFile("../assets/stats.json", JSON.stringify(file), function writeJSON(err) {
                    if (err) return bot.logger.error(err);
                });
            }).catch();
    } catch (e) {
        bot.logger.error(e);
    }
});