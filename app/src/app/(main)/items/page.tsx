import ItemsSection from '@/app/(main)/items/ItemsSection';
import PageTitle from '@/components/PageTitle';
import { db } from '@/server/db';

export const revalidate = '900';

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
