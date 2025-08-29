const User = require('../models/User');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const WalletRequest = require('../models/WalletRequest');
const Settings = require('../models/Settings');

/**
 * Add tokens to wallet
 */
const addToken = async (req, res) => {
  try {
    const { amount, upiId = '', userName = '', paymentApp = 'Other' } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be greater than 0'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const balanceBefore = user.walletBalance || 0;

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'add_token',
      amount,
      status: 'pending', // Initially pending, admin will approve
      description: `Token add request via ${paymentApp}`,
      paymentApp,
      upiId: upiId || '',
      balanceBefore,
      balanceAfter: balanceBefore, // Will be updated when approved
      referenceId: `ADD_${Date.now()}_${userId.toString().slice(-4)}`
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Token add request submitted successfully. It will be processed soon.',
      data: {
        transactionId: transaction._id,
        amount,
        paymentApp,
        status: 'pending',
        referenceId: transaction.referenceId
      }
    });

  } catch (error) {
    console.error('Error adding token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Request withdrawal
 */
const withdrawToken = async (req, res) => {
  try {
    const { amount, phoneNumber, paymentApp = 'GooglePay' } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be greater than 0'
      });
    }

    if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 10-digit phone number is required'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      userId,
      amount,
      phoneNumber,
      paymentApp,
      status: 'pending',
      requestedAt: new Date()
    });

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'withdraw',
      amount,
      status: 'pending',
      description: `Withdrawal request via ${paymentApp} to ${phoneNumber}`,
      paymentApp,
      phoneNumber,
      balanceBefore: user.walletBalance,
      balanceAfter: user.walletBalance, // Will be updated when approved
      referenceId: `WD_${Date.now()}_${userId.toString().slice(-4)}`
    });

    await Promise.all([
      withdrawalRequest.save(),
      transaction.save()
    ]);

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. It will be processed soon.',
      data: {
        withdrawalId: withdrawalRequest._id,
        transactionId: transaction._id,
        amount,
        phoneNumber,
        paymentApp,
        status: 'pending',
        referenceId: transaction.referenceId
      }
    });

  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get wallet balance
 */
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId, 'walletBalance wallet username');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        walletBalance: user.walletBalance || user.wallet || 0,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get wallet transactions
 */
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const query = { userId };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTransactions: total
      }
    });

  } catch (error) {
    console.error('Error getting wallet transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get pending withdrawal requests for user
 */
const getWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const requests = await WithdrawalRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WithdrawalRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        withdrawalRequests: requests,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total
      }
    });

  } catch (error) {
    console.error('Error getting withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create Add Token Request (New Implementation)
 */
const createAddTokenRequest = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    const request = new WalletRequest({
      userId,
      type: 'add_token',
      amount,
      status: 'pending'
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: 'Add token request submitted successfully',
      data: request
    });

  } catch (error) {
    console.error('Create add token request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create Withdraw Token Request (New Implementation)
 */
const createWithdrawTokenRequest = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    // Check if user has sufficient balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentBalance = user.walletBalance || user.wallet || 0;
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${currentBalance}, Requested: ${amount}`
      });
    }

    const request = new WalletRequest({
      userId,
      type: 'withdraw_token',
      amount,
      status: 'pending'
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: 'Withdraw token request submitted successfully',
      data: request
    });

  } catch (error) {
    console.error('Create withdraw token request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get User's Wallet Requests
 */
const getUserWalletRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const requests = await WalletRequest.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('processedBy', 'fullName email');

    const totalRequests = await WalletRequest.countDocuments({ userId });
    const totalPages = Math.ceil(totalRequests / limit);

    res.json({
      success: true,
      message: 'Wallet requests retrieved successfully',
      data: {
        requests,
        pagination: {
          currentPage: page,
          totalPages,
          totalRequests,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user wallet requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Payment Photo (for add token requests)
 */
const getPaymentPhoto = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({
        paymentPhotoUrl: null
      });
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Payment photo retrieved successfully',
      data: {
        paymentPhotoUrl: settings.paymentPhotoUrl
      }
    });

  } catch (error) {
    console.error('Get payment photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  addToken,
  withdrawToken,
  getWalletBalance,
  getWalletTransactions,
  getWithdrawalRequests,
  createAddTokenRequest,
  createWithdrawTokenRequest,
  getUserWalletRequests,
  getPaymentPhoto
};
