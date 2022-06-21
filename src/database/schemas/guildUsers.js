const mongoose = require('mongoose')

// const petSchema = new mongoose.Schema({
//     itemId: { type: String, require: true },
//     name: { type: String, require: true },
//     stats: {
//         experience: { type: Number, default: 0 },
//         hunger: { type: Number, default: 100, max: 100, min: 0 },
//         energy: { type: Number, default: 100, max: 100, min: 0 },
//         hygiene: { type: Number, default: 100, max: 100, min: 0 },
//         health: { type: Number, default: 100, max: 100, min: 0 },
//         attack: { type: Number, default: 0 },
//         defense: { type: Number, default: 0 },
//         endurance: { type: Number, default: 0 },
//         luck: { type: Number, default: 0 }
//     },
//     prestige: { type: Number, default: 0 },
//     lastNameChange: { type: Number, default: parseInt(Date.now() / 1000) }
// })

// const socialSchema = new mongoose.Schema({
//     followers: { type: Number, default: 0 },
//     likes: { type: Number, default: 0 },
//     lastPost: Date,
//     lastReact: Date,
//     lastAd: Date
// })

const inventorySchema = new mongoose.Schema({
    itemId: { type: String, require: true },
    quantity: { type: Number, default: 1 }
})

const stocksSchema = new mongoose.Schema({
    ticker: { type: String, require: true },
    quantity: { type: mongoose.Types.Decimal128, require: true },
    buyPrice: { type: Number, require: true }
})

// const minersSchema = new mongoose.Schema({
//     itemId: { type: Number, require: true },
//     minerId: { type: Number, require: true },
//     overclock: { type: Number, default: 0 },
//     power: { type: Boolean, default: true },
//     coinsMined: { type: Number, default: 0 },
//     overheatRisk: { type: Number, default: 0 }
// })

const plotsSchema = new mongoose.Schema({
    plotId: { type: Number, require: true },
    status: { type: String, default: "empty" },
    harvestOn: { type: Number, require: true, default: parseInt(Date.now() / 1000) },
    crop: { type: String, default: "none" }
})

// const activeBoostersSchema = new mongoose.Schema({
//     itemId: { type: String, require: true },
//     timeStarted: { type: Number, default: parseInt(Date.now() / 1000) },
//     timeEnd: { type: Date, require: true }
// })

module.exports = mongoose.model("GuildUsers", new mongoose.Schema({
    userId: { type: String, require: true },
    guildId: { type: String, require: true },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    job: { type: String, default: "" },
    streak: { type: Number, default: 0 },
    lastStreak: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    passiveMode: { type: Boolean, default: false },
    // badgeOnProfile: { type: String, default: "" },
    // badges: [String],
    // pet: { type: petSchema, default: {} },
    // social: { type: socialSchema, default: {} },
    inventory: [{ type: inventorySchema }],
    stocks: [{ type: stocksSchema }],
    // miners: [{ type: minersSchema }],
    plots: [{ type: plotsSchema }],
    lastWater: { type: Number, default: parseInt(Date.now() / 1000) },
    // activeBoosters: [{ type: activeBoostersSchema }]
}))