import type { ChatInputCommandInteraction } from 'discord.js';
import type { IMember } from '../models/Member';
import Member from '../models/Member';
import type { IUserStats } from '../models/UserStats';
import { getLevel } from '../utils';
import { getMember, getUserStats } from './database';

export type IAchievement = {
    id: string;
    name: string;
    description: string;
    emoji: string;
    hasAchieved(member: IMember, userStats: IUserStats): boolean;
    progress(member: IMember, userStats: IUserStats): string;
};

const achievements: IAchievement[] = [
    {
        id: 'hard_work',
        name: 'Work Hard, Become Rich',
        description: 'Complete your work 150 times.',
        emoji: '1013717949309272104',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.timesWorked >= 150,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.timesWorked ?? 0}/150`,
    },
    {
        id: 'farmers_life',
        name: "Farmer's Life",
        description: 'Buy at least 9 plots for your farm.',
        emoji: '1060197317908639807',
        hasAchieved: (member: IMember) => member.plots.length >= 9,
        progress: (member: IMember) => `${member.plots.length ?? 0}/9`,
    },
    {
        id: 'warren_buffett',
        name: 'The New Warren Buffett',
        description: 'Invest 75k or more.',
        emoji: '1013717955734941737',
        hasAchieved: (member: IMember) => member.investments.reduce((acc, stock) => acc + stock.buyPrice, 0) >= 75_000,
        progress: (member: IMember) =>
            `${member.investments.reduce((acc, stock) => acc + stock.buyPrice, 0) ?? 0}/75,000`,
    },
    {
        id: 'local_fish_dealer',
        name: 'Local Fish Dealer',
        description: 'Catch 100 fish.',
        emoji: '1013717951851003934',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.fishCaught >= 100,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.fishCaught ?? 0}/100`,
    },
    {
        id: 'animal_hunter',
        name: 'Animal Hunter',
        description: 'Kill 100 animals.',
        emoji: '1159174580410257458',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.animalsKilled >= 100,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.animalsKilled ?? 0}/100`,
    },
    {
        id: 'keep_on_grinding',
        name: 'Keep on Grinding',
        description: 'Get a daily streak of 50.',
        emoji: '1013717950685007902',
        hasAchieved: (member: IMember) => member.streak >= 50,
        progress: (member: IMember) => `${member.streak ?? 0}/50`,
    },
    {
        id: 'coinz_addiction',
        name: 'Coinz Addiction',
        description: 'Get a daily streak of 365.',
        emoji: '1159174571501559869',
        hasAchieved: (member: IMember) => member.streak >= 365,
        progress: (member: IMember) => `${member.streak ?? 0}/365`,
    },
    {
        id: 'feeling_lucky',
        name: 'Feeling Lucky',
        description: 'Spin the lucky wheel 100 times.',
        emoji: '1013717944972349472',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.luckyWheelSpins >= 100,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.luckyWheelSpins ?? 0}/100`,
    },
    {
        id: 'collection',
        name: 'A Small Collection',
        description: 'Have more than 1,000 items in your inventory.',
        emoji: '1013717941398798396',
        hasAchieved: (member: IMember) => member.inventory.reduce((acc, item) => acc + item.amount, 0) >= 1_000,
        progress: (member: IMember) => `${member.inventory.reduce((acc, item) => acc + item.amount, 0) ?? 0}/1,000`,
    },
    {
        id: 'large_tree',
        name: "That's a really large tree",
        description: 'Grow a tree 100 feet tall.',
        emoji: '1070020720375103571',
        hasAchieved: (member: IMember) => member.tree.height >= 100,
        progress: (member: IMember) => `${member.tree.height ?? 0}/100`,
    },
    {
        id: 'touch_grass',
        name: 'Go touch some grass',
        description: 'Execute 1,000 commands.',
        emoji: '1013717954459873310',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.dailyActivity.totalCommands >= 1_000,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.dailyActivity.totalCommands ?? 0}/1,000`,
    },
    {
        id: 'no_life',
        name: 'No Life',
        description: 'Execute 10,000 commands.',
        emoji: '1159174567345016933',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.dailyActivity.totalCommands >= 10_000,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.dailyActivity.totalCommands ?? 0}/10,000`,
    },
    {
        id: 'the_final_boss',
        name: 'The Final Boss',
        description: 'Reach level 100.',
        emoji: '1159174560642514945',
        hasAchieved: (member: IMember) => getLevel(member.experience) >= 100,
        progress: (member: IMember) => `${getLevel(member.experience) ?? 0}/100`,
    },
    {
        id: 'cast_your_vote',
        name: 'Cast Your Vote',
        description: 'Vote 100 times.',
        emoji: '1159174572826968087',
        hasAchieved: (member: IMember) => member.votes >= 100,
        progress: (member: IMember) => `${member.votes ?? 0}/100`,
    },
    {
        id: 'lumberjack',
        name: 'Lumberjack',
        description: 'Cut down 50 trees.',
        emoji: '1159174565877010462',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.treesCutDown >= 50,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.treesCutDown ?? 0}/50`,
    },
    {
        id: 'bad_luck',
        name: 'Bad Luck',
        description: 'Lose 100 games.',
        emoji: '1159174642167197756',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.games.lost >= 100,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.games.lost ?? 0}/100`,
    },
    {
        id: 'lucky_you',
        name: 'Lucky You',
        description: 'Win 100 games.',
        emoji: '1159174563360415854',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.games.won >= 100,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.games.won ?? 0}/100`,
    },
    {
        id: 'almost_won',
        name: 'Almost won',
        description: 'Tie 50 games.',
        emoji: '1159174577503617094',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.games.tied >= 50,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.games.tied ?? 0}/50`,
    },
    {
        id: 'big_gambler',
        name: 'Big Gambler',
        description: 'Spend :coin: 100,000 or more on gambling.',
        emoji: '1159174582486454313',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.games.moneySpent >= 100_000,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.games.moneySpent ?? 0}/100,000`,
    },
    {
        id: 'a_real_farmer',
        name: 'A Real Farmer',
        description: 'Harvest 100 plots on your farm.',
        emoji: '1159174575360311356',
        hasAchieved: (_: IMember, userStats: IUserStats) => userStats.timesPlotHarvested >= 100,
        progress: (_: IMember, userStats: IUserStats) => `${userStats.timesPlotHarvested ?? 0}/100`,
    },
];

export default class Achievement {
    private readonly _achievements = new Map<string, IAchievement>(achievements.map((a) => [a.id, a]));

    public constructor() {
        this._achievements = new Map<string, IAchievement>(achievements.map((a) => [a.id, a]));
    }

    public get all(): Map<string, IAchievement> {
        return this._achievements;
    }

    public getById(id: string): IAchievement | null {
        return this._achievements.get(id) ?? null;
    }

    public getByName(name: string): IAchievement | null {
        return Array.from(this._achievements.values()).find((a) => a.name.toLowerCase() === name.toLowerCase()) ?? null;
    }

    public hasAchievement(id: string, member: IMember, userStats: IUserStats): boolean {
        return this._achievements.get(id)?.hasAchieved(member, userStats) ?? false;
    }

    public getProgress(id: string, member: IMember, userStats: IUserStats): string {
        return this._achievements.get(id)?.progress(member, userStats) ?? '';
    }

    public async sendAchievementMessage(
        interaction: ChatInputCommandInteraction,
        memberId: string,
        achievement: IAchievement | null,
        force = false,
    ): Promise<void> {
        if (!achievement) return;

        const member = await getMember(memberId);
        const userStats = await getUserStats(memberId);
        if (member.badges.includes(achievement.id)) return;
        if (!force && !this.hasAchievement(achievement.id, member, userStats)) return;

        await interaction.followUp({
            content: `:tada: You've unlocked the <:${achievement.id}:${achievement.emoji}> **${achievement.name}** achievement!`,
        });
        await Member.updateOne({ id: memberId }, { $push: { badges: achievement.id } });
    }
}
