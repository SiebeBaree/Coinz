/* eslint-disable semi */
export interface IRange {
    min: number;
    max: number;
}

export interface ILootCategory {
    fail: {
        risk: number;
        message: string;
        looseRequiredItem: boolean;
        fine: IRange;
    };
    success: {
        message: string;
        sellItems: boolean;
        amount: IRange;
        loot: string[];
    };
}

export interface ILoot {
    hard: ILootCategory;
    medium?: ILootCategory;
    easy: ILootCategory;
}

export default ILoot;