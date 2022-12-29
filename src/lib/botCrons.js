import { schedule } from "node-cron";
import { writeFile, readFileSync } from "fs"

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
