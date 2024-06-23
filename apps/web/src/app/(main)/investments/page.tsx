import InvestmentsSection from './investments-section';
import { db } from '@/server/db';
import PageTitle from '@/components/page-title';
import { auth } from '@/server/auth';
import { InvestmentData } from '@prisma/client';

export default async function InvestmentsPage() {
    const investments = await db.investment.findMany({});
    const session = await auth();

    let data: InvestmentData[] = [];
    let hasPremium = false;
    if (session) {
        const member = await db.members.findFirst({
            where: {
                userId: session.user.discordId,
            },
        });

        if (member) {
            data = member.investments;
            hasPremium = member.premium >= 2;
        }
    }

    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Investments"
                description="Get an overview of all investments in Coinz and their current value. Investments track real-time prices, this makes investing in Coinz a nice demo for real-life investing."
            />
            <InvestmentsSection
                investments={investments}
                data={data}
                userId={session?.user.discordId}
                hasPremium={hasPremium}
            />
        </main>
    );
}
