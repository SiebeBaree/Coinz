import ItemsSection from "@/app/items/ItemsSection";

export const dynamic = "force-static";
export const revalidate = "force-cache";

export default async function ItemsPage() {
    const response = await fetch(process.env.APP_URL! + "/api/items");
    const items = await response.json();

    return (
        <main className="container mx-auto px-5">
            <div className="page-title">
                <h2 className="watermark">Shop Items</h2>
                <h1>Shop Items</h1>
                <p>You&apos;ll find a complete list of all the items available for purchase with your hard-earned
                    money.</p>
            </div>

            <ItemsSection items={items}/>
        </main>
    );
}