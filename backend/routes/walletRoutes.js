const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  addToken,
  withdrawToken,
  getWalletBalance,
  getWalletTransactions,
  getWithdrawalRequests,
  createAddTokenRequest,
  createWithdrawTokenRequest,
  getUserWalletRequests,
  getPaymentPhoto
} = require('../controllers/walletController');

/**
 * @route   POST /api/wallet/add-token
 * @desc    Add tokens to wallet
 * @access  Private (User)
 */
router.post('/add-token', authMiddleware, addToken);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Request withdrawal
 * @access  Private (User)
 */
router.post('/withdraw', authMiddleware, withdrawToken);

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance
 * @access  Private (User)
 */
router.get('/balance', authMiddleware, getWalletBalance);

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get wallet transactions
 * @access  Private (User)
 */
router.get('/transactions', authMiddleware, getWalletTransactions);

/**
 * @route   GET /api/wallet/withdrawals
 * @desc    Get withdrawal requests
 * @access  Private (User)
 */
router.get('/withdrawals', authMiddleware, getWithdrawalRequests);

// NEW WALLET REQUEST ENDPOINTS
/**
 * @route   POST /api/wallet/request/add-token
 * @desc    Create add token request
 * @access  Private (User)
 */
router.post('/request/add-token', authMiddleware, createAddTokenRequest);

/**
 * @route   POST /api/wallet/request/withdraw-token
 * @desc    Create withdraw token request
 * @access  Private (User)
 */
router.post('/request/withdraw-token', authMiddleware, createWithdrawTokenRequest);

/**
 * @route   GET /api/wallet/requests
 * @desc    Get user's wallet requests
 * @access  Private (User)
 */
router.get('/requests', authMiddleware, getUserWalletRequests);

/**
 * @route   GET /api/wallet/payment-photo
 * @desc    Get payment photo for add token requests
 * @access  Private (User)
 */
router.get('/payment-photo', authMiddleware, getPaymentPhoto);

module.exports = router;
