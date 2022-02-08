const mongoose = require('mongoose')

module.exports = mongoose.model("Cooldowns", new mongoose.Schema({
    guildId: { type: String, require: true },
    userId: { type: String, require: true },
    command: { type: String, require: true },
    expiresOn: { type: Number, default: 0 }, // Epoch Unix Timestamp (Format: Seconds)
    timesUsed: { type: Number, default: 1 }
}))