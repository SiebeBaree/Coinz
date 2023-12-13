import type { ChatInputCommandInteraction, ColorResolvable } from 'discord.js';
import { ComponentType, EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getUserStats } from '../../lib/database';
import type { IMember } from '../../models/member';
import Member from '../../models/member';
import type { IUserStats } from '../../models/userStats';
import { filter } from '../../utils';
import { calculatePageNumber, getPageButtons } from '../../utils/embed';

async function getList(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const createList = (userStats: IUserStats, page: number, itemsPerPage = 7): string => {
        const achievements = Array.from(client.achievement.all.values()).splice(page * itemsPerPage, itemsPerPage);

        let returnValue = '';
        for (const achievement of achievements) {
            const progress = achievement.progress(member, userStats);
            const name = member.badges.includes(achievement.id) ? `~~${achievement.name}~~` : achievement.name;
            returnValue += `<:${achievement.id}:${achievement.emoji}> **${name}**${
                progress ? ` (${progress})` : ''
            }\n> ${achievement.description}\n\n`;
        }

        return returnValue.trim();
    };

    const createEmbed = (desc: string, page: number, maxPage: number): EmbedBuilder => {
        return new EmbedBuilder()
            .setTitle('Achievements List')
            .setDescription(desc ?? 'No achievements found.')
            .setColor(client.config.embed.color as ColorResolvable)
            .setFooter({ text: `/achievement refresh to get new achievements. ─ Page ${page + 1} of ${maxPage}.` });
    };

    let page = 0;
    const ItemsPerPage = 7;
    const maxPage = Math.ceil(client.achievement.all.size / ItemsPerPage);
    const userStats = await getUserStats(member.id);

    const message = await interaction.reply({
        embeds: [createEmbed(createList(userStats, page, ItemsPerPage), page, maxPage)],
        components: getPageButtons(page, maxPage),
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        max: maxPage > 10 ? maxPage : 10,
        time: 90_000,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i) => {
        if (i.customId.startsWith('page_')) {
            page = calculatePageNumber(i.customId, page, maxPage);
            await i.update({
                embeds: [createEmbed(createList(userStats, page, ItemsPerPage), page, maxPage)],
                components: getPageButtons(page, maxPage),
            });
        }
    });

    collector.on('end', async () => {
        await interaction.editReply({ components: getPageButtons(page, maxPage, true) });
    });
}

async function getRefresh(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const userStats = await getUserStats(member.id);
    const achievements = Array.from(client.achievement.all.values()).filter(
        (achievement) => !member.badges.includes(achievement.id) && achievement.hasAchieved(member, userStats),
    );

    if (!achievements.length) {
        await interaction.reply({ content: "You don't have any new achievements.", ephemeral: true });
        return;
    }

    await Member.updateOne(
        { id: member.id },
        { $push: { badges: { $each: achievements.map((achievement) => achievement.id) } } },
    );

    const embed = new EmbedBuilder()
        .setTitle('New Achievements')
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            achievements
                .map((achievement) => `<:${achievement.id}:${achievement.emoji}> **${achievement.name}**`)
                .join('\n'),
        );
    await interaction.reply({ embeds: [embed] });
}

async function getDisplay(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    const achievementName = interaction.options.getString('achievement', true).toLowerCase();

    const achievement = client.achievement.getById(achievementName) ?? client.achievement.getByName(achievementName);
    if (!achievement) {
        await interaction.reply({ content: "That achievement doesn't exist.", ephemeral: true });
        return;
    }

    if (!member.badges.includes(achievement.id)) {
        await interaction.reply({
            content: "You don't have that achievement.",
            ephemeral: true,
        });
        return;
    }

    await Member.updateOne({ id: member.id }, { $set: { displayedBadge: achievement.id } });
    await interaction.reply({
        content: `You have selected the achievement <:${achievement.id}:${achievement.emoji}> **${achievement.name}**.`,
    });
}

export default {
    data: {
        name: 'achievement',
        description: 'Get a list of all achievements or refresh your achievements.',
        category: 'misc',
        options: [
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list with all achievements.',
                options: [],
            },
            {
                name: 'refresh',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Scan for new achievements you might have received.',
                options: [],
            },
            {
                name: 'display',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Select an achievement to display on your profile.',
                options: [
                    {
                        name: 'achievement',
                        type: ApplicationCommandOptionType.String,
                        description: 'The achievement id or name you want to select.',
                        required: true,
                    },
                ],
            },
        ],
        usage: ['list', 'refresh', 'display <achievement>'],
    },
    async execute(client, interaction, member) {
        switch (interaction.options.getSubcommand()) {
            case 'list':
                await getList(client, interaction, member);
                break;
            case 'refresh':
                await getRefresh(client, interaction, member);
                break;
            case 'display':
                await getDisplay(client, interaction, member);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
