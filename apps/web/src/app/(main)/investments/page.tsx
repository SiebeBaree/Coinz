import InvestmentsSection from './investments-section';
import { db } from '@/server/db';
import PageTitle from '@/components/page-title';

export default async function InvestmentsPage() {
    const investments = await db.investment.findMany({});

    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Investments"
                description="Get an overview of all investments in Coinz and their current value. Investments track real-time prices, this makes investing in Coinz a nice demo for real-life investing."
            />
            <InvestmentsSection investments={investments} />
        </main>
    );
}
