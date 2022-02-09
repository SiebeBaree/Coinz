const mongoose = require('mongoose')

module.exports = mongoose.model("Shop", new mongoose.Schema({
    itemId: { type: String, require: true },
    category: { type: String, require: true },
    name: { type: String, require: true },
    icon: { type: String, require: true },
    shortDescription: { type: String, require: true },
    longDescription: String,
    buyPrice: { type: Number, require: true },
    sellPrice: { type: Number, require: true },
    multiplier: { type: mongoose.Types.Decimal128, default: 0.0 }, // floating point
    duration: { type: Number, default: 0 }
}))