import premium from "@/lib/data/premium.json";
import {Check} from "lucide-react";
import Image from "next/image";
import PageTitle from "@/components/PageTitle";

interface Subscription {
    name: string;
    price: {
        month: number;
        quarter: number;
        year: number;
    },
    logo: string;
    perks: string[];
}

export default function PremiumPage() {
    return (
        <>
            <PageTitle title="Premium"
                       description="Here, you'll find all the information you need to stay up to date with the status of our bot. We've provided detailed information for every cluster and shard of Coinz, so you can quickly and easily see if everything is running smoothly."/>

            <div className="grid gap-4 mb-12" style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            }}>
                {Object.keys(premium).map((key: string) => (
                    <SubscriptionCard key={key} subscription={premium[key]}/>
                ))}
            </div>
        </>
    );
}

function SubscriptionCard({subscription}: {
    subscription: Subscription;
}) {
    return (
        <div className="flex flex-col items-center bg-secondary rounded-md px-8 mt-12">
            <Image src={subscription.logo} alt={`${subscription.name} logo`} width={120} height={120}
                   className="select-none absolute -top-[60px] border-[10px] rounded-full border-background"/>
            <h2 className="text-4xl font-bold mt-20">{subscription.name}</h2>
            <h3 className="text-4xl text-primary font-bold my-6">${subscription.price.month / 100} <span
                className="text-muted text-base">/Month</span></h3>

            <div className="flex flex-col items-start gap-2 mb-8 w-full">
                {subscription.perks.map((perk: string, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                        <Check className="text-primary h-5"/>
                        <p key={perk} className="">{perk}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}