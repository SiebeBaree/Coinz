export type InventoryItem = {
    itemId: string;
    amount: number;
};

export type Loot = {
    [key: string]: number;
};

export type Job = {
    name: string;
    salary: number;
    minLvl: number;
    requiredItems: string[];
    workPerWeek: number;
};
