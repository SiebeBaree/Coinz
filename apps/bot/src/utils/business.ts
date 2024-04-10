import factoryItems from '../data/factory.json';
import type { InventoryItem } from '../lib/types';

export type FactoryItem = {
    itemId: string;
    name: string;
    emoteId: string;
    price: number;
    duration: number;
    amount: number;
    level: number;
    sellable: boolean;
    producable: boolean;
    isEndProduct: boolean;
    requirements: {
        itemId: string;
        amount: number;
    }[];
};

export default class Business {
    private readonly _items: Map<string, FactoryItem>;

    public constructor() {
        this._items = new Map(factoryItems.map((item) => [item.itemId, item]));
    }

    public get items(): Map<string, FactoryItem> {
        return this._items;
    }

    public getById(itemId: string): FactoryItem | undefined {
        return this._items.get(itemId);
    }

    public getByName(name: string): FactoryItem | undefined {
        return Array.from(this._items.values()).find((item) => item.name.toLowerCase() === name.toLowerCase());
    }

    public hasRequirements(itemId: string, inventory: InventoryItem[]): boolean {
        const item = this.getById(itemId);
        if (!item) return false;

        return item.requirements.every((req) =>
            inventory.some((inv) => inv.itemId === req.itemId && inv.amount >= req.amount),
        );
    }

    public getInventoryItem(itemId: string, inventory: InventoryItem[]): InventoryItem | undefined {
        return inventory.find((item) => item.itemId === itemId);
    }

    public getItemString(item: FactoryItem, amount?: number): string {
        return `${amount ? `${amount}x ` : ''}<:${item.itemId}:${item.emoteId}> **${item.name}**`;
    }
}
