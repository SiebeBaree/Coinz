import type { ColorResolvable } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import type { IMember } from '../../models/member';
import Member from '../../models/member';
import { getVotingRow } from '../../utils';
import { addExperience } from '../../utils/money';

type Settings = {
    defaultReward: number;
    maxDays: number;
    dailyStreakMoney: number;
};

const parameters = {
    free: {
        defaultReward: 10,
        maxDays: 50,
        dailyStreakMoney: 3,
    },
    premium: {
        defaultReward: 20,
        maxDays: 60,
        dailyStreakMoney: 5,
    },
};

function daysSinceLastStreak(previousStreak: Date): number {
    if (previousStreak.getFullYear() === 1970) return 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    previousStreak.setHours(0, 0, 0, 0);

    const differenceInMilliseconds = today.getTime() - previousStreak.getTime();
    return Math.floor(differenceInMilliseconds / (1000 * 3600 * 24));
}

function calculateReward(settings: Settings, days: number) {
    days = days > settings.maxDays ? settings.maxDays : days;
    return settings.defaultReward + days * settings.dailyStreakMoney;
}

function getEmbed(
    client: Bot,
    member: IMember,
    xp: number,
    streakReward: number,
    settings: Settings,
    premium: number,
    msg = '',
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            `:moneybag: **You claimed your daily reward!**${member.premium >= 2 ? '\n:four_leaf_clover: **You also gained an extra lucky wheel spin!**' : ''}${msg}\n\n**Daily Reward:** :coin: ${settings.defaultReward}\n**Daily Streak:** :coin: ${
                streakReward - settings.defaultReward
            } for a \`${member.streak + 1} ${
                member.streak + 1 === 1 ? 'day' : 'days'
            }\` streak\n**Total:** :coin: ${streakReward}\n**Gained XP:** \`${xp} XP\``,
        );

    if (premium === 0) {
        const premiumReward = calculateReward(parameters.premium, member.streak);
        embed.addFields([
            {
                name: 'Upgrade to Coinz Plus or Pro',
                value: `:star: **Coinz Plus rewards:** :coin: ${premiumReward}\n:crown: **Coinz Pro rewards:** :coin: ${premiumReward}, ${xp * 2} XP, and an extra lucky wheel spin!\n:money_with_wings: Consider [**upgrading**](<${client.config.website}/premium>) to get more rewards!`,
                inline: false,
            },
        ]);
    }

    return embed;
}

export default {
    data: {
        name: 'daily',
        description: 'Claim your daily reward, with streaks you can earn more!',
        category: 'general',
    },
    async execute(client, interaction, member) {
        const daysPast = daysSinceLastStreak(member.lastStreak);

        let msg = '';
        if (daysPast < 1) {
            await interaction.reply({
                content: 'You already claimed your daily reward today!',
                ephemeral: true,
            });
            return;
        } else if (daysPast === 2) {
            msg = '\n:bangbang: **You missed a day, but you still got your daily reward!**';
        } else if (daysPast === 3) {
            msg = '\n:bangbang: **You missed 2 days, your streak has been lowered with 25%**';
            member.streak = Math.floor(member.streak * 0.75) - 1;
        } else if (daysPast === 4) {
            msg = '\n:bangbang: **You missed 3 days, your streak has been cut in half!**';
            member.streak = Math.floor(member.streak * 0.5) - 1;
        } else if (daysPast >= 5) {
            member.streak = 0;
            msg = '\n:bangbang: **Your daily streak has been reset! But you still got your daily reward!**';
        }

        const settings = member.premium >= 1 ? parameters.premium : parameters.free;
        const secondsUntilEndOfTheDay = 86400 - (Math.floor(Date.now() / 1000) % 86400);
        await client.cooldown.setCooldown(interaction.user.id, this.data.name, secondsUntilEndOfTheDay);

        const streakReward = calculateReward(settings, member.streak);
        const xp = member.streak > 50 ? 25 : Math.floor(member.streak / 2);

        await interaction.reply({
            embeds: [getEmbed(client, member, xp, streakReward, settings, member.premium, msg)],
            components: [getVotingRow()],
        });

        await Member.updateOne(
            { id: interaction.user.id },
            {
                $inc: { wallet: streakReward, spins: member.premium >= 2 ? 1 : 0 },
                $set: { lastStreak: new Date(), streak: member.streak + 1 },
            },
        );

        if (xp > 0) await addExperience(member, xp);
        await client.achievement.sendAchievementMessage(
            interaction,
            interaction.user.id,
            client.achievement.getById('keep_on_grinding'),
        );
    },
} satisfies Command;
