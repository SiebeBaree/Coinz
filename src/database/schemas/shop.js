const mongoose = require('mongoose')

module.exports = mongoose.model("Shop", new mongoose.Schema({
    itemId: { type: String, require: true },
    name: { type: String, require: true },
    icon: { type: String, require: true },
    description: { type: String, require: true },
    buyPrice: { type: Number, require: true },
    sellPrice: { type: Number, require: true },
    type: { type: String, default: "None" },
    multiplier: { type: mongoose.Types.Decimal128, default: 0.0 }, // floating point
    duration: { type: Number, default: 0 }
}))