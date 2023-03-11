import { Collection, SelectMenuComponentOptionData } from "discord.js";
import InventoryItem from "../interfaces/InventoryItem";
import Item from "../interfaces/Item";
import Member, { IMember } from "../models/Member";
import ItemModel from "../models/Item";

export default class Shop {
    private readonly _items: Collection<string, Item>;

    constructor(items: Item[], updateDatabase = false) {
        this._items = new Collection(items.map((i) => [i.itemId, i]));

        // upload the items to the database
        if (updateDatabase) {
            ItemModel.deleteMany({}).exec();

            for (const item of items) {
                new ItemModel(item).save();
            }
        }
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

    async checkForDuplicates(member: IMember): Promise<void> {
        const inventory = member.inventory;

        // get the item ids and index of the duplicates
        const duplicates = inventory
            .map((a: InventoryItem, i: number) => ({ id: a.itemId, index: i }))
            .filter((a: { id: string; index: number }, i: number, arr: { id: string; index: number }[]) => {
                return arr.findIndex((b) => b.id === a.id) !== i;
            });

        // if there are no duplicates, return
        if (duplicates.length === 0) return;

        // create a new inventory
        const newInventory: InventoryItem[] = [];

        // loop through the inventory
        for (const item of inventory) {
            // if the item is not a duplicate, add it to the new inventory
            if (!duplicates.some((a) => a.id === item.itemId)) {
                newInventory.push(item);
                continue;
            }

            // if the item is a duplicate, add it to the new inventory
            // and add the amount to the item in the new inventory
            const duplicate = duplicates.find((a) => a.id === item.itemId);
            if (duplicate === undefined) continue;

            const index = newInventory.findIndex((a) => a.itemId === item.itemId);
            if (index === -1) {
                newInventory.push(item);
            } else {
                newInventory[index].amount += item.amount;
            }
        }

        // update the member's inventory
        await Member.updateOne(
            { id: member.id },
            { $set: { inventory: newInventory } },
        );
    }

    getCategories(): SelectMenuComponentOptionData[] {
        return [
            { label: "Tools", value: "tools" },
            { label: "Crops", value: "crops" },
            { label: "Animals", value: "animals" },
            { label: "Fish", value: "fish" },
            { label: "Factory Products", value: "factory" },
            { label: "Rare Items", value: "rare_items" },
            { label: "Other", value: "other" },
            { label: "All Items", value: "all" },
        ];
    }
}