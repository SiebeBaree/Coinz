import PageTitle from '@/components/PageTitle';
import PremiumClient from '@/app/premium/PremiumClient';

export default function PremiumPage() {
    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Premium"
                description="Here, you'll find all the information you need to stay up to date with the status of our bot. We've provided detailed information for every cluster and shard of Coinz, so you can quickly and easily see if everything is running smoothly."
            />

            <PremiumClient/>
        </main>
    );
}