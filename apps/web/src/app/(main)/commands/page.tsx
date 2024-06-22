import CommandSection from './command-section';
import PageTitle from '@/components/page-title';
import SectionWrapper from '@/components/section-wrapper';
import { db } from '@/server/db';

export const revalidate = 86400;

export default async function CommandsPage() {
    const commands = await db.commands.findMany({});

    return (
        <SectionWrapper>
            <PageTitle
                title="Commands"
                description="You'll find a comprehensive list of all the available commands for Coinz. We've compiled this list to help you quickly and easily access the commands in Coinz effectively."
            />

            <CommandSection commands={commands} />
        </SectionWrapper>
    );
}
