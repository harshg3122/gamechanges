// Settings Model - Stores system configuration
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  gameTimings: { type: String },
  withdrawalLimits: { type: Number },
  contactInfo: { type: String },
  paymentPhotoUrl: {
    type: String,
    default: null,
    description: 'URL for payment QR code or payment instruction photo'
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
