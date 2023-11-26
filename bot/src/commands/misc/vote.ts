import type { ColorResolvable } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { Command } from '../../domain/Command';

const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
        .setLabel('Top.gg')
        .setStyle(ButtonStyle.Link)
        .setEmoji('<:topgg:990540015853506590>')
        .setURL('https://top.gg/bot/938771676433362955/vote'),
    new ButtonBuilder()
        .setLabel('Discordbotlist.com')
        .setStyle(ButtonStyle.Link)
        .setEmoji('<:dbl:990540323967103036>')
        .setURL('https://discordbotlist.com/bots/coinz/upvote'),
    new ButtonBuilder()
        .setLabel('Discords.com')
        .setStyle(ButtonStyle.Link)
        .setEmoji('<:discords:1157587361069273119>')
        .setURL('https://discords.com/bots/bot/938771676433362955/vote'),
);

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
        await interaction.reply({ embeds: [embed], components: [row] });
    },
} satisfies Command;
