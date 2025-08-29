const mongoose = require('mongoose');

const tripleDigitSchema = new mongoose.Schema({
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    number: { type: String, required: true }, // 3-digit string
    locked: { type: Boolean, default: false }
});

module.exports = mongoose.model('TripleDigit', tripleDigitSchema);