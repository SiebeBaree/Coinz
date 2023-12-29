import PageTitle from '../../../components/PageTitle';
import PremiumClient from './PremiumClient';
import { getServerAuthSession } from '@/server/auth';
import { redirect } from 'next/navigation';

export default async function PremiumPage() {
    const session = await getServerAuthSession();
    if (!session) redirect('/login?url=/premium');

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
