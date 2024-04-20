import type { ColorResolvable } from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';

export default {
    data: {
        name: 'balance',
        description: 'Get your balance or the balance of another user.',
        category: 'general',
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the balance of another user.',
                required: false,
            },
        ],
        usage: ['[user]'],
    },
    async execute(client, interaction, member) {
        const user = interaction.options.getUser('user') ?? interaction.user;
        if (user.bot) {
            await interaction.reply({ content: "You can't get the balance of a bot.", ephemeral: true });
            return;
        }

        const memberData = interaction.user.id === user.id ? member : await getMember(user.id);
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.username}'s Balance`, iconURL: user.avatarURL() ?? undefined })
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(
                `:dollar: **Wallet:** :coin: ${memberData.wallet}\n` +
                    `:bank: **Bank:** :coin: ${memberData.bank} / ${memberData.bankLimit || 7_500}\n` +
                    `:moneybag: **Net Worth:** :coin: ${memberData.wallet + memberData.bank}`,
            );

        await interaction.reply({ embeds: [embed] });
    },
} satisfies Command;
