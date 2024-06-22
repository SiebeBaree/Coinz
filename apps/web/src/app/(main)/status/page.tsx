import PageTitle from '@/components/page-title';
import { formatNumber } from '@/lib/utils';
import { db } from '@/server/db';

export const revalidate = 14400;

function getFormattedNumber(number: number) {
    const formatted = formatNumber(number);
    return `${formatted.value}${formatted.suffix}`;
}

export default async function StatusPage() {
    const botStats = await db.botStats.findFirst({
        orderBy: {
            updatedAt: 'desc',
        },
    });

    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Status"
                description={`Here, you'll find all the information you need to stay up to date with the status of our bot.`}
            />

            {botStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-between gap-x-4 gap-y-14 pt-12">
                    {botStats.clusters.map((cluster, index) => (
                        <div key={index} className="p-4 rounded-md bg-secondary relative">
                            <h2 className="text-2xl font-bold h-24 w-24 bg-secondary border-background border-[12px] rounded-full flex justify-center items-center absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                #{cluster.id + 1}
                            </h2>

                            <div className="h-16 flex justify-between">
                                <div className="text-center">
                                    <p className="font-semibold text-xs text-muted">Guilds</p>
                                    <p className="text-medium">{cluster.guilds}</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-xs text-muted">Users</p>
                                    <p className="text-medium">{getFormattedNumber(cluster.users)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center">
                                {Array.from({ length: cluster.totalShards }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-12 w-12 rounded-md bg-green-600 flex justify-center items-center"
                                    >
                                        <p className="font-medium text-lg">#{(cluster.id + 1) * (index + 1)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex justify-center my-20">
                    <p className="text-center text-red-500 text-2xl font-semibold">
                        Could not get the status of Coinz, please try again.
                    </p>
                </div>
            )}
        </main>
    );
}
