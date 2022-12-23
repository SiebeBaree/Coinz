import { Schema, model } from 'mongoose';

const Premium = Schema({
    id: { type: String, required: true, unique: true, index: true },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Number, default: 0 }
});

export default model('Premium', Premium, 'premium');