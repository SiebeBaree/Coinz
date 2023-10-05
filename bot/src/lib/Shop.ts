import { Collection, SelectMenuComponentOptionData } from "discord.js";
import Item from "../domain/Item";
import Member, { IMember } from "../models/Member";
import InventoryItem from "../domain/IInventoryItem";
import winston from "winston";

export default class Shop {
    private readonly _items: Collection<string, Item>;
    private readonly logger: winston.Logger;

    constructor(logger: winston.Logger, startItems: Item[] = [], fetch: boolean = true) {
        this.logger = logger;
        this._items = new Collection();

        if (fetch) {
            this.fetchItems().then(() => null);
        }
    }

    public async fetchItems(): Promise<void> {
        try {
            const items = await fetch(`${process.env.API_URL}/items`).then(res => res.json());
            items.forEach((item: Item) => this._items.set(item.itemId, item));
        } catch (err) {
            this.logger.error(err);
        }
    }

    public get all(): Map<string, Item> {
        return this._items;
    }

    public getById(id: string): Item | null {
        return this._items.get(id) ?? null;
    }

    public getByName(name: string): Item | null {
        return Array.from(this._items.values()).find((a) => a.name.toLowerCase() === name.toLowerCase()) ?? null;
    }

    public getAllByCategory(category: string): Item[] {
        if (category === "all") return Array.from(this._items.values());
        return Array.from(this._items.values()).filter((a) => a.category === category);
    }

    public hasInInventory(id: string, member: IMember): boolean {
        return member.inventory.some((a: InventoryItem) => a.itemId === id) && this.getById(id) !== null;
    }

    public getInventoryItem(id: string, member: IMember): InventoryItem | undefined {
        return this.getById(id) === null ? undefined : member.inventory.find((a: InventoryItem) => a.itemId === id);
    }

    public async addItem(id: string, member: IMember, amount = 1): Promise<void> {
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

    public async removeItem(id: string, member: IMember, amount = 1): Promise<boolean> {
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

    public async checkForDuplicates(member: IMember): Promise<void> {
        const inventory = member.inventory;

        // get the item ids and index of the duplicates
        const duplicates = inventory
            .map((a: InventoryItem, i: number) => ({ id: a.itemId, index: i }))
            .filter((a: { id: string; index: number }, i: number, arr: { id: string; index: number }[]) => {
                return arr.findIndex((b) => b.id === a.id) !== i;
            });

        // if there are no duplicates, return
        if (duplicates.length === 0) return;
        this.logger.info(`Found ${duplicates.length} duplicate items in ${member.id}'s inventory.`);

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

    public getCategories(): SelectMenuComponentOptionData[] {
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

    public getItemString(item: Item, amount?: number): string {
        return `${amount ? `${amount}x ` : ""}<:${item.itemId}:${item.emoteId}> **${item.name}**`;
    }
}