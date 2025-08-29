const mongoose = require('mongoose');

const singleDigitSchema = new mongoose.Schema({
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    digit: { type: String, required: true }, // single digit as string
    locked: { type: Boolean, default: false }
});

module.exports = mongoose.model('SingleDigit', singleDigitSchema);