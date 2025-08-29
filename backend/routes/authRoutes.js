const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationRules, handleValidationErrors, rateLimiters } = require('../middleware/validation');
const {
  registerUser,
  loginUser,
  loginAdmin,
  refreshToken,
  logout,
  verifyToken
} = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  rateLimiters.auth,
  validationRules.userRegistration,
  handleValidationErrors
], registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', [
  rateLimiters.auth,
  validationRules.userLogin,
  handleValidationErrors
], loginUser);

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/admin/login', [
  rateLimiters.auth,
  validationRules.adminLogin,
  handleValidationErrors
], loginAdmin);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', [
  rateLimiters.general
], refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    User/Admin logout
 * @access  Private
 */
router.post('/logout', [
  rateLimiters.general,
  authMiddleware
], logout);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Private
 */
router.get('/verify', [
  rateLimiters.general,
  authMiddleware
], verifyToken);

module.exports = router;
