const { Parser } = require('json2csv');
const User = require('../models/User');
const Game = require('../models/Game');
const Transaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// Export users as CSV
exports.exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    const fields = ['_id', 'username', 'email', 'mobileNumber', 'status', 'wallet'];
    const parser = new Parser({ fields });
    const csv = parser.parse(users);
    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error exporting users' });
  }
};

// Export games as CSV
exports.exportGamesCSV = async (req, res) => {
  try {
    const games = await Game.find();
    const fields = ['_id', 'name', 'status', 'startTime', 'endTime'];
    const parser = new Parser({ fields });
    const csv = parser.parse(games);
    res.header('Content-Type', 'text/csv');
    res.attachment('games.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error exporting games' });
  }
};

// Export transactions as CSV
exports.exportTransactionsCSV = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    const fields = ['_id', 'userId', 'type', 'amount', 'source', 'description', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(transactions);
    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error exporting transactions' });
  }
};

// Export withdrawals as CSV
exports.exportWithdrawalsCSV = async (req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.find();
    const fields = ['_id', 'userId', 'amount', 'status', 'createdAt', 'updatedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(withdrawals);
    res.header('Content-Type', 'text/csv');
    res.attachment('withdrawals.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error exporting withdrawals' });
  }
};
