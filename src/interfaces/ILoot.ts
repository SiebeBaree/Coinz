/* eslint-disable semi */
interface ILootItem {
    itemId: string;
    name: string;
    emoteId: string;
    sellPrice: number;
    amount?: number;
}

interface IComplexLootCategory {
    failMessage: string;
    successMessage: string;
    risk: number;
    failReward: [number, number];
    loot: ILootItem[];
}

export type ISimpleLoot = {
    loot: ILootItem[];
}

export type IComplexLoot = {
    hard: IComplexLootCategory;
    medium: IComplexLootCategory;
    easy: IComplexLootCategory;
}

export type ILoot = ISimpleLoot | IComplexLoot;