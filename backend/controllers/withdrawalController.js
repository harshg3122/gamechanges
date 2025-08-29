const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all withdrawal requests
const getAllWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find().populate('userId', 'username walletBalance');
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching withdrawal requests' });
  }
};

// Get a single withdrawal request by ID
const getWithdrawalById = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id).populate('userId', 'username walletBalance');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching withdrawal request' });
  }
};

// Create a new withdrawal request
const createWithdrawal = async (req, res) => {
  try {
    const { amount, phoneNumber, paymentApp = 'GooglePay' } = req.body;
    const userId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Check if user has sufficient balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      userId,
      amount,
      phoneNumber,
      paymentApp,
      status: 'pending'
    });

    await withdrawalRequest.save();

    // Create a transaction record
    const transaction = new Transaction({
      userId,
      type: 'withdraw',
      amount: -amount,
      status: 'pending',
      description: `Withdrawal request for ${amount} tokens`,
      phoneNumber,
      paymentApp
    });

    await transaction.save();

    res.status(201).json({ 
      success: true, 
      message: 'Withdrawal request created successfully',
      data: withdrawalRequest
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating withdrawal request' });
  }
};

// Process withdrawal (approve/reject)
const processWithdrawal = async (req, res) => {
  try {
    const { requestId, action, reason } = req.body;
    const adminId = req.user.id;

    const request = await WithdrawalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    if (action === 'approve') {
      // Deduct balance from user
      const user = await User.findById(request.userId);
      if (user.walletBalance < request.amount) {
        return res.status(400).json({ success: false, message: 'Insufficient user balance' });
      }

      user.walletBalance -= request.amount;
      await user.save();

      const transaction = new Transaction({
        userId: request.userId,
        type: 'withdraw',
        amount: -request.amount,
        status: 'completed',
        description: `Withdrawal approved: ${request.amount} tokens`,
        processedBy: adminId,
        phoneNumber: request.phoneNumber,
        paymentApp: request.paymentApp
      });

      await transaction.save();

      request.status = 'approved';
      request.processedBy = adminId;
      request.processedAt = new Date();
      request.reason = reason;

      await request.save();

      res.json({ 
        success: true, 
        message: 'Withdrawal approved successfully',
        data: request
      });
    } else if (action === 'reject') {
      request.status = 'rejected';
      request.processedBy = adminId;
      request.processedAt = new Date();
      request.reason = reason;

      await request.save();

      res.json({ 
        success: true, 
        message: 'Withdrawal rejected',
        data: request
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error processing withdrawal request' });
  }
};

// Filter withdrawal requests
const filterWithdrawals = async (req, res) => {
  try {
    const { status, userId, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const requests = await WithdrawalRequest.find(query)
      .populate('userId', 'username walletBalance')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error filtering withdrawal requests' });
  }
};

// Export withdrawals
const exportWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find()
      .populate('userId', 'username walletBalance')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests, message: 'Export data ready' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error exporting withdrawal requests' });
  }
};

// Get withdrawal transaction details
const getWithdrawalTransactionDetails = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id)
      .populate('userId', 'username walletBalance');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    const transaction = await Transaction.findOne({
      userId: request.userId,
      type: 'withdraw',
      amount: -request.amount,
      phoneNumber: request.phoneNumber
    });

    res.json({
      success: true,
      data: {
        withdrawal: request,
        transaction
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching withdrawal transaction details' });
  }
};

module.exports = {
  getAllWithdrawals,
  getWithdrawalById,
  createWithdrawal,
  processWithdrawal,
  filterWithdrawals,
  exportWithdrawals,
  getWithdrawalTransactionDetails
};
