const mongoose = require('mongoose');

const numberSelectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    classType: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D']
    },
    number: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                if (this.classType === 'D') {
                    return /^[1-9]$/.test(v);
                } else {
                    return /^\d{3}$/.test(v);
                }
            },
            message: function(props) {
                return props.value + (this.classType === 'D' ? ' must be a single digit (1-9)' : ' must be exactly 3 digits');
            }
        }
    },
    amount: {
        type: Number,
        required: true,
        min: [1, 'Bet amount must be at least 1']
    },
    roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
    placedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'win', 'loss'],
        default: 'pending'
    },
    winningAmount: {
        type: Number,
        default: 0
    },
    resultProcessedAt: Date
}, {
    timestamps: true
});

// Compound index for efficient queries
numberSelectionSchema.index({ userId: 1, roundId: 1 });
numberSelectionSchema.index({ roundId: 1, classType: 1 });
numberSelectionSchema.index({ placedAt: -1 });
numberSelectionSchema.index({ status: 1 });

// Instance method to mark as winner
numberSelectionSchema.methods.markAsWinner = function(winningAmount) {
    this.status = 'win';
    this.winningAmount = winningAmount;
    this.resultProcessedAt = new Date();
    return this.save();
};

// Instance method to mark as loser
numberSelectionSchema.methods.markAsLoser = function() {
    this.status = 'loss';
    this.winningAmount = 0;
    this.resultProcessedAt = new Date();
    return this.save();
};

// Static method to get selections by round
numberSelectionSchema.statics.getByRound = function(roundId, classType = null) {
    const query = { roundId };
    if (classType) {
        query.classType = classType;
    }
    return this.find(query).populate('userId', 'username mobileNumber wallet');
};

// Static method to get user's selections
numberSelectionSchema.statics.getUserSelections = function(userId, limit = 50) {
    return this.find({ userId })
        .sort({ placedAt: -1 })
        .limit(limit)
        .populate('userId', 'username');
};

// Virtual for profit/loss
numberSelectionSchema.virtual('profitLoss').get(function() {
    return this.winningAmount - this.amount;
});

module.exports = mongoose.model('NumberSelection', numberSelectionSchema);