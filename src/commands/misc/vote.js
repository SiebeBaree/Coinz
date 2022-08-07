const Command = require('../../structures/Command.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setLabel("Top.gg")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:topgg:990540015853506590>")
        .setURL("https://top.gg/bot/938771676433362955/vote"),
    new ButtonBuilder()
        .setLabel("Discordbotlist.com")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:dbl:990540323967103036>")
        .setURL("https://discordbotlist.com/bots/coinz/upvote")
)

class Vote extends Command {
    info = {
        name: "vote",
        description: "Get all the links to the voting sites for rewards.",
        options: [],
        category: "misc",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const votes = data.user.votes === undefined ? 0 : data.user.votes;
        const embed = new EmbedBuilder()
            .setTitle(`Coinz Vote Links`)
            .setColor(bot.config.embed.color)
            .addFields(
                { name: 'Rewards (For each vote)', value: `:coin: 50 - 200`, inline: false },
                { name: 'Total Votes', value: `${votes > 0 ? `You have voted ${votes}x in total! Thank you!` : "You haven't voted yet. Please click on the links above to vote."}`, inline: false }
            )
            .setFooter({ text: bot.config.embed.footer })

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
}

module.exports = Vote;