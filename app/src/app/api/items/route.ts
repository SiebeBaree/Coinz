import { NextRequest, NextResponse } from 'next/server';
import itemsList from '@/lib/data/items.json';
import { Item } from '@/lib/interfaces';

const shop = new Map(itemsList.map((i: Item) => [i.itemId, i]));

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const category = searchParams.get('category');

    if (id) {
        const item = getItemById(id);
        if (!item) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json(item);
    } else if (name) {
        const item = getItemByName(name);
        if (!item) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json(item);
    } else if (category) {
        const items = getItemsByCategory(category);
        if (!items) {
            return NextResponse.json({ message: `No items found in ${category}` }, { status: 404 });
        }
        return NextResponse.json(items);
    }

    return NextResponse.json(Array.from(shop.values()));
}

function getItemById(id: string) {
    return shop.get(id) ?? null;
}

function getItemByName(name: string) {
    return Array.from(shop.values()).find((a) => a.name.toLowerCase() === name.toLowerCase()) ?? null;
}

function getItemsByCategory(category: string) {
    if (category === 'all') return Array.from(shop.values());
    return Array.from(shop.values()).filter((a) => a.category === category);
}
