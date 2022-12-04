import Command from '../../structures/Command.js'
import { EmbedBuilder } from 'discord.js'
import packageFile from '../../../package.json' assert { type: 'json' }
import { version } from 'discord.js'
import { readFileSync } from 'fs'
import { msToTime } from '../../lib/helpers.js'

export default class extends Command {
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
        const stats = JSON.parse(readFileSync('./src/assets/stats.json'));

        const newEmbed = new EmbedBuilder()
            .setAuthor({ name: `Bot Statistics`, iconURL: `${bot.user.avatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })
            .setTimestamp()
            .setDescription('**If you like this bot, maybe consider buying [Coinz Premium](https://coinzbot.xyz/store).**')
            .addFields(
                { name: 'Info', value: `:man_technologist: **Owner:** \`Siebe#0001\`\n:globe_with_meridians: **Website: [coinzbot.xyz](${bot.config.website})**\n:beginner: **Official Server: [discord.gg/asnZQwc6kW](https://discord.gg/asnZQwc6kW)**\n:books: **Library:** \`discord.js ${version}\`\n:star: **Version:** \`${packageFile.version}\``, inline: true },
                { name: 'Statistics', value: `:video_game: **Commands:** \`${bot.commands.size}\`\n:spider_web: **Shard:** \`${interaction.guild.shardId + 1}/${bot.shard.count}\`\n:white_check_mark: **Uptime:** \`${msToTime(bot.uptime)}\`\n:bust_in_silhouette: **Users:** \`${stats.members}\`\n:printer: **Servers:** \`${stats.guilds}\``, inline: true },
                { name: 'Disclaimer', value: `Icons from the shop are from [icons8](https://icons8.com).`, inline: false }
            )
        return await interaction.editReply({ embeds: [newEmbed] });
    }
}