const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  gameClass: { 
    type: String, 
    enum: ['A', 'B', 'C', 'D'], 
    required: true 
  },
  selectedNumber: { 
    type: String, 
    required: true 
  },
  betAmount: { 
    type: Number, 
    required: true,
    min: [1, 'Bet amount must be at least 1 token']
  },
  timeSlot: { 
    type: String,
    required: true
  },
  roundId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Round'
  },
  status: { 
    type: String, 
    enum: ['placed', 'won', 'lost', 'pending'], 
    default: 'pending' 
  },
  winAmount: {
    type: Number,
    default: 0
  },
  gameDate: {
    type: Date,
    default: Date.now
  },
  resultDeclared: {
    type: Boolean,
    default: false
  },
  resultDeclaredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
betSchema.index({ userId: 1, gameDate: -1 });
betSchema.index({ gameClass: 1, gameDate: -1 });
betSchema.index({ status: 1 });

module.exports = mongoose.model('Bet', betSchema);
