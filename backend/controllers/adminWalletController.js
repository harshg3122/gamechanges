const WalletRequest = require('../models/WalletRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Get all wallet requests for admin
 */
const getAllWalletRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // pending, approved, rejected
    const type = req.query.type; // add_token, withdraw_token
    
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await WalletRequest.find(filter)
      .populate('userId', 'username email mobileNumber walletBalance')
      .populate('processedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalRequests = await WalletRequest.countDocuments(filter);
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
    console.error('Get all wallet requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Process wallet request (approve/reject)
 */
const processWalletRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve' or 'reject'
    const adminId = req.admin.adminId;

    console.log('Processing wallet request:', { requestId, action, adminId });

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    const request = await WalletRequest.findById(requestId).populate('userId');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Wallet request not found'
      });
    }

    console.log('Found request:', { type: request.type, amount: request.amount, status: request.status });

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    const user = request.userId;
    console.log('User balance before:', user.walletBalance);
    
    if (action === 'approve') {
      if (request.type === 'add_token') {
        // Add tokens to user balance
        const previousBalance = user.walletBalance || user.wallet || 0;
        user.walletBalance = previousBalance + request.amount;
        user.wallet = user.walletBalance;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
          userId: user._id,
          type: 'add_token',
          amount: request.amount,
          status: 'completed',
          description: `Add token request approved by admin`,
          balanceBefore: previousBalance,
          balanceAfter: user.walletBalance,
          referenceId: `APPROVED_${request._id.toString().slice(-6)}`
        });
        await transaction.save();

      } else if (request.type === 'withdraw_token') {
        // Deduct tokens from user balance
        const previousBalance = user.walletBalance || user.wallet || 0;
        if (previousBalance < request.amount) {
          return res.status(400).json({
            success: false,
            message: 'User has insufficient balance for this withdrawal'
          });
        }

        user.walletBalance = previousBalance - request.amount;
        user.wallet = user.walletBalance;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
          userId: user._id,
          type: 'withdraw',
          amount: -request.amount,
          status: 'completed',
          description: `Withdraw token request approved by admin`,
          balanceBefore: previousBalance,
          balanceAfter: user.walletBalance,
          referenceId: `WITHDRAWAL_${request._id.toString().slice(-6)}`
        });
        await transaction.save();
      }

      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }

    request.adminNotes = adminNotes || '';
    request.processedBy = adminId;
    request.processedAt = new Date();
    await request.save();

    console.log('Request processed successfully:', { status: request.status, adminId });

    res.json({
      success: true,
      message: `Wallet request ${action}d successfully`,
      data: request
    });

  } catch (error) {
    console.error('Process wallet request error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get app settings
const getAppSettings = async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        minBetAmount: 10,
        maxBetAmount: 10000,
        bettingEnabled: true,
        maintenanceMode: false,
        withdrawalEnabled: true,
        numberLockThreshold: 30
      });
    }

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get app settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching app settings'
    });
  }
};

// Update app settings
const updateAppSettings = async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const updates = req.body;
    
    let settings = await Settings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'App settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update app settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating app settings'
    });
  }
};

module.exports = {
  getWalletRequests: getAllWalletRequests,
  processWalletRequest,
  getAppSettings,
  updateAppSettings
};
