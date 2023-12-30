import { getServerAuthSession } from '@/server/auth';
import { redirect } from 'next/navigation';
import { FishSymbolIcon, Gamepad2Icon, LucideIcon, TerminalIcon, VoteIcon } from 'lucide-react';

const stats = [
    {
        title: 'Commands Used',
        value: '2.320',
        Icon: TerminalIcon,
    },
    {
        title: 'Times Voted',
        value: '178',
        Icon: VoteIcon,
    },
    {
        title: 'Games Won',
        value: '239',
        Icon: Gamepad2Icon,
    },
    {
        title: 'Fish Caught',
        value: '487',
        Icon: FishSymbolIcon,
    },
];

export default async function DashboardPage() {
    const session = await getServerAuthSession();
    if (session === null) return redirect('/login?url=/dashboard');

    return (
        <main>
            <div
                className="grid gap-3 w-full"
                style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                }}
            >
                {stats.map((stat, i) => (
                    <StatisticCard key={i} title={stat.title} value={stat.value} Icon={stat.Icon} />
                ))}
            </div>
        </main>
    );
}

function StatisticCard({ title, value, Icon }: { title: string; value: string; Icon: LucideIcon }) {
    return (
        <div className="bg-secondary rounded-md border-highlight flex items-center gap-4 p-2">
            <div className="bg-background rounded-md h-16 w-16 flex items-center justify-center">
                <Icon className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-grow">
                <h2 className="font-semibold text-3xl">{value}</h2>
                <p className="text-muted text-sm font-medium">{title}</p>
            </div>
        </div>
    );
}
