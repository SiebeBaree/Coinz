import { Schema, model } from 'mongoose';

const Employee = Schema({
    userId: { type: String, required: true },
    role: { type: String, default: 'employee' },
    wage: { type: Number, default: 15 },
    hiredAt: { type: Date, default: Date.now() },
    moneyCollected: { type: Number, default: 0 },
    timesWorked: { type: Number, default: 0 }
});

const Inventory = Schema({
    itemId: { type: String, required: true },
    amount: { type: Number, default: 1 }
});

const Factory = Schema({
    factoryId: { type: Number, required: true },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    production: { type: String, default: "none" },
    status: { type: String, default: "standby" },
    produceOn: { type: Date, default: Date.now() }
});

const Business = Schema({
    ownerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    balance: { type: Number, default: 500 },
    taxRate: { type: Number, min: 0, max: 100, default: 5 },
    risk: { type: Number, min: 0, max: 100, default: 0 },
    employees: [{ type: Employee }],
    inventory: [{ type: Inventory }],
    factories: [{ type: Factory }]
});

export default model('Business', Business, 'businesses');