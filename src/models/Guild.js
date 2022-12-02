import { Schema, model } from 'mongoose';

const Guild = Schema({
    id: { type: String, required: true, unique: true, index: true },
    premium: { type: Boolean, default: false },
    premiumUser: { type: String, default: "" },
    premiumCooldown: { type: Number, default: Math.floor(Date.now() / 1000) },
    joinedAt: { type: Date, default: Date.now },
    banned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
    airdropStatus: { type: Boolean, default: false },
    airdropChannel: { type: String, default: "" },
    airdropNext: { type: Number, default: 0 },
    airdropTries: { type: Number, default: 0 }
});

export default model('Guild', Guild, 'guilds');