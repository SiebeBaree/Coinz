import type { ColorResolvable } from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';
import type { InventoryItem } from '../../lib/types';
import Business from '../../models/business';
import type { IMember } from '../../models/member';
import {
    experienceToNextLevel,
    feetToMeters,
    formatNumber,
    getCountryEmote,
    getCountryName,
    getExperienceFromLevel,
    getLevel,
} from '../../utils';

function createProgressBar(percentage: number): string {
    const progress = Math.floor(percentage / 10);
    const bar = [];

    bar.push(progress === 0 ? '<:bar_start0:1054825378688020601>' : '<:bar_start1:1054825380055371866>');

    for (let i = 2; i <= 9; i++) {
        bar.push(progress < i ? '<:bar_mid0:1054825371146657903>' : '<:bar_mid1:1054825377157087254>');
    }

    bar.push(progress < 10 ? '<:bar_end0:1054825373801644093>' : '<:bar_end1:1054825376087547995>');

    return bar.join('');
}

function getInventoryValue(client: Bot, inventory: InventoryItem[]) {
    const data = {
        items: 0,
        value: 0,
    };

    for (const invItem of inventory) {
        const item = client.items.getById(invItem.itemId);
        if (!item) continue;

        data.items += invItem.amount;
        data.value += invItem.amount * (item.sellPrice ?? 0);
    }

    return data;
}

async function getInvestmentsValue(client: Bot, investments: IMember['investments']) {
    const data = {
        investments: 0,
        currentValue: 0,
        buyPrice: 0,
    };

    for (const memberInvestment of investments) {
        const investment = await client.investment.getInvestment(memberInvestment.ticker);
        if (!investment) continue;

        const amount = Number.parseFloat(memberInvestment.amount);
        data.investments += amount;
        data.currentValue += amount * Number.parseFloat(investment.price);
        data.buyPrice += memberInvestment.buyPrice;
    }

    return data;
}

function getAge(birthday: Date) {
    return (
        new Date().getFullYear() -
        birthday.getFullYear() -
        (new Date() < new Date(new Date().getFullYear(), birthday.getMonth(), birthday.getDate()) ? 1 : 0)
    );
}

export default {
    data: {
        name: 'profile',
        description: "Get your or another user's profile. You can see detailed information here.",
        category: 'general',
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the profile of another member.',
                required: false,
            },
        ],
        deferReply: true,
        usage: ['[user]'],
    },
    async execute(client, interaction, member) {
        const user = interaction.options.getUser('user') ?? interaction.user;
        if (user.bot) {
            await interaction.editReply({ content: "You can't get the profile of a bot." });
            return;
        }

        const memberData = interaction.user.id === user.id ? member : await getMember(user.id);

        const inventory = getInventoryValue(client, memberData.inventory);
        const investments = await getInvestmentsValue(client, memberData.investments);
        const displayedBadge = client.achievement.getById(memberData.displayedBadge);
        const workJob = memberData.job === '' ? 'Unemployed' : memberData.job;

        const business = await Business.findOne({ id: memberData.id });
        const businessJob = business ? business.name : 'None';

        const level = getLevel(memberData.experience);
        const xpToNextLevel = experienceToNextLevel(level, 0);
        const totalXpToPreviousLevel = getExperienceFromLevel(level - 1);
        const percentage = Math.floor(
            ((xpToNextLevel - experienceToNextLevel(level, memberData.experience - totalXpToPreviousLevel)) /
                xpToNextLevel) *
                100,
        );

        let description = '';
        description +=
            memberData.birthday.getTime() > 0
                ? `**Age:** ${getAge(memberData.birthday)} years old (Born on <t:${memberData.birthday.getTime() / 1_000}:D>)`
                : '';
        description += memberData.country
            ? `\n**Country:** ${getCountryName(memberData.country)} ${getCountryEmote(memberData.country)}`
            : '';

        const embed = new EmbedBuilder()
            .setTitle(
                `${user.username}'s Profile${displayedBadge ? ` <:${displayedBadge.id}:${displayedBadge.emoji}>` : ''}`,
            )
            .setThumbnail(user.displayAvatarURL())
            .setColor((memberData.profileColor || client.config.embed.color) as ColorResolvable)
            .setDescription(description.length > 0 ? description : null)
            .addFields([
                {
                    name: 'Experience',
                    value: `:beginner: **Level:** \`${level}\`\n:game_die: **Next Level:** \`${percentage}%\`\n${createProgressBar(
                        percentage,
                    )}`,
                    inline: false,
                },
                {
                    name: 'Balance',
                    value: `:dollar: **Wallet:** :coin: ${memberData.wallet} (\`${formatNumber(
                        memberData.wallet,
                    )}\`)\n:bank: **Bank:** :coin: ${memberData.bank} / ${memberData.bankLimit} (\`${formatNumber(
                        memberData.bank,
                    )}/${formatNumber(memberData.bankLimit)}\`)\n:moneybag: **Net Worth:** :coin: ${
                        memberData.wallet + memberData.bank
                    } (\`${formatNumber(memberData.wallet + memberData.bank)}\`)\n:gem: **Inventory Worth:** \`${
                        inventory.items
                    } items\` valued at :coin: ${inventory.value}`,
                    inline: false,
                },
                {
                    name: 'Investment Portfolio',
                    value: `:dollar: **Worth:** :coin: ${
                        Math.round((investments.currentValue + Number.EPSILON) * 100) / 100
                    }\n:credit_card: **Amount:** ${
                        Math.round((investments.investments + Number.EPSILON) * 100) / 100
                    }x\n:moneybag: **Invested:** :coin: ${investments.buyPrice}`,
                    inline: false,
                },
                {
                    name: 'Misc',
                    value: `:briefcase: **Current Job:** ${workJob}\n:office: **Business:** ${businessJob}\n:sparkles: **Daily Streak:** ${
                        memberData.streak - 1 > 0 ? memberData.streak - 1 : 0
                    } days\n:seedling: **Farm:** ${memberData.plots.length} plots\n:evergreen_tree: **Tree Height:** ${
                        memberData.tree.height ?? 0
                    }ft (${feetToMeters(memberData.tree.height)}m)`,
                    inline: false,
                },
                {
                    name: 'Badges (Achievements)',
                    value: `${
                        memberData.badges.length <= 0
                            ? 'None'
                            : memberData.badges
                                  .map((id) => `<:${id}:${client.achievement.getById(id)?.emoji}>`)
                                  .join(' ')
                    }`,
                    inline: false,
                },
            ]);
        await interaction.editReply({ embeds: [embed] });

        if (user.id === interaction.user.id && (memberData.country === '' || memberData.birthday.getTime() === 0)) {
            await interaction.followUp({
                content: `Hey <@${interaction.user.id}>, you don't have a country or birthday set! Please set these using the \`/settings profile\` command.`,
                ephemeral: true,
            });
        }
    },
} satisfies Command;
