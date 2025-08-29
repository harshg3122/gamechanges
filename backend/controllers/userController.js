const User = require('../models/User');
const NumberSelection = require('../models/NumberSelection');
const WalletTransaction = require('../models/WalletTransaction');
const WalletRequest = require('../models/WalletRequest');
const Transaction = require('../models/Transaction');
const Result = require('../models/Result');
const { determineNumberClass, isValid3DigitNumber } = require('../utils/numberUtils');

/**
 * Get User Profile
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        referral: user.referral || '',
        walletBalance: user.walletBalance || user.wallet,
        isGuest: user.isGuest || false,
        selectedNumbers: user.selectedNumbers,
        totalWinnings: user.totalWinnings,
        totalLosses: user.totalLosses,
        gamesPlayed: user.gamesPlayed,
        winLossRatio: user.winLossRatio,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update User Profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const { username, email, mobileNumber, referral, password } = req.body;
    const userId = req.user.id;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({
        username: username,
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }
    // Check if email is already taken by another user (only if provided)
    if (email && email.trim() !== '') {
      const existingUser = await User.findOne({
        email: email,
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
    }
    // Check if mobileNumber is already taken by another user (only if provided)
    if (mobileNumber && mobileNumber.trim() !== '') {
      const existingUser = await User.findOne({
        mobileNumber: mobileNumber,
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already taken'
        });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email && email.trim() !== '') updateData.email = email;
    if (mobileNumber && mobileNumber.trim() !== '') updateData.mobileNumber = mobileNumber;
    if (referral && referral.trim() !== '') updateData.referral = referral;
    if (password && password.trim() !== '') updateData.passwordHash = password; // Will be hashed by pre-save middleware

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber,
        referral: updatedUser.referral || '',
        walletBalance: updatedUser.walletBalance || updatedUser.wallet,
        isGuest: updatedUser.isGuest || false
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get User's Selected Numbers History
 */
const getUserSelections = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const selections = await NumberSelection.find({ userId })
      .sort({ placedAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'username');

    // Get round info for all selections
    const roundIds = selections.map(s => s.roundId);
    const rounds = await Result.find({ roundId: { $in: roundIds } });

    // Attach round info to each selection
    const selectionsWithRound = selections.map(sel => {
      const round = rounds.find(r => r.roundId === sel.roundId);
      let timeSlot = null;
      if (round && round.startTime) {
        const date = new Date(round.startTime);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const timeStr = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        timeSlot = timeStr;
      }
      return {
        ...sel.toObject(),
        timeSlot,
        roundInfo: round ? {
          startTime: round.startTime,
          endTime: round.endTime,
          resultDeclared: round.status === 'completed',
          winningNumbers: {
            classA: round.classA?.winningNumber,
            classB: round.classB?.winningNumber,
            classC: round.classC?.winningNumber,
            classD: round.classD?.winningNumber
          }
        } : null
      };
    });

    const totalSelections = await NumberSelection.countDocuments({ userId });
    const totalPages = Math.ceil(totalSelections / limit);

    res.json({
      success: true,
      message: 'Selections retrieved successfully',
      data: {
        selections: selectionsWithRound,
        pagination: {
          currentPage: page,
          totalPages,
          totalSelections,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user selections error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get User's Payment Transactions (Add Money & Withdrawals Only)
 */
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get only payment-related transactions (add_token, withdraw types)
    const walletTransactions = await WalletTransaction.find({ 
      userId,
      type: { $in: ['add_token', 'withdraw', 'deposit', 'withdrawal'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('adminId', 'fullName email');

    // Get wallet requests (add money and withdrawal requests)
    const walletRequests = await WalletRequest.find({ 
      userId,
      type: { $in: ['add_token', 'withdraw', 'withdraw_token'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('processedBy', 'fullName email');

    // Combine only payment transactions (NO game transactions)
    const paymentTransactions = [
      ...walletTransactions.map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        description: t.description || `${t.type === 'add_token' || t.type === 'deposit' ? 'Money Added' : 'Money Withdrawn'}`,
        status: 'completed',
        source: 'wallet',
        paymentMethod: t.paymentMethod || 'N/A',
        createdAt: t.createdAt,
        processedBy: t.adminId
      })),
      ...walletRequests.map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        description: `${t.type === 'add_token' ? 'Add Money Request' : 'Withdrawal Request'} - ${t.status}`,
        status: t.status,
        source: 'wallet_request',
        paymentMethod: t.paymentMethod || 'N/A',
        createdAt: t.createdAt,
        processedBy: t.processedBy
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
     .slice(0, limit);

    const totalWalletTransactions = await WalletTransaction.countDocuments({ 
      userId,
      type: { $in: ['add_token', 'withdraw', 'deposit', 'withdrawal'] }
    });
    const totalWalletRequests = await WalletRequest.countDocuments({ 
      userId,
      type: { $in: ['add_token', 'withdraw', 'withdraw_token'] }
    });
    const totalTransactions = totalWalletTransactions + totalWalletRequests;
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      success: true,
      message: 'Payment transaction history retrieved successfully',
      data: {
        transactions: paymentTransactions,
        summary: {
          totalAddRequests: walletRequests.filter(t => t.type === 'add_token').length,
          totalWithdrawRequests: walletRequests.filter(t => t.type === 'withdraw' || t.type === 'withdraw_token').length,
          totalAddAmount: paymentTransactions.filter(t => t.type === 'add_token' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
          totalWithdrawAmount: paymentTransactions.filter(t => (t.type === 'withdraw' || t.type === 'withdraw_token') && t.status === 'approved').reduce((sum, t) => sum + Math.abs(t.amount), 0)
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get User's Game Results History
 */
const getUserResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Get user's number selections with results
    const selections = await NumberSelection.find({ 
      userId,
      status: { $in: ['win', 'loss'] }
    })
    .sort({ resultProcessedAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

    // Get corresponding results
    const roundIds = selections.map(s => s.roundId);
    const results = await Result.find({ 
      roundId: { $in: roundIds },
      status: 'completed'
    });

    // Combine selections with their results
    const userResults = selections.map(selection => {
      const correspondingResult = results.find(r => r.roundId === selection.roundId);
      return {
        ...selection.toObject(),
        roundResult: correspondingResult ? {
          roundId: correspondingResult.roundId,
          winningNumbers: {
            classA: correspondingResult.classA?.winningNumber,
            classB: correspondingResult.classB?.winningNumber,
            classC: correspondingResult.classC?.winningNumber,
            classD: correspondingResult.classD?.winningNumber
          },
          startTime: correspondingResult.startTime,
          endTime: correspondingResult.endTime,
          resultDeclared: correspondingResult.status === 'completed'
        } : null,
        status: selection.status,
        amount: selection.amount,
        number: selection.number,
        classType: selection.classType,
        resultProcessedAt: selection.resultProcessedAt
      };
    });

    const totalResults = await NumberSelection.countDocuments({ 
      userId,
      status: { $in: ['win', 'loss'] }
    });

    res.json({
      success: true,
      message: 'Game results retrieved successfully',
      data: {
        results: userResults,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalResults / limit),
          totalResults,
          hasNextPage: page < Math.ceil(totalResults / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user results error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// REMOVED DUPLICATE getUserStats FUNCTION - see below for the retained version.

/**
 * Change Password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    // Verify current password
    const isCurrentPasswordValid = await user.checkPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get User Statistics
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with basic stats
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get total selections count
    const totalSelections = await NumberSelection.countDocuments({ user: userId });

    // Get active selections count
    const activeSelections = await NumberSelection.countDocuments({ 
      user: userId, 
      status: 'active' 
    });

    // Get total transactions count
    const totalTransactions = await WalletTransaction.countDocuments({ user: userId });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSelections = await NumberSelection.countDocuments({ 
      user: userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate win rate
    const winRate = user.gamesPlayed > 0 ? 
      ((user.totalWinnings / (user.totalWinnings + user.totalLosses)) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        profile: {
          username: user.username,
          email: user.email,
          joinedDate: user.createdAt,
          lastActive: user.lastLogin
        },
        wallet: {
          currentBalance: user.walletBalance || user.wallet.balance || 0,
          totalDeposits: user.wallet.totalDeposits || 0,
          totalWithdrawals: user.wallet.totalWithdrawals || 0
        },
        gaming: {
          totalGames: user.gamesPlayed || 0,
          totalWinnings: user.totalWinnings || 0,
          totalLosses: user.totalLosses || 0,
          winRate: winRate,
          totalSelections: totalSelections,
          activeSelections: activeSelections,
          recentActivity: recentSelections
        },
        transactions: {
          totalTransactions: totalTransactions
        }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserSelections,
  getWalletTransactions,
  getUserResults,
  getUserStats,
  changePassword
};
