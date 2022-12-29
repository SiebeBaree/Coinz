import { Schema, model } from "mongoose";
import InventoryItem from "../interfaces/InventoryItem";

interface IEmployee {
    userId: string;
    role: string;
    wage: number;
    hiredOn: number;
    moneyEarned: number;
    timesWorked: number;
}

interface IFactory {
    factoryId: number;
    level: number;
    experience: number;
    production: string;
    status: string;
    produceOn: number;
}

export interface IBusiness {
    ownerId: string;
    name: string;
    balance: number;
    taxRate: number;
    risk: number;
    employees: IEmployee[];
    inventory: InventoryItem[];
    factories: IFactory[];
}

const Employee = new Schema<IEmployee>({
    userId: { type: String, required: true },
    role: { type: String, default: "employee" },
    wage: { type: Number, default: 15 },
    hiredOn: { type: Number, default: Math.floor(Date.now() / 1000) },
    moneyEarned: { type: Number, default: 0 },
    timesWorked: { type: Number, default: 0 },
});

const Item = new Schema<InventoryItem>({
    itemId: { type: String, required: true },
    amount: { type: Number, default: 1 },
});

const Factory = new Schema<IFactory>({
    factoryId: { type: Number, required: true },
    level: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    production: { type: String, default: "none" },
    status: { type: String, default: "idle" },
    produceOn: { type: Number, default: 0 },
});

const businessSchema = new Schema<IBusiness>({
    ownerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    balance: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    risk: { type: Number, default: 0 },
    employees: [{ type: Employee, default: [] }],
    inventory: [{ type: Item, default: [] }],
    factories: [{ type: Factory, default: [] }],
}, { timestamps: true });

export default model<IBusiness>("Business", businessSchema);