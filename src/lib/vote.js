import { fetchMember, fetchPremium } from "../lib/database.js";
import { EmbedBuilder } from "discord.js";
import Member from "../models/Member.js";

export async function processVote(memberId, website = "top.gg") {
    try {
        if (!bot.isReady()) return;

        const topgg = {
            id: "990540015853506590",
            name: "topgg",
            website: "Top.gg",
            vote: "https://top.gg/bot/938771676433362955"
        };

        const dbl = {
            id: "990540323967103036",
            name: "dbl",
            website: "discordbotlist.com",
            vote: "https://discordbotlist.com/bots/coinz"
        }

        const data = website === "top.gg" ? topgg : dbl;
        const member = await fetchMember(memberId);
        const premium = await fetchPremium(memberId, false);

        let extraSpins = 1;
        let extraText = "";

        if (premium.isPremium) {
            extraSpins = 2;
            extraText = `\nYou have received **2x** spins for being a premium member!`;
        } else {
            // 0 = Sunday, 6 = Saturday
            const now = new Date();
            if ([0, 6].includes(now.getDay())) {
                extraSpins = 2;
                extraText = `\nYou have received **2x** spins for voting on a weekend!`;
            }
        }

        if (member.notifs === undefined || member.notifs.vote === undefined) {
            member.notifs = {};
            member.notifs.vote = true;
        }

        if (member.notifs.vote === true) {
            const user = await bot.users.fetch(memberId);

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Thank you for voting!`, iconURL: `https://cdn.discordapp.com/emojis/${data.id}.png` })
                .setColor(bot.config.embed.color)
                .setDescription(`Thank you for voting on <:${data.name}:${data.id}> [**${data.website}**](${data.vote})${extraText}`)
                .addFields(
                    {
                        name: "Statistics",
                        value: `:calendar: **Total Votes:** ${member.votes + 1}x\n:moneybag: **Wheel spins left:** ${member.spins + extraSpins}x`,
                        inline: false
                    }
                )
                .setFooter({ text: "To disable these notifications, use /notification disable vote" })

            try {
                const dmChannel = await user.createDM();
                await dmChannel.send({ embeds: [embed] });
                await user.deleteDM();
            } catch { }
        }

        await Member.updateOne(
            { id: memberId },
            { $inc: { votes: 1, spins: extraSpins } },
            { upsert: true }
        );
    } catch (e) {
        bot.logger.error(e);
    }
}

export default processVote;