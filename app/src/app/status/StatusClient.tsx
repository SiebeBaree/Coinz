'use client';

import { Cluster, Shard } from '@/lib/interfaces';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export default function StatusClient({
    initialData,
    initialDataUpdatedAt,
    statusUrl,
    interval,
}: {
    initialData: Cluster[];
    initialDataUpdatedAt: number;
    statusUrl: string;
    interval: number;
}) {
    async function fetchStatus() {
        const res = await fetch(statusUrl);
        if (!res.ok) {
            throw new Error('Could not fetch status');
        }

        return res.json();
    }

    const clusters = useQuery({
        queryKey: ['status'],
        queryFn: fetchStatus,
        initialData: initialData,
        initialDataUpdatedAt: initialDataUpdatedAt,
        refetchInterval: interval * 1000,
    });

    return (
        <div>
            {clusters.error ? (
                <div className="text-center my-24">
                    <h2 className="text-xl font-semibold">
                        Could not retrieve the status of Coinz, please refresh this page to try again.
                    </h2>
                    <h3 className="text-muted">
                        If this issue keeps happening, please{' '}
                        <Link href={'/support'} target="_blank" className="underline">
                            contact us.
                        </Link>
                    </h3>
                </div>
            ) : (
                <div
                    className="grid gap-3"
                    style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    }}
                >
                    {clusters.data.map((cluster: Cluster) => (
                        <ClusterCard key={`Cluster#${cluster.id}`} cluster={cluster} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ClusterCard({ cluster }: { cluster: Cluster }) {
    const averagePing = Math.round(
        cluster.shards.reduce((acc: number, shard: Shard) => acc + (shard.ping >= 0 ? shard.ping : 0), 0) /
            cluster.shards.filter((shard: Shard) => shard.ping >= 0).length || -1,
    );
    const totalGuilds = cluster.shards.reduce((total: number, shard: Shard) => total + shard.guildcount, 0);

    return (
        <div className="bg-secondary rounded-md p-4">
            <div className="flex justify-between gap-3 mb-8">
                <h2 className="text-2xl font-semibold">Cluster {cluster.id}</h2>

                <div className="flex flex-wrap justify-end gap-1">
                    <Badge variant="secondary" className="bg-background">
                        {averagePing}ms Ping
                    </Badge>
                    <Badge variant="secondary" className="bg-background">
                        {totalGuilds} Guilds
                    </Badge>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center items-center">
                {cluster.shards.map((shard: Shard) => (
                    <ShardCard key={`Shard#${shard.id}`} shard={shard} />
                ))}
            </div>
        </div>
    );
}

function ShardCard({ shard }: { shard: Shard }) {
    const status = shard.ping === -1 ? 'offline' : shard.ping > 300 ? 'slow' : 'online';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    className={cn(
                        status === 'offline' ? 'bg-red-700' : status === 'slow' ? 'bg-yellow-600' : 'bg-green-600',
                        'text-lg font-medium w-12 h-12 flex justify-center items-center rounded-md',
                    )}
                >
                    #{shard.id}
                </TooltipTrigger>
                <TooltipContent className="bg-background">
                    <div className="flex flex-col gap-2">
                        <p className="font-semibold text-lg text-center">{status.toUpperCase()}</p>
                        {shard.ping >= 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <Badge variant="secondary">{shard.ping}ms</Badge>
                                <Badge variant="secondary">{shard.guildcount} Guilds</Badge>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
