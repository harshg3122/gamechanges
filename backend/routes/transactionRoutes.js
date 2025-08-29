const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// GET current user's transactions
router.get('/user', authMiddleware, transactionController.getUserTransactions);

// GET current user's wallet requests
router.get('/wallet-requests', authMiddleware, transactionController.getUserWalletRequests);

module.exports = router;
