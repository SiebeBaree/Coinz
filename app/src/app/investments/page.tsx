import InvestmentsSection from "@/app/investments/InvestmentsSection";
import {db} from "@/server/db";
import PageTitle from "@/components/PageTitle";

export const revalidate = 60;

export default async function InvestmentsPage() {
    const investments = await db.investment.findMany({});

    return (
        <>
            <PageTitle title="Investments"
                       description="You'll find a comprehensive list of all the available commands for Coinz. We've compiled this list to help you quickly and easily access the commands in Coinz effectively."/>
            <InvestmentsSection data={investments}/>
        </>
    );
}