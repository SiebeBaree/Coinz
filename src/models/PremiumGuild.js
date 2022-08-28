const { Schema, model } = require('mongoose');

const PremiumGuild = Schema({
    id: { type: String, required: true, index: true, unique: true },
    userId: { type: String, required: true, index: true },
    expire: { type: Number, default: 0 }
});

module.exports = model('PremiumGuild', PremiumGuild, 'premium_guild');