const mongoose = require('mongoose')
const moment = require('moment')

module.exports = mongoose.model("Stocks", new mongoose.Schema({
    ticker: { type: String, require: true },
    type: { type: String, require: true },
    fullName: { type: String, require: true },
    description: { type: String, require: true },
    price: { type: Number, require: true },
    previous_price: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
}))