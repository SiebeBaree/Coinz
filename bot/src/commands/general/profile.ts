import type { ColorResolvable } from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';
import type { InventoryItem } from '../../lib/types';
import Business from '../../models/business';
import type { IMember } from '../../models/member';
import { feetToMeters, formatNumber, getCountryEmote, getCountryName, getExperience, getLevel } from '../../utils';

function createProgressBar(xp: number): string {
    return `TODO-${xp}`;
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
    },
    async execute(client, interaction, member) {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const memberData = interaction.user.id === user.id ? member : await getMember(user.id);

        const inventory = getInventoryValue(client, memberData.inventory);
        const investments = await getInvestmentsValue(client, memberData.investments);
        const displayedBadge = client.achievement.getById(memberData.displayedBadge);
        const level = getLevel(memberData.experience);
        const xpUntilNextLevel = getExperience(level + 1) - memberData.experience;
        const workJob = member.job === '' ? 'Unemployed' : member.job;

        const business = await Business.findOne({ id: memberData.id });
        const businessJob = business ? business.name : 'None';

        let description = '';
        description +=
            member.birthday.getTime() > 0
                ? `**Age:** ${getAge(member.birthday)} years old (Born on <t:${member.birthday.getTime() / 1_000}:D>)`
                : '';
        description += member.country
            ? `\n**Country:** ${getCountryName(member.country)} ${getCountryEmote(member.country)}`
            : '';

        const embed = new EmbedBuilder()
            .setTitle(
                `${user.username}'s Profile${displayedBadge ? ` <:${displayedBadge.id}:${displayedBadge.emoji}>` : ''}`,
            )
            .setThumbnail(user.displayAvatarURL())
            .setColor((member.profileColor || client.config.embed.color) as ColorResolvable)
            .setDescription(description.length > 0 ? description : null)
            .addFields([
                {
                    name: 'Experience',
                    value: `:beginner: **Level:** \`${level}\`\n:game_die: **Next Level:** \`TODO%\`\n${createProgressBar(
                        xpUntilNextLevel,
                    )}`,
                    inline: false,
                },
                {
                    name: 'Balance',
                    value: `:dollar: **Wallet:** :coin: ${member.wallet} (\`${formatNumber(
                        member.wallet,
                    )}\`)\n:bank: **Bank:** :coin: ${member.bank} / ${member.bankLimit} (\`${formatNumber(
                        member.bank,
                    )}/${formatNumber(member.bankLimit)}\`)\n:moneybag: **Net Worth:** :coin: ${
                        member.wallet + member.bank
                    } (\`${formatNumber(member.wallet + member.bank)}\`)\n:gem: **Inventory Worth:** \`${
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
                        member.streak - 1 > 0 ? member.streak - 1 : 0
                    } days\n:seedling: **Farm:** ${member.plots.length} plots\n:evergreen_tree: **Tree Height:** ${
                        member.tree.height ?? 0
                    }ft (${feetToMeters(member.tree.height)}m)`,
                    inline: false,
                },
                {
                    name: 'Badges (Achievements)',
                    value: `${
                        member.badges.length <= 0
                            ? 'None'
                            : member.badges.map((id) => `<:${id}:${client.achievement.getById(id)?.emoji}>`).join(' ')
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
