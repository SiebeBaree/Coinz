const Command = require('../../structures/Command.js');
const { dependencies, version } = require('../../../package.json');
const { EmbedBuilder } = require('discord.js');

class Info extends Command {
    info = {
        name: "info",
        description: "Get some information about Coinz.",
        options: [],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: false,
        deferReply: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        const promises = [
            bot.shard.fetchClientValues('guilds.cache.size'),
            bot.shard.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
        ];

        Promise.all(promises)
            .then(results => {
                const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
                const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);

                const newEmbed = new EmbedBuilder()
                    .setAuthor({ name: `Bot Statistics`, iconURL: `${bot.user.avatarURL() || bot.config.embed.defaultIcon}` })
                    .setColor(bot.config.embed.color)
                    .setFooter({ text: bot.config.embed.footer })
                    .setTimestamp()
                    .setDescription('**If you like this bot, maybe consider [donating](https://coinzbot.xyz/donate).**')
                    .addFields(
                        { name: 'Info', value: `:man_technologist: **Developer:** \`Siebe#0001\`\n:globe_with_meridians: **Website: [coinzbot.xyz](${bot.config.website})**\n:beginner: **Official Server: [discord.gg/asnZQwc6kW](https://discord.gg/asnZQwc6kW)**\n:books: **Library:** \`discord.js${dependencies["discord.js"]}\`\n:star: **Version:** \`${version}\``, inline: true },
                        { name: 'Statistics', value: `:video_game: **Commands:** \`${bot.commands.size}\`\n:spider_web: **Shard:** \`${interaction.guild.shardId + 1}/${bot.shard.count}\`\n:white_check_mark: **Uptime:** \`${bot.tools.msToTime(bot.uptime)}\`\n:film_frames: **Memory Usage:** \`${Math.round(usedMemory * 100) / 100} MB\`\n:bust_in_silhouette: **Users:** \`${totalMembers}\`\n:printer: **Servers:** \`${totalGuilds}\``, inline: true },
                        { name: 'Disclamer', value: `Icons from the shop are from [icons8](https://icons8.com).`, inline: false }
                    )
                return interaction.editReply({ embeds: [newEmbed] });
            }).catch();
    }
}

module.exports = Info;