import PageTitle from '@/components/PageTitle';
import PremiumClient from '@/app/premium/PremiumClient';

export default function PremiumPage() {
    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Premium"
                description="Discover the exclusive benefits of Coinz Plus and Coinz Pro, our premium subscriptions for the Coinz Discord bot. Gain access to more features and priority support!"
            />

            <PremiumClient />
        </main>
    );
}
