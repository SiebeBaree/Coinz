import type { ActionRowBuilder, ColorResolvable } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import type Bot from '../domain/Bot';

export function createLogEmbed({
    client,
    title,
    description,
    author,
    details,
}: {
    client: Bot;
    description: string;
    title?: string;
    author?: { name: string; iconURL?: string };
    details?: { moderator: string; reason?: string };
}): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setFooter({ text: client.config.embed.footer })
        .setColor(client.config.embed.color as ColorResolvable);

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(`>>> ${description}`);
    if (author) embed.setAuthor(author);
    if (details) {
        embed.addFields([
            {
                name: 'Information',
                value: `:hammer: **Moderator** <@${details.moderator}>\n:scroll: **Reason** ${details.reason}`,
                inline: false,
            },
        ]);
    }

    return embed;
}

export async function sendLog(
    client: Bot,
    embed: EmbedBuilder,
    components?: ActionRowBuilder<any>[],
    isPublic: boolean = false,
): Promise<void> {
    const logChannel = await client.channels.fetch(isPublic ? client.config.logChannel : client.config.modLogChannel);

    if (!logChannel || !logChannel.isTextBased()) {
        throw new Error('Log channel not found');
    }

    await logChannel.send({
        embeds: [embed],
        components,
    });
}
