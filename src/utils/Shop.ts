import { Collection, SelectMenuComponentOptionData } from "discord.js";
import InventoryItem from "../interfaces/InventoryItem";
import Item from "../interfaces/Item";
import Member, { IMember } from "../models/Member";

export default class Shop {
    private readonly _items: Collection<string, Item>;

    constructor(items: Item[]) {
        this._items = new Collection(items.map((i) => [i.itemId, i]));
    }

    get all(): Map<string, Item> {
        return this._items;
    }

    getById(id: string): Item | null {
        return this._items.get(id) ?? null;
    }

    getByName(name: string): Item | null {
        return Array.from(this._items.values()).find((a) => a.name.toLowerCase() === name.toLowerCase()) ?? null;
    }

    getAllByCategory(category: string): Item[] {
        if (category === "all") return Array.from(this._items.values());
        return Array.from(this._items.values()).filter((a) => a.category === category);
    }

    hasInInventory(id: string, member: IMember): boolean {
        return member.inventory.some((a: InventoryItem) => a.itemId === id) && this.getById(id) !== null;
    }

    getInventoryItem(id: string, member: IMember): InventoryItem | undefined {
        return this.getById(id) === null ? undefined : member.inventory.find((a: InventoryItem) => a.itemId === id);
    }

    async addItem(id: string, member: IMember, amount = 1): Promise<void> {
        if (this.hasInInventory(id, member)) {
            await Member.updateOne(
                { id: member.id, "inventory.itemId": id },
                { $inc: { "inventory.$.amount": amount } },
            );
        } else {
            await Member.updateOne(
                { id: member.id },
                { $push: { inventory: { itemId: id, amount: amount } } },
            );
        }
    }

    async removeItem(id: string, member: IMember, amount = 1): Promise<boolean> {
        if (!this.hasInInventory(id, member)) return false;

        const item = this.getInventoryItem(id, member);
        if (item === undefined) return false;

        if (item.amount <= amount) {
            await Member.updateOne(
                { id: member.id, "inventory.itemId": id },
                { $pull: { inventory: { itemId: id } } },
            );
        } else {
            await Member.updateOne(
                { id: member.id, "inventory.itemId": id },
                { $inc: { "inventory.$.amount": -amount } },
            );
        }

        return true;
    }

    getCategories(): SelectMenuComponentOptionData[] {
        return [
            { label: "Tools", value: "tools" },
            { label: "Crops", value: "crops" },
            { label: "Rare Items", value: "rare_items" },
            { label: "Other", value: "other" },
            { label: "All Items", value: "all" },
        ];
    }
}