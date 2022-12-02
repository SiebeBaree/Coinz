import { Schema, model } from 'mongoose';

const Premium = Schema({
    id: { type: String, required: true, unique: true, index: true },
    premium: { type: Boolean, default: false },
    premiumType: { type: Number, default: 0 },
    premiumExpiresAt: { type: Number, default: 0 },
    maximumGuilds: { type: Number, default: 0 },
    guilds: [{ type: String }]
});

export default model('Premium', Premium, 'premium');