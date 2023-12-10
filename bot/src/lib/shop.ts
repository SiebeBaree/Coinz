import type { SelectMenuComponentOptionData } from 'discord.js';
import { Collection } from 'discord.js';
import ItemModel, { type Item } from '../models/item';
import type { IMember } from '../models/member';
import Member from '../models/member';
import logger from '../utils/logger';
import type { InventoryItem } from './types';

export default class Shop {
    private readonly _items: Collection<string, Item>;

    public constructor() {
        this._items = new Collection();
    }

    public async fetchItems(): Promise<void> {
        const items = await ItemModel.find({});

        for (const item of items) {
            this._items.set(item.itemId, item);
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
        if (category === 'all') return Array.from(this._items.values());
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
                { id: member.id, 'inventory.itemId': id },
                { $inc: { 'inventory.$.amount': amount } },
            );
        } else {
            await Member.updateOne({ id: member.id }, { $push: { inventory: { itemId: id, amount: amount } } });
        }
    }

    public async removeItem(id: string, member: IMember, amount = 1): Promise<boolean> {
        if (!this.hasInInventory(id, member)) return false;

        const item = this.getInventoryItem(id, member);
        if (item === undefined) return false;

        if (item.amount <= amount) {
            await Member.updateOne({ id: member.id, 'inventory.itemId': id }, { $pull: { inventory: { itemId: id } } });
        } else {
            await Member.updateOne(
                { id: member.id, 'inventory.itemId': id },
                { $inc: { 'inventory.$.amount': -amount } },
            );
        }

        return true;
    }

    public async checkForDuplicates(member: IMember): Promise<void> {
        const inventory = member.inventory;

        // get the item ids and index of the duplicates
        const duplicates = inventory
            .map((a: InventoryItem, index: number) => ({ id: a.itemId, index: index }))
            .filter((a: { id: string; index: number }, index: number, arr: { id: string; index: number }[]) => {
                return arr.findIndex((b) => b.id === a.id) !== index;
            });

        // if there are no duplicates, return
        if (duplicates.length === 0) return;
        logger.info(`Found ${duplicates.length} duplicate items in ${member.id}'s inventory.`);

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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                newInventory[index].amount += item.amount;
            }
        }

        // update the member's inventory
        await Member.updateOne({ id: member.id }, { $set: { inventory: newInventory } });
    }

    public getCategories(): SelectMenuComponentOptionData[] {
        return [
            { label: 'Tools', value: 'tools' },
            { label: 'Crops', value: 'crops' },
            { label: 'Animals', value: 'animals' },
            { label: 'Fish', value: 'fish' },
            { label: 'Factory Products', value: 'factory' },
            { label: 'Rare Items', value: 'rare_items' },
            { label: 'Other', value: 'other' },
            { label: 'All Items', value: 'all' },
        ];
    }

    public getItemString(item: Item, amount?: number): string {
        return `${amount ? `${amount}x ` : ''}<:${item.itemId}:${item.emoteId}> **${item.name}**`;
    }
}
