const { Schema, model } = require('mongoose');

const Stats = Schema({
    id: { type: String, required: true, unique: true, index: true },
    workComplete: { type: Number, default: 0 },
    commandsExecuted: { type: Number, default: 0 },
    catchedFish: { type: Number, default: 0 },
    diamondsFound: { type: Number, default: 0 }
});

module.exports = model('Stats', Stats, 'stats');