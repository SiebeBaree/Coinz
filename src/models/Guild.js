const { Schema, model } = require('mongoose');

const Guild = Schema({
    id: { type: String, required: true, unique: true, index: true },
    premium: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    banned: { type: Boolean, default: false },
    banReason: String,
    airdropStatus: { type: Boolean, default: false },
    airdropChannel: { type: String, default: "" },
    airdropNext: { type: Number, default: 0 },
    airdropTries: { type: Number, default: 0 }
});

module.exports = model('Guild', Guild, 'guilds');