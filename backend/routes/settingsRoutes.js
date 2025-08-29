const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// GET system settings
router.get('/', settingsController.getSettings);

// PUT update system settings
router.put('/', settingsController.updateSettings);

module.exports = router;
