import ItemsSection from '@/app/items/ItemsSection';
import PageTitle from '@/components/PageTitle';

export const dynamic = 'force-static';
export const revalidate = 'force-cache';

export default async function ItemsPage() {
    const response = await fetch(process.env.NEXT_PUBLIC_BASE_URL! + '/api/items');
    const items = await response.json();

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
