const mongoose = require('mongoose')

module.exports = mongoose.model("Guilds", new mongoose.Schema({
    guildId: { type: String, require: true },
    isPremium: { type: Boolean, default: false },
    banned: { type: Boolean, default: false }
}))