import { IMember } from "../models/Member";

export interface IAchievement {
    id: string;
    name: string;
    description: string;
    emoji: string;
    hasAchieved: (member: IMember) => boolean;
    progress: (member: IMember) => string;
}

const achievements: IAchievement[] = [
    {
        id: "hard_work",
        name: "Work Hard, Become Rich",
        description: "Complete your work 150 times.",
        emoji: "1013717949309272104",
        hasAchieved: (member: IMember) => member.stats.timesWorked >= 150,
        progress: (member: IMember) => `${member.stats.timesWorked ?? 0}/150`,
    },
    {
        id: "big_spender",
        name: "A True Coinz Supporter",
        description: "Buy Coinz Premium.",
        emoji: "1032670296538357800",
        hasAchieved: (member: IMember) => member.premium.active,
        progress: (member: IMember) => `${member.premium.active === true ? "1" : "0"}/1`,
    },
    {
        id: "going_places",
        name: "Going Places",
        description: "Create a company and have 7 employees.",
        emoji: "1013717946763329536",
        hasAchieved: () => false,
        progress: () => "",
    },
    {
        id: "bug_hunter",
        name: "Bug Hunter",
        description: "Help find bugs in Coinz.",
        emoji: "1013717940010496060",
        hasAchieved: () => false,
        progress: () => "",
    },
    {
        id: "farmers_life",
        name: "Farmer's Life",
        description: "Buy at least 9 plots for your farm.",
        emoji: "1060197317908639807",
        hasAchieved: (member: IMember) => member.plots.length >= 9,
        progress: (member: IMember) => `${member.plots.length ?? 0}/9`,
    },
    {
        id: "warren_buffett",
        name: "The New Warren Buffett",
        description: "Invest 75k or more.",
        emoji: "1013717955734941737",
        hasAchieved: (member: IMember) => member.stocks.reduce((acc, stock) => acc + stock.buyPrice, 0) >= 75000,
        progress: (member: IMember) => `${member.stocks.reduce((acc, stock) => acc + stock.buyPrice, 0) ?? 0}/75,000`,
    },
    {
        id: "touch_grass",
        name: "Go touch some grass",
        description: "Execute 1,000 commands or more.",
        emoji: "1013717954459873310",
        hasAchieved: (member: IMember) => member.stats.commandsExecuted >= 1000,
        progress: (member: IMember) => `${member.stats.commandsExecuted ?? 0}/1,000`,
    },
    {
        id: "local_fish_dealer",
        name: "Local Fish Dealer",
        description: "Catch 100 fish.",
        emoji: "1013717951851003934",
        hasAchieved: (member: IMember) => member.stats.fishCaught >= 100,
        progress: (member: IMember) => `${member.stats.fishCaught ?? 0}/100`,
    },
    {
        id: "keep_on_grinding",
        name: "Keep on Grinding",
        description: "Get a daily streak of 50.",
        emoji: "1013717950685007902",
        hasAchieved: (member: IMember) => member.streak >= 50,
        progress: (member: IMember) => `${member.streak ?? 0}/50`,
    },
    {
        id: "feeling_lucky",
        name: "Feeling Lucky",
        description: "Spin the lucky wheel 100 times.",
        emoji: "1013717944972349472",
        hasAchieved: (member: IMember) => member.stats.luckyWheelSpins >= 100,
        progress: (member: IMember) => `${member.stats.luckyWheelSpins ?? 0}/100`,
    },
    {
        id: "easy_blackjack",
        name: "Easy Blackjack!",
        description: "Reach 21 in blackjack as soon as the dealer deals the cards.",
        emoji: "1013717942594175007",
        hasAchieved: () => false,
        progress: () => "",
    },
    {
        id: "collection",
        name: "A Small Collection",
        description: "Have more than 1,000 items in your inventory.",
        emoji: "1013717941398798396",
        hasAchieved: (member: IMember) => member.inventory.reduce((acc, item) => acc + item.amount, 0) >= 1000,
        progress: (member: IMember) => `${member.inventory.reduce((acc, item) => acc + item.amount, 0) ?? 0}/1,000`,
    },
    {
        id: "large_tree",
        name: "That's a really large tree",
        description: "Grow a tree 100 feet tall.",
        emoji: "1070020720375103571",
        hasAchieved: (member: IMember) => member.tree.height >= 100,
        progress: (member: IMember) => `${member.tree.height ?? 0}/100`,
    },
];

export default class Achievement {
    private static readonly _achievements = new Map<string, IAchievement>(achievements.map((a) => [a.id, a]));

    static get all(): Map<string, IAchievement> {
        return this._achievements;
    }

    static getById(id: string): IAchievement | null {
        return this._achievements.get(id) ?? null;
    }

    static getByName(name: string): IAchievement | null {
        return Array.from(this._achievements.values()).find((a) => a.name.toLowerCase() === name.toLowerCase()) ?? null;
    }

    static hasAchievement(id: string, member: IMember): boolean {
        return this._achievements.get(id)?.hasAchieved(member) ?? false;
    }

    static getProgress(id: string, member: IMember): string {
        return this._achievements.get(id)?.progress(member) ?? "";
    }
}