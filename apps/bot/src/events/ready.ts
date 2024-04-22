import process from 'node:process';
import amqplib from 'amqplib';
import { type ColorResolvable, EmbedBuilder, Events } from 'discord.js';
import websites from '../data/websites.json';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';

const queue = 'votes';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(bot, client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);

        if (process.env.NODE_ENV === 'production') {
            const conn = await amqplib.connect(process.env.QUEUE_URI!);

            const ch1 = await conn.createChannel();
            await ch1.assertQueue(queue);

            void ch1.consume(queue, async (msg) => {
                if (msg === null) {
                    console.log('Consumer cancelled by server');
                } else {
                    const content = JSON.parse(msg.content.toString());
                    ch1.ack(msg);

                    const data = websites[content.website as keyof typeof websites];
                    const user = await bot.users.fetch(content.userId);

                    const embed = new EmbedBuilder()
                        .setAuthor({
                            name: 'Thank you for voting!',
                            iconURL: `https://cdn.discordapp.com/emojis/${data.id}.png`,
                        })
                        .setColor(bot.config.embed.color as ColorResolvable)
                        .setDescription(
                            `Thank you for voting on <:${data.name}:${data.id}> [**${data.website}**](${data.vote})`,
                        )
                        .addFields({
                            name: 'Statistics',
                            value: `:calendar: **Total Votes:** ${content.votes}x\n:moneybag: **Wheel spins left:** ${content.spins}x`,
                            inline: false,
                        })
                        .setFooter({
                            text: 'To disable these notifications, use /settings notification vote disable',
                        });

                    try {
                        const dmChannel = await user.createDM();
                        await dmChannel.send({ embeds: [embed] });
                        await user.deleteDM();
                    } catch {}
                }
            });
        }
    },
} satisfies Event<Events.ClientReady>;
