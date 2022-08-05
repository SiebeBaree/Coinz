const { Schema, model, Types } = require('mongoose');

const Inventory = Schema({
    itemId: { type: String, required: true },
    quantity: { type: Number, default: 1 }
});

const Stock = Schema({
    ticker: { type: String, required: true },
    quantity: { type: Types.Decimal128, required: true },
    buyPrice: { type: Number, required: true }
});

const Plot = Schema({
    plotId: { type: Number, required: true },
    status: { type: String, default: "empty" },
    harvestOn: { type: Number, required: true, default: parseInt(Date.now() / 1000) },
    crop: { type: String, default: "none" }
});

const Member = Schema({
    id: { type: String, required: true, unique: true, index: true },
    banned: { type: Boolean, default: false },
    votes: { type: Number, default: 0 },
    spins: { type: Number, default: 0 },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    job: { type: String, default: "" },
    streak: { type: Number, default: 0 },
    lastStreak: { type: Number, default: 0 },
    passiveMode: { type: Boolean, default: false },
    inventory: [{ type: Inventory }],
    stocks: [{ type: Stock }],
    plots: [{ type: Plot }],
    lastWater: { type: Number, default: parseInt(Date.now() / 1000) }
});

module.exports = model('Member', Member, 'members');