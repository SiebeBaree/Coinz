'use client';

import { useEffect, useState } from 'react';
import { Cluster, Shard } from '@/lib/interfaces';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function StatusClient({
    clusters,
    statusUrl,
    updateInterval,
}: {
    clusters: Cluster[];
    statusUrl: string;
    updateInterval: number;
}) {
    const [status, setStatus] = useState(clusters);
    const [tries, setTries] = useState(0);
    const [error, setError] = useState(clusters.length === 0);

    const updateData = setTimeout(async () => {
        const response = await fetch(statusUrl);
        if (!response.ok) {
            setError(true);
            return;
        }

        const data = await response.json();
        if (data.length === 0) {
            setError(true);
            return;
        }

        setStatus(data);
    }, updateInterval * 1000);

    useEffect(() => {
        if (error) {
            if (tries < 5) {
                setTries((prev) => prev + 1);
            } else {
                clearTimeout(updateData);
            }
        }
    }, [error, tries]);

    return (
        <div>
            {error && (
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
            )}
            {!error && (
                <div
                    className="grid gap-4"
                    style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    }}
                >
                    {status.map((cluster: Cluster) => (
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
            <div className="flex justify-between gap-4 mb-8">
                <h2 className="text-5xl font-bold">#{cluster.id}</h2>

                <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="bg-background">
                        {averagePing}ms Ping
                    </Badge>
                    <Badge variant="secondary" className="bg-background">
                        {totalGuilds} Guilds
                    </Badge>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center items-center">
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
                        'text-2xl font-medium w-16 h-16 flex justify-center items-center rounded-md',
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
