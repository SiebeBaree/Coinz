const { Schema, model } = require('mongoose');

const Guild = Schema({
    id: { type: String, required: true, unique: true, index: true },
    banned: { type: Boolean, default: false }
});

module.exports = model('Guild', Guild, 'guilds');