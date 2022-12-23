import { Schema, model } from 'mongoose';

const Setting = Schema({
    id: { type: String, required: true, unique: true, index: true },
    language: { type: String, default: "english" }
});

export default model('Setting', Setting, 'settings');