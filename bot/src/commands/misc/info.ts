import type { ColorResolvable } from 'discord.js';
import { EmbedBuilder, version } from 'discord.js';
import type { Command } from '../../domain/Command';
import { msToTime } from '../../utils';

export default {
    data: {
        name: 'info',
        description: 'Get some information about Coinz.',
        category: 'misc',
    },
    async execute(client, interaction) {
        const now = Date.now();
        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Bot Statistics',
                iconURL: `${client.user?.avatarURL() ?? client.config.embed.icon}`,
            })
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(
                `**If you like this bot, consider buying [Coinz Premium](${client.config.website}/premium).**`,
            )
            .addFields([
                {
                    name: 'Info',
                    value:
                        `:man_technologist: **Developer:** \`siebe_b\`\n` +
                        `:globe_with_meridians: **Website:** [coinzbot.xyz](${client.config.website})\n` +
                        `:beginner: **Official Server:** [Join here](${client.config.supportServer})\n` +
                        `:books: **Library:** \`discord.js ${version}\``,
                    inline: true,
                },
                {
                    name: 'Statistics',
                    value:
                        `:video_game: **Commands:** \`${client.commands.size}\`\n` +
                        `:spider_web: **Shard:** \`${(interaction.guild?.shardId ?? 0) + 1}/${client.cluster?.info
                            .TOTAL_SHARDS}\`\n` +
                        `:ping_pong: **Ping:** \`${client.ws.ping} ms\`\n:speech_balloon: **Responds Time:** \`${
                            now - interaction.createdTimestamp
                        } ms\`\n` +
                        `:white_check_mark: **Uptime:** \`${msToTime(client.uptime ?? 0)}\``,
                    inline: true,
                },
                {
                    name: 'Disclaimer',
                    value: 'Icons from the shop are from [icons8](https://icons8.com).',
                    inline: false,
                },
            ]);
        await interaction.reply({ embeds: [embed] });
    },
} satisfies Command;
