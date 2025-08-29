const mongoose = require('mongoose');

const walletRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['add_token', 'withdraw_token'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be at least 1']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
walletRequestSchema.index({ userId: 1, createdAt: -1 });
walletRequestSchema.index({ status: 1, createdAt: -1 });
walletRequestSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('WalletRequest', walletRequestSchema);
