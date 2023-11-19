import StatusClient from "@/app/status/StatusClient";
import {Cluster} from "@/lib/interfaces";
import PageTitle from "@/components/PageTitle";

export default async function StatusPage() {
    const UPDATE_INTERVAL = 30;
    const response = await fetch("https://api.coinzbot.xyz/status", {next: {revalidate: 30}});
    const clusters = await response.json() as Cluster[];

    return (
        <>
            <PageTitle title="Status"
                       description={`Here, you'll find all the information you need to stay up to date with the status of our bot. This page is updated every ${UPDATE_INTERVAL} seconds.`}/>
            <StatusClient clusters={clusters} statusUrl={""} updateInterval={UPDATE_INTERVAL}/>
        </>
    );
}