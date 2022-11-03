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
        const stats = require("../../assets/stats.json");

        const newEmbed = new EmbedBuilder()
            .setAuthor({ name: `Bot Statistics`, iconURL: `${bot.user.avatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })
            .setTimestamp()
            .setDescription('**If you like this bot, maybe consider [donating](https://coinzbot.xyz/donate).**')
            .addFields(
                { name: 'Info', value: `:man_technologist: **Owner:** \`Siebe#0001\`\n:globe_with_meridians: **Website: [coinzbot.xyz](${bot.config.website})**\n:beginner: **Official Server: [discord.gg/asnZQwc6kW](https://discord.gg/asnZQwc6kW)**\n:books: **Library:** \`discord.js${dependencies["discord.js"]}\`\n:star: **Version:** \`${version}\``, inline: true },
                { name: 'Statistics', value: `:video_game: **Commands:** \`${bot.commands.size}\`\n:spider_web: **Shard:** \`${interaction.guild.shardId + 1}/${bot.shard.count}\`\n:white_check_mark: **Uptime:** \`${bot.tools.msToTime(bot.uptime)}\`\n:bust_in_silhouette: **Users:** \`${stats.members}\`\n:printer: **Servers:** \`${stats.guilds}\``, inline: true },
                { name: 'Disclamer', value: `Icons from the shop are from [icons8](https://icons8.com).`, inline: false }
            )
        return await interaction.editReply({ embeds: [newEmbed] });
    }
}

module.exports = Info;