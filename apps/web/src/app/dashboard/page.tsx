import { getServerAuthSession } from '@/server/auth';
import { db } from '@/server/db';
import {
    BadgeCentIcon,
    BanknoteIcon,
    BriefcaseIcon,
    Building2Icon,
    CloverIcon,
    DropletsIcon,
    FishSymbolIcon,
    Gamepad2Icon,
    GemIcon,
    HandCoinsIcon,
    HandshakeIcon,
    LucideIcon,
    PiggyBankIcon,
    RabbitIcon,
    ShoppingCartIcon,
    SparklesIcon,
    TerminalIcon,
    TractorIcon,
    TreePineIcon,
    TreesIcon,
    VoteIcon,
    WheatIcon,
} from 'lucide-react';

type Statistic = { title: string; value: number | null; Icon: LucideIcon; Prefix?: LucideIcon };

const stats = {
    totalEarned: {
        title: 'Total Earned',
        value: null,
        Icon: PiggyBankIcon,
        Prefix: BadgeCentIcon,
    },
    totalSpend: {
        title: 'Total Spend',
        value: null,
        Icon: BanknoteIcon,
        Prefix: BadgeCentIcon,
    },
    itemsBought: {
        title: 'Items Bought',
        value: null,
        Icon: ShoppingCartIcon,
    },
    itemsSold: {
        title: 'Items Sold',
        value: null,
        Icon: ShoppingCartIcon,
    },
    gamesWon: {
        title: 'Games Won',
        value: null,
        Icon: Gamepad2Icon,
    },
    gamesLost: {
        title: 'Games Lost',
        value: null,
        Icon: Gamepad2Icon,
    },
    gamesTied: {
        title: 'Games Tied',
        value: null,
        Icon: Gamepad2Icon,
    },
    gamesMoneyEarned: {
        title: 'Money Earned From Games',
        value: null,
        Icon: Gamepad2Icon,
        Prefix: BadgeCentIcon,
    },
    gamesMoneyLost: {
        title: 'Money Lost From Games',
        value: null,
        Icon: Gamepad2Icon,
        Prefix: BadgeCentIcon,
    },
    treesCutDown: {
        title: 'Trees Cut Down',
        value: null,
        Icon: TreesIcon,
    },
    totalTreeHeight: {
        title: 'Total Tree Height',
        value: null,
        Icon: TreePineIcon,
    },
    luckyWheelSpins: {
        title: 'Lucky Wheel Spins',
        value: null,
        Icon: CloverIcon,
    },
    timesWorked: {
        title: 'Times Worked',
        value: null,
        Icon: BriefcaseIcon,
    },
    fishCaught: {
        title: 'Fish Caught',
        value: null,
        Icon: FishSymbolIcon,
    },
    animalsKilled: {
        title: 'Animals Killed',
        value: null,
        Icon: RabbitIcon,
    },
    timesRobbed: {
        title: 'Times Robbed',
        value: null,
        Icon: GemIcon,
    },
    timesPlotPlanted: {
        title: 'Times Plot Planted',
        value: null,
        Icon: TractorIcon,
    },
    timesPlotHarvested: {
        title: 'Times Plot Harvested',
        value: null,
        Icon: WheatIcon,
    },
    timesPlotWatered: {
        title: 'Times Plot Watered',
        value: null,
        Icon: DropletsIcon,
    },
    timesPlotFertilized: {
        title: 'Times Plot Fertilized',
        value: null,
        Icon: SparklesIcon,
    },
    moneyEarnedOnBusinesses: {
        title: 'Money Earned On Businesses',
        value: null,
        Icon: Building2Icon,
        Prefix: BadgeCentIcon,
    },
    dailyActivityTotalCommands: {
        title: 'Daily Activity Total Commands',
        value: null,
        Icon: TerminalIcon,
    },
    moneyDonated: {
        title: 'Money Donated',
        value: null,
        Icon: HandCoinsIcon,
        Prefix: BadgeCentIcon,
    },
    moneyReceived: {
        title: 'Money Received',
        value: null,
        Icon: HandshakeIcon,
        Prefix: BadgeCentIcon,
    },
    timesVoted: {
        title: 'Times Voted',
        value: null,
        Icon: VoteIcon,
    },
} as { [key: string]: Statistic };

export default async function DashboardPage() {
    const session = await getServerAuthSession();
    if (session === null) return null;

    const userStats = await db.userstats.findFirst({
        where: {
            id: session.user.discordId,
        },
    });

    const statsKeys = Object.keys(stats);
    const userStatsKeys = Object.keys(userStats === null ? {} : userStats) as (keyof typeof stats)[];
    for (const key of statsKeys) {
        // @ts-expect-error
        stats[key].value = userStatsKeys.includes(key) ? userStats[key] : 0;
    }

    return (
        <main>
            <div
                className="grid gap-3 w-full"
                style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                }}
            >
                {statsKeys.map((statKey, i) => (
                    <StatisticCard key={i} statistic={stats[statKey]!} />
                ))}
            </div>
        </main>
    );
}

function StatisticCard({ statistic }: { statistic: Statistic }) {
    if (statistic.value === null) statistic.value = 0;

    function getFormattedNumber(value: number): string {
        return Math.abs(value)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    return (
        <div className="bg-secondary rounded-md border-highlight flex items-center gap-4 p-2">
            <div className="bg-background rounded-md h-16 w-16 flex items-center justify-center">
                <statistic.Icon className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-grow">
                <div className="flex gap-2 items-center">
                    {statistic.Prefix && <statistic.Prefix className="h-5 w-5 text-primary" />}
                    <h2 className="font-semibold text-3xl">{getFormattedNumber(statistic.value)}</h2>
                </div>
                <p className="text-muted text-sm font-medium">{statistic.title}</p>
            </div>
        </div>
    );
}
