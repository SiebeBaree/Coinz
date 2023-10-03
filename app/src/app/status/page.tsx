import StatusClient from "@/app/status/StatusClient";
import { Cluster } from "@/lib/interfaces";

export default async function StatusPage() {
    const UPDATE_INTERVAL = 30;
    const response = await fetch("https://api.coinzbot.xyz/status", { next: { revalidate: 30 } });
    const clusters = await response.json() as Cluster[];

    return (
        <main className="container mx-auto px-5">
            <div className="page-title">
                <h2 className="watermark">Status</h2>
                <h1>Status</h1>
                <p>Here, you&apos;ll find all the information you need to stay up to date with the status of our
                    bot. This page is updated every {UPDATE_INTERVAL} seconds.</p>
            </div>

            <StatusClient clusters={clusters} statusUrl={""} updateInterval={UPDATE_INTERVAL}/>
        </main>
    );
}