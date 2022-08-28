const { Schema, model } = require('mongoose');

const BannedUser = Schema({
    id: { type: String, required: true, index: true, unique: true },
    expire: { type: Number, default: 0 },
    reason: { type: String, default: "No reason was given" },
    moderator: { type: String, default: "" }
});

module.exports = model('BannedUser', BannedUser, 'banned_user');