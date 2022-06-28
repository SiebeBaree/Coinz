const mongoose = require('mongoose')

const factorySchema = new mongoose.Schema({
    factoryId: { type: Number, required: true },
    level: { type: Number, default: 1 },
    product: { type: String, default: "" },
    status: { type: String, default: "standby" },
    collectOn: { type: Number, require: true, default: parseInt(Date.now() / 1000) },
    maintenanceLevel: { type: Number, min: 0, max: 100, default: 100 }
})

const employeeSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    role: { type: String, required: true },
    wage: { type: Number, default: 15 }
})

const inventorySchema = new mongoose.Schema({
    itemId: { type: String, require: true },
    quantity: { type: Number, default: 1 }
})

module.exports = mongoose.model("Companies", new mongoose.Schema({
    guildId: { type: String, require: true },
    ownerId: { type: String, require: true },
    name: { type: String, default: "An Unnamed Company" },
    balance: { type: Number, default: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 10 },
    employees: [{ type: employeeSchema }],
    factories: [{ type: factorySchema }],
    inventory: [{ type: inventorySchema }]
}))