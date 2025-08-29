const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['UPI', 'PHONEPE', 'PAYTM', 'GPAY']
  },
  upiId: {
    type: String,
    required: [true, 'UPI ID is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  qrCodeImage: {
    type: String, // File path to uploaded image
    required: [true, 'QR code image is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Created by admin is required']
  },
  // Legacy fields for backward compatibility
  imageData: {
    type: String // base64 or image URL
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Index for efficient queries
qrCodeSchema.index({ paymentMethod: 1, isActive: 1 });
qrCodeSchema.index({ isActive: 1 });
qrCodeSchema.index({ createdBy: 1 });

// Ensure only one active QR per payment method
qrCodeSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('isActive')) {
    if (this.isActive) {
      // Deactivate other QR codes for the same payment method
      await this.constructor.updateMany(
        { 
          paymentMethod: this.paymentMethod, 
          _id: { $ne: this._id } 
        },
        { isActive: false }
      );
    }
  }
  next();
});

module.exports = mongoose.model('QRCode', qrCodeSchema);
