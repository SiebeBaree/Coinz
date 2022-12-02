import { fetchMember } from "../lib/database.js";
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
        if (member.notifs === undefined || member.notifs.vote === undefined) {
            member.notifs = {};
            member.notifs.vote = true;
        }

        if (member.notifs.vote === true) {
            const user = await bot.users.fetch(memberId);

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Thank you for voting!`, iconURL: `https://cdn.discordapp.com/emojis/${data.id}.png` })
                .setColor(bot.config.embed.color)
                .setDescription(`Thank you for voting on <:${data.name}:${data.id}> [**${data.website}**](${data.vote})`)
                .addFields({ name: "Statistics", value: `:calendar: **Total Votes:** ${member.votes + 1}x\n:moneybag: **Wheel spins left:** ${member.spins + 1}x`, inline: false })
                .setFooter({ text: "To disable these notifications, use /notification disable vote" })

            try {
                const dmChannel = await user.createDM();
                await dmChannel.send({ embeds: [embed] });
                await user.deleteDM();
            } catch { }
        }

        await Member.updateOne(
            { id: memberId },
            { $inc: { votes: 1, spins: 1 } },
            { upsert: true }
        );
    } catch (e) {
        bot.logger.error(e);
    }
}

export default processVote;