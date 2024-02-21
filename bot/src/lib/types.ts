import type { IBusiness, IEmployee } from '../models/business';

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

export type BusinessData = {
    business: IBusiness;
    employee: IEmployee;
};

export enum Positions {
    Employee,
    Manager,
    CEO,
}

export enum MarketStatus {
    Listed,
    Sold,
}
