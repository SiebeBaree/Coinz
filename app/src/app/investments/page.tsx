import InvestmentsSection from "@/app/investments/InvestmentsSection";
import { prisma } from "@/lib/prisma";

export const revalidate = 180;

export default async function InvestmentsPage() {
    const investments = await prisma.investment.findMany({});

    return (
        <main className="container mx-auto px-5">
            <div className="page-title">
                <h2 className="watermark">Investments</h2>
                <h1>Investments</h1>
                <p>You&apos;ll find a comprehensive list of all the available commands for Coinz. We&apos;ve
                    compiled this list to help you quickly and easily access the commands in Coinz effectively.</p>
            </div>

            <InvestmentsSection data={investments}/>
        </main>
    );
}