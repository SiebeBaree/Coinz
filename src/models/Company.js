const { Schema, model } = require('mongoose');

const Factory = Schema({
    factoryId: { type: Number, required: true },
    level: { type: Number, default: 1 },
    product: { type: String, default: "" },
    status: { type: String, default: "standby" },
    collectOn: { type: Number, required: true, default: parseInt(Date.now() / 1000) },
    maintenanceLevel: { type: Number, min: 0, max: 100, default: 100 }
});

const Employee = Schema({
    userId: { type: String, required: true },
    role: { type: String, required: true },
    wage: { type: Number, default: 15 }
});

const Inventory = Schema({
    itemId: { type: String, required: true },
    quantity: { type: Number, default: 1 }
});

const Company = Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "An Unnamed Company" },
    balance: { type: Number, default: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 10 },
    employees: [{ type: Employee }],
    factories: [{ type: Factory }],
    inventory: [{ type: Inventory }]
});

module.exports = model('Company', Company, 'companies');