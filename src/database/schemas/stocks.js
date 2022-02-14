const mongoose = require('mongoose')

module.exports = mongoose.model("Stocks", new mongoose.Schema({
    ticker: { type: String, require: true },
    type: { type: String, require: true },
    fullName: { type: String, require: true },
    price: { type: mongoose.Types.Decimal128, require: true },
    previousClose: { type: mongoose.Types.Decimal128, default: 0 },
    lastUpdated: { type: Number, default: 0 }
}))