import { Schema, model } from 'mongoose';

const Stats = Schema({
    id: { type: String, required: true, unique: true, index: true },
    workComplete: { type: Number, default: 0 },
    commandsExecuted: { type: Number, default: 0 },
    catchedFish: { type: Number, default: 0 },
    luckyWheelSpins: { type: Number, default: 0 }
});

export default model('Stats', Stats, 'stats');