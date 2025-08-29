// AuditLog Controller - Handles audit log logic
const AuditLog = require('../models/AuditLog');

// Utility to log an admin action
exports.logAction = async (adminId, action, details = {}) => {
  try {
    await AuditLog.create({ admin: adminId, action, details });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

// Fetch all audit logs
exports.getAllAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('admin', 'fullName email').sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching audit logs' });
  }
};

// Fetch audit logs for a specific admin
exports.getAdminAuditLogs = async (req, res) => {
  try {
    const { adminId } = req.params;
    const logs = await AuditLog.find({ admin: adminId }).sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching admin audit logs' });
  }
};
