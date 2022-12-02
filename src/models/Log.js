import { Schema, model } from 'mongoose';

const Log = Schema({
    level: { type: String, default: 'info' },
    type: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: String },
}, { timestamps: true });

export default model('Log', Log, 'logs');