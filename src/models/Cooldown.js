import { Schema, model } from 'mongoose';

const Cooldown = Schema({
    id: { type: String, required: true, index: true },
    command: { type: String, required: true },
    expiresOn: { type: Number, default: new Date() }
});

export default model('Cooldown', Cooldown, 'cooldowns');