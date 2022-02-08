const mongoose = require('mongoose')

const petSchema = new mongoose.Schema({
    itemId: { type: String, require: true },
    name: { type: String, require: true },
    stats: {
        experience: { type: Number, default: 0 },
        hunger: { type: Number, default: 100, max: 100, min: 0 },
        energy: { type: Number, default: 100, max: 100, min: 0 },
        hygiene: { type: Number, default: 100, max: 100, min: 0 },
        health: { type: Number, default: 100, max: 100, min: 0 },
        attack: { type: Number, default: 0 },
        defense: { type: Number, default: 0 },
        endurance: { type: Number, default: 0 },
        luck: { type: Number, default: 0 }
    },
    prestige: { type: Number, default: 0 },
    lastNameChange: { type: Date, default: Date.now }
})

const socialSchema = new mongoose.Schema({
    followers: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    lastPost: Date,
    lastReact: Date,
    lastAd: Date
})

const businessSchema = new mongoose.Schema({
    businessId: { type: Number, require: true },
    name: { type: String, require: true },
    employeeIds: [String],
    level: { type: Number, default: 1 },
    worth: { type: Number, default: 0 },
    workSalary: { type: Number, default: 0 },
    lastAdvertised: Date
})

const inventorySchema = new mongoose.Schema({
    itemId: { type: String, require: true },
    quantity: { type: Number, default: 1 }
})

// type == [stock, etf, crypto, bond, ...]
const stocksSchema = new mongoose.Schema({
    ticker: { type: String, require: true },
    type: { type: String, require: true },
    buyPrice: { type: Number, require: true },
    datePurchased: { type: Date, default: Date.now },
    quantity: { type: Number, default: 1 }
})

const minersSchema = new mongoose.Schema({
    itemId: { type: Number, require: true },
    minerId: { type: Number, require: true },
    overclock: { type: Number, default: 0 },
    power: { type: Boolean, default: true },
    coinsMined: { type: Number, default: 0 },
    overheatRisk: { type: Number, default: 0 }
})

const plotsSchema = new mongoose.Schema({
    plotId: { type: Number, require: true },
    status: { type: String, default: "Empty" },
    harvestOn: { type: Date, require: true },
    crop: { type: String, default: "None" },
    fertilized: { type: Boolean, default: false }
})

const activeBoostersSchema = new mongoose.Schema({
    itemId: { type: String, require: true },
    timeStarted: { type: Date, default: Date.now },
    timeEnd: { type: Date, require: true }
})

module.exports = mongoose.model("GuildUsers", new mongoose.Schema({
    userId: { type: String, require: true },
    guildId: { type: String, require: true },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    streaks: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    passiveMode: { type: Boolean, default: false },
    badgeOnProfile: { type: String, default: "" },
    badges: [String],
    pet: { type: petSchema, default: {} },
    social: { type: socialSchema, default: {} },
    business: { type: businessSchema, default: {} },
    inventory: [{ type: inventorySchema }],
    stocks: [{ type: stocksSchema }],
    miners: [{ type: minersSchema }],
    plots: [{ type: plotsSchema }],
    activeBoosters: [{ type: activeBoostersSchema }]
}))