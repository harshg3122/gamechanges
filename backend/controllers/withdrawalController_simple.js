// Simple withdrawal controller for testing
const getAllWithdrawals = async (req, res) => {
  res.json({ success: true, data: [], message: 'Test endpoint' });
};

const getWithdrawalById = async (req, res) => {
  res.json({ success: true, data: null, message: 'Test endpoint' });
};

const createWithdrawal = async (req, res) => {
  res.json({ success: true, message: 'Test endpoint' });
};

const processWithdrawal = async (req, res) => {
  res.json({ success: true, message: 'Test endpoint' });
};

const filterWithdrawals = async (req, res) => {
  res.json({ success: true, data: [], message: 'Test endpoint' });
};

const exportWithdrawals = async (req, res) => {
  res.json({ success: true, data: [], message: 'Test endpoint' });
};

const getWithdrawalTransactionDetails = async (req, res) => {
  res.json({ success: true, data: null, message: 'Test endpoint' });
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
