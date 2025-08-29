const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Export users as CSV
router.get('/users/csv', reportController.exportUsersCSV);

// Export games as CSV
router.get('/games/csv', reportController.exportGamesCSV);

// Export transactions as CSV
router.get('/transactions/csv', reportController.exportTransactionsCSV);

// Export withdrawals as CSV
router.get('/withdrawals/csv', reportController.exportWithdrawalsCSV);

module.exports = router;
