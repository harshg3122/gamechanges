const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationRules, handleValidationErrors, rateLimiters } = require('../middleware/validation');
const {
  getUserProfile,
  updateUserProfile,
  getUserSelections,
  getWalletTransactions,
  getUserResults,
  getUserStats,
  changePassword
} = require('../controllers/userController');

const router = express.Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);
router.use(rateLimiters.general);

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private (User)
 */
router.get('/profile', getUserProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private (User)
 */
router.put('/profile', [
  validationRules.userProfileUpdate,
  handleValidationErrors
], updateUserProfile);

/**
 * @route   GET /api/user/selections
 * @desc    Get user's number selections history
 * @access  Private (User)
 */
router.get('/selections', [
  validationRules.pagination,
  handleValidationErrors
], getUserSelections);

/**
 * @route   GET /api/user/wallet/transactions
 * @desc    Get user's wallet transactions
 * @access  Private (User)
 */
router.get('/wallet/transactions', [
  validationRules.pagination,
  handleValidationErrors
], getWalletTransactions);

/**
 * @route   GET /api/user/results
 * @desc    Get user's game results history
 * @access  Private (User)
 */
router.get('/results', [
  validationRules.pagination,
  handleValidationErrors
], getUserResults);

/**
 * @route   GET /api/user/stats
 * @desc    Get user statistics
 * @access  Private (User)
 */
router.get('/stats', getUserStats);

/**
 * @route   POST /api/user/change-password
 * @desc    Change user password
 * @access  Private (User)
 */
router.post('/change-password', [
  validationRules.changePassword,
  handleValidationErrors
], changePassword);

module.exports = router;
