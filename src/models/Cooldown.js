const { Schema, model } = require('mongoose');

const Cooldown = Schema({
    id: { type: String, required: true, index: true },
    command: { type: String, required: true },
    expiresOn: { type: Number, default: new Date() }
});

module.exports = model('Cooldown', Cooldown, 'cooldowns');