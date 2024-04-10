import StatusClient from '@/app/(main)/status/StatusClient';
import { Cluster } from '@/lib/interfaces';
import PageTitle from '@/components/PageTitle';

const STATUS_URL = 'https://api.coinzbot.xyz/status';

export default async function StatusPage() {
    const UPDATE_INTERVAL = 30;
    const initialDataUpdatedAt = Date.now();
    const response = await fetch(STATUS_URL, {
        next: { revalidate: UPDATE_INTERVAL },
    });
    const clusters = (await response.json()) as Cluster[];

    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Status"
                description={`Here, you'll find all the information you need to stay up to date with the status of our bot. This page is updated every ${UPDATE_INTERVAL} seconds.`}
            />
            <StatusClient
                initialData={clusters}
                initialDataUpdatedAt={initialDataUpdatedAt}
                statusUrl={STATUS_URL}
                interval={UPDATE_INTERVAL}
            />
        </main>
    );
}
