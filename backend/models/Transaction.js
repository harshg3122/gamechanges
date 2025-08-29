const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['add_token', 'withdraw', 'bet_placed', 'bet_win', 'bet_loss', 'bonus'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  description: {
    type: String,
    default: ''
  },
  paymentApp: {
    type: String,
    enum: ['GooglePay', 'PhonePe', 'Paytm', 'Other'],
    default: 'Other'
  },
  upiId: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  referenceId: {
    type: String,
    default: ''
  },
  balanceBefore: {
    type: Number,
    default: 0
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  betId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bet'
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
