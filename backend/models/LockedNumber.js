const mongoose = require('mongoose');

const lockedNumberSchema = new mongoose.Schema({
    roundId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Round',
        required: true
    },
    numberType: {
        type: String,
        enum: ['single', 'triple'],
        required: true
    },
    number: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Create a compound index for efficient lookups
lockedNumberSchema.index({ roundId: 1, numberType: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('LockedNumber', lockedNumberSchema);