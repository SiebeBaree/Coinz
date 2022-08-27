const { Schema, model } = require('mongoose');

const Guild = Schema({
    id: { type: String, required: true, unique: true, index: true },
    airdropStatus: { type: Boolean, default: false },
    airdropChannel: { type: String, default: "" },
    airdropNext: { type: Number, default: 0 }
});

module.exports = model('Guild', Guild, 'guilds');