import ItemsSection from './items-section';
import PageTitle from '@/components/page-title';
import { db } from '@/server/db';

export const revalidate = 86400;

export default async function ItemsPage() {
    const items = await db.item.findMany({});

    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Shop Items"
                description="You'll find a complete list of all the items available for purchase with your hard-earned money."
            />
            <ItemsSection items={items} />
        </main>
    );
}
