const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');
const WalletRequest = require('../models/WalletRequest');
const User = require('../models/User');

// Get all transactions for admin
exports.getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .populate('userId', 'username mobileNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments();

    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};

// Get user's transactions (includes wallet transactions, bets, wins, etc.)
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get wallet transactions
    const walletTransactions = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get regular transactions (bets, wins, etc.)
    const regularTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Combine and sort transactions
    const allTransactions = [...walletTransactions, ...regularTransactions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    const totalWallet = await WalletTransaction.countDocuments({ userId });
    const totalRegular = await Transaction.countDocuments({ userId });
    const total = totalWallet + totalRegular;

    res.json({
      success: true,
      transactions: allTransactions.map(transaction => ({
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description || transaction.type,
        status: transaction.status || 'completed',
        timestamp: transaction.createdAt,
        createdAt: transaction.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user transactions'
    });
  }
};

// Get user's wallet requests (add token / withdraw requests)
exports.getUserWalletRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const walletRequests = await WalletRequest.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WalletRequest.countDocuments({ userId });

    res.json({
      success: true,
      requests: walletRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching wallet requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet requests'
    });
  }
};

// Create a transaction record (used internally by other controllers)
exports.createTransaction = async (transactionData) => {
  try {
    const transaction = new Transaction(transactionData);
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Create a wallet transaction record
exports.createWalletTransaction = async (walletTransactionData) => {
  try {
    const walletTransaction = new WalletTransaction(walletTransactionData);
    await walletTransaction.save();
    return walletTransaction;
  } catch (error) {
    console.error('Error creating wallet transaction:', error);
    throw error;
  }
};
