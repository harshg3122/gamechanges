
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
// POST assign QR code to user/admin
router.post('/assign', qrController.assignQRCode);
// POST deactivate QR code
router.post('/deactivate', qrController.deactivateQRCode);
// GET download QR image
router.get('/download/:qrId', qrController.downloadQRCode);

// GET all QR codes
router.get('/', qrController.getAllQRCodes);

// POST generate QR code
router.post('/generate', qrController.generateQRCode);

// POST upload QR image
router.post('/upload', qrController.uploadQRImage);

module.exports = router;
