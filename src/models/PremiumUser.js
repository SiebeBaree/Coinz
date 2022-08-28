const { Schema, model } = require('mongoose');

const PremiumUser = Schema({
    id: { type: String, required: true, index: true, unique: true },
    expire: { type: Number, default: 0 }
});

module.exports = model('PremiumUser', PremiumUser, 'premium_user');