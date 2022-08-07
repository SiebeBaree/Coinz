const { Schema, model } = require('mongoose');

const Guild = Schema({
    guildId: { type: String, required: true },
    expire: { type: Number, default: 0 }
});

const Premium = Schema({
    userId: { type: String, required: true, index: true, unique: true },
    expire: { type: Number, default: 0 },
    guilds: [{ type: Guild }]
});

module.exports = model('Premium', Premium, 'premium');