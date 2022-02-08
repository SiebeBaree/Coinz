const mongoose = require('mongoose')

module.exports = mongoose.model("Users", new mongoose.Schema({
    userId: { type: String, require: true },
    isPremium: { type: Boolean, default: false },
    banned: { type: Boolean, default: false }
}))