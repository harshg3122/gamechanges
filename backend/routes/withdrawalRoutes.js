
const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET all withdrawal requests
router.get('/', withdrawalController.getAllWithdrawals);

// Filter withdrawal requests by user, status, date range (MUST be before /:id)
router.get('/filter', withdrawalController.filterWithdrawals);

// Export withdrawal requests (CSV/Excel) (MUST be before /:id)
router.get('/export', withdrawalController.exportWithdrawals);

// POST create a new withdrawal request (user action)
router.post('/', authMiddleware, withdrawalController.createWithdrawal);

// POST process withdrawal (approve/reject)
router.post('/process', authMiddleware, withdrawalController.processWithdrawal);

// GET a single withdrawal request by ID
router.get('/:id', withdrawalController.getWithdrawalById);

// GET withdrawal transaction details
router.get('/:id/transaction', withdrawalController.getWithdrawalTransactionDetails);

module.exports = router;
