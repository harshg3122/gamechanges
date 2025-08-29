const QRCode = require('../models/QRCode');
const Settings = require('../models/Settings');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for QR code image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/qr-codes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all QR codes
const getAllQRCodes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // 'active', 'inactive'
    const paymentMethod = req.query.paymentMethod; // 'UPI', 'PHONEPE', 'PAYTM', 'GPAY'

    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query.isActive = status === 'active';
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const [qrCodes, totalQRCodes] = await Promise.all([
      QRCode.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QRCode.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        qrCodes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalQRCodes / limit),
          totalQRCodes,
          hasNextPage: page < Math.ceil(totalQRCodes / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching QR codes'
    });
  }
};

// Create new QR code
const createQRCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentMethod, upiId, description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'QR code image is required'
      });
    }

    // Check if payment method already has an active QR code
    const existingQR = await QRCode.findOne({ 
      paymentMethod, 
      isActive: true 
    });

    if (existingQR) {
      return res.status(400).json({
        success: false,
        message: `Active QR code already exists for ${paymentMethod}`
      });
    }

    const qrCode = new QRCode({
      paymentMethod,
      upiId,
      description,
      qrCodeImage: `/uploads/qr-codes/${req.file.filename}`,
      createdBy: req.admin.adminId
    });

    await qrCode.save();

    res.status(201).json({
      success: true,
      message: 'QR code created successfully',
      data: { qrCode }
    });
  } catch (error) {
    console.error('Create QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating QR code'
    });
  }
};

// Update QR code
const updateQRCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { qrCodeId } = req.params;
    const updates = req.body;

    const qrCode = await QRCode.findById(qrCodeId);
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    // If updating payment method, check for conflicts
    if (updates.paymentMethod && updates.paymentMethod !== qrCode.paymentMethod) {
      const existingQR = await QRCode.findOne({ 
        paymentMethod: updates.paymentMethod, 
        isActive: true,
        _id: { $ne: qrCodeId }
      });

      if (existingQR) {
        return res.status(400).json({
          success: false,
          message: `Active QR code already exists for ${updates.paymentMethod}`
        });
      }
    }

    // Handle image update
    if (req.file) {
      // Delete old image
      if (qrCode.qrCodeImage) {
        const oldImagePath = path.join(__dirname, '..', qrCode.qrCodeImage);
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.warn('Failed to delete old QR image:', error);
        }
      }
      updates.qrCodeImage = `/uploads/qr-codes/${req.file.filename}`;
    }

    const updatedQRCode = await QRCode.findByIdAndUpdate(
      qrCodeId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'QR code updated successfully',
      data: { qrCode: updatedQRCode }
    });
  } catch (error) {
    console.error('Update QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating QR code'
    });
  }
};

// Toggle QR code status
const toggleQRCodeStatus = async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const qrCode = await QRCode.findById(qrCodeId);
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    // If activating, check if another QR for same payment method is active
    if (!qrCode.isActive) {
      const existingActive = await QRCode.findOne({ 
        paymentMethod: qrCode.paymentMethod,
        isActive: true,
        _id: { $ne: qrCodeId }
      });

      if (existingActive) {
        return res.status(400).json({
          success: false,
          message: `Another QR code for ${qrCode.paymentMethod} is already active`
        });
      }
    }

    qrCode.isActive = !qrCode.isActive;
    await qrCode.save();

    res.json({
      success: true,
      message: `QR code ${qrCode.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        qrCodeId: qrCode._id,
        isActive: qrCode.isActive
      }
    });
  } catch (error) {
    console.error('Toggle QR code status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating QR code status'
    });
  }
};

// Delete QR code
const deleteQRCode = async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const qrCode = await QRCode.findById(qrCodeId);
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    // Delete associated image file
    if (qrCode.qrCodeImage) {
      const imagePath = path.join(__dirname, '..', qrCode.qrCodeImage);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.warn('Failed to delete QR image:', error);
      }
    }

    await QRCode.findByIdAndDelete(qrCodeId);

    res.json({
      success: true,
      message: 'QR code deleted successfully'
    });
  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting QR code'
    });
  }
};

// Get active QR codes for public use
const getActiveQRCodes = async (req, res) => {
  try {
    const qrCodes = await QRCode.find({ isActive: true })
      .select('paymentMethod upiId qrCodeImage description')
      .sort({ paymentMethod: 1 });

    res.json({
      success: true,
      data: { qrCodes }
    });
  } catch (error) {
    console.error('Get active QR codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active QR codes'
    });
  }
};

// Set primary QR code for payment method
const setPrimaryQRCode = async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const qrCode = await QRCode.findById(qrCodeId);
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    // Deactivate all other QR codes for this payment method
    await QRCode.updateMany(
      { 
        paymentMethod: qrCode.paymentMethod,
        _id: { $ne: qrCodeId }
      },
      { isActive: false }
    );

    // Activate this QR code
    qrCode.isActive = true;
    await qrCode.save();

    res.json({
      success: true,
      message: 'QR code set as primary successfully',
      data: { qrCode }
    });
  } catch (error) {
    console.error('Set primary QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting primary QR code'
    });
  }
};

// Get QR code statistics
const getQRCodeStats = async (req, res) => {
  try {
    const stats = await QRCode.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    const totalQRCodes = await QRCode.countDocuments();
    const activeQRCodes = await QRCode.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        totalQRCodes,
        activeQRCodes,
        byPaymentMethod: stats
      }
    });
  } catch (error) {
    console.error('Get QR code stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching QR code statistics'
    });
  }
};

module.exports = {
  upload,
  getAllQRCodes,
  createQRCode,
  updateQRCode,
  toggleQRCodeStatus,
  deleteQRCode,
  getActiveQRCodes,
  setPrimaryQRCode,
  getQRCodeStats
};
