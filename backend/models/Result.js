const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    roundId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Round' },
    date: { type: String, required: true }, // e.g. '2025-08-28'
    timeSlot: { type: String, required: true },
    tripleDigitNumber: { type: String, required: true },
    singleDigitResult: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);