const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  gameClass: { 
    type: String, 
    enum: ['A', 'B', 'C', 'D'], 
    required: true 
  },
  timeSlot: { 
    type: String, 
    required: true 
  },
  gameDate: { 
    type: Date, 
    default: Date.now 
  },
  winningNumber: { 
    type: String,
    default: null
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'], 
    default: 'active' 
  },
  totalBets: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  resultDeclaredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for unique rounds per class and time slot
roundSchema.index({ gameClass: 1, timeSlot: 1, gameDate: 1 }, { unique: true });

module.exports = mongoose.model('Round', roundSchema);
