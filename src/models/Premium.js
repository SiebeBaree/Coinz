const { Schema, model } = require('mongoose');

const Premium = Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expire: { type: Number, default: 0 }
});

module.exports = model('Premium', Premium, 'premium');