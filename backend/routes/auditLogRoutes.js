const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

// GET all audit logs
router.get('/', auditLogController.getAllAuditLogs);

// GET audit logs by admin
router.get('/admin/:adminId', auditLogController.getAdminAuditLogs);

module.exports = router;
