import PageTitle from '@/components/page-title';
import { BotIcon, GlobeIcon, LucideIcon, TriangleAlertIcon } from 'lucide-react';

export const dynamic = 'force-static';

type Roadmap = {
    version: string;
    plannedRelease?: string;
    note?: string;
    topics: {
        name: string;
        icon: LucideIcon;
        features: string[];
    }[];
};

const roadmap: Roadmap[] = [
    {
        version: 'v4.1',
        topics: [
            {
                name: 'Bot',
                icon: BotIcon,
                features: [
                    'Add option to upgrade bank limit back.',
                    'Add minimum work requirement.',
                    'Add /slots command.',
                    "Add notifications for when it's time to vote again or when you get robbed.",
                    'Add a business leaderboard of the top 50 businesses in certain categories.',
                    'Let Coinz Pro users invest up to 🪙 5.000 per day in their business',
                ],
            },
            {
                name: 'Website',
                icon: GlobeIcon,
                features: ['Add status page back', 'Fix dashboard page.', 'Add new guides.'],
            },
        ],
    },
    {
        version: 'v4.2',
        topics: [
            {
                name: 'Bot',
                icon: BotIcon,
                features: [
                    'Add /connect4 command.',
                    "Add market history command for business to see their market's history.",
                    'Add sorting options to /market list command.',
                    'Add 10 more stocks',
                ],
            },
            {
                name: 'Website',
                icon: GlobeIcon,
                features: ['Add option to buy and sell items from the website.'],
            },
        ],
    },
    {
        version: 'v5.0',
        note: "This version can still change a lot, don't take it as a final version.",
        topics: [
            {
                name: 'Bot',
                icon: BotIcon,
                features: ['Add multiple languages support.'],
            },
        ],
    },
];

export default function RoadmapPage() {
    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Roadmap"
                description="We're working hard to bring you the best possible experience. Here's what's coming up next."
            />

            <div className="flex flex-col gap-6">
                {roadmap.map((release) => (
                    <section key={release.version} className="flex justify-between gap-8">
                        <div className="text-xl font-semibold rounded-full border-highlight bg-secondary h-20 w-20 hidden sm:grid place-items-center min-h-20 min-w-20">
                            {release.version}
                        </div>
                        <div className="flex-grow bg-secondary rounded-md p-4 flex flex-col gap-4">
                            <h2 className="text-xl font-semibold block sm:hidden">{release.version}</h2>
                            {release.note && (
                                <div className="flex gap-4 items-center">
                                    <div className="bg-orange-500/20 p-3 rounded-md">
                                        <TriangleAlertIcon size={20} className="text-orange-500" />
                                    </div>
                                    <p>
                                        <strong>Note:</strong> {release.note}
                                    </p>
                                </div>
                            )}
                            <div className="flex flex-col gap-8">
                                {release.topics.map((topic) => (
                                    <div key={topic.name}>
                                        <div className="flex items-stretch gap-2">
                                            <div className="bg-primary p-1.5 rounded-md">
                                                <topic.icon size={22} className="text-primary-foreground" />
                                            </div>
                                            <p className="bg-background py-1 px-4 rounded-md font-semibold flex items-center">
                                                {topic.name}
                                            </p>
                                        </div>

                                        <ul className="mt-3 list-disc list-inside">
                                            {topic.features.map((feature) => (
                                                <li key={feature}>{feature}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
}
