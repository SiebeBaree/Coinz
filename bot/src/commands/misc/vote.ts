import type { ColorResolvable } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import type { Command } from '../../domain/Command';
import { getVotingRow } from '../../utils';

export default {
    data: {
        name: 'vote',
        description: 'Get all the links to the voting sites for rewards.',
        category: 'misc',
    },
    async execute(client, interaction, member) {
        const votes = member.votes ?? 0;
        const embed = new EmbedBuilder()
            .setTitle('Vote Links')
            .setColor(client.config.embed.color as ColorResolvable)
            .addFields([
                {
                    name: 'Rewards (For each vote)',
                    value: 'A free wheel spin. Use `/lucky-wheel rewards` to see possible rewards.',
                    inline: false,
                },
                {
                    name: 'Total Votes',
                    value: `${
                        votes > 0
                            ? `You have voted ${votes}x in total! Thank you!`
                            : "You haven't voted yet. Please click on the links below to vote."
                    }`,
                    inline: false,
                },
            ])
            .setFooter({ text: client.config.embed.footer });
        await interaction.reply({ embeds: [embed], components: [getVotingRow()] });
    },
} satisfies Command;
