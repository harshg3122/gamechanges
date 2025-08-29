const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['credit', 'debit']
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  source: {
    type: String,
    required: true,
    enum: ['admin-topup', 'game-play', 'game-win', 'refund', 'bonus', 'withdrawal']
  },
  description: {
    type: String,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  roundId: String,
  reference: String, // For external payment references
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  metadata: {
    classType: String,
    selectedNumber: String,
    winningNumber: String,
    paymentMethod: String,
    transactionId: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, source: 1 });
walletTransactionSchema.index({ roundId: 1 });
walletTransactionSchema.index({ adminId: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1 });

// Static method to create transaction
walletTransactionSchema.statics.createTransaction = async function(data) {
  const {
    userId,
    type,
    amount,
    source,
    description,
    balanceBefore,
    balanceAfter,
    adminId,
    roundId,
    reference,
    metadata
  } = data;

  return await this.create({
    userId,
    type,
    amount,
    source,
    description,
    balanceBefore,
    balanceAfter,
    adminId,
    roundId,
    reference,
    metadata
  });
};

// Static method to get user transactions
walletTransactionSchema.statics.getUserTransactions = function(userId, limit = 50, offset = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('adminId', 'fullName email');
};

// Static method to get admin transactions
walletTransactionSchema.statics.getAdminTransactions = function(adminId, limit = 100) {
  return this.find({ adminId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username mobileNumber');
};

// Static method to get transactions by date range
walletTransactionSchema.statics.getTransactionsByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    createdAt: { $gte: startDate, $lte: endDate },
    ...filters
  };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'username mobileNumber')
    .populate('adminId', 'fullName email');
};

// Static method to get transaction summary
walletTransactionSchema.statics.getTransactionSummary = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  const summary = {
    totalCredit: 0,
    totalDebit: 0,
    creditCount: 0,
    debitCount: 0,
    netAmount: 0
  };

  result.forEach(item => {
    if (item._id === 'credit') {
      summary.totalCredit = item.totalAmount;
      summary.creditCount = item.count;
    } else if (item._id === 'debit') {
      summary.totalDebit = item.totalAmount;
      summary.debitCount = item.count;
    }
  });

  summary.netAmount = summary.totalCredit - summary.totalDebit;
  
  return summary;
};

// Virtual for formatted amount
walletTransactionSchema.virtual('formattedAmount').get(function() {
  const prefix = this.type === 'credit' ? '+' : '-';
  return `${prefix}₹${this.amount}`;
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
