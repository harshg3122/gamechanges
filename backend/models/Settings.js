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
  numberLockThreshold: {
    type: Number,
    default: 30,
    description: 'Percentage threshold for locking numbers based on betting amounts'
  },
  minBetAmount: { type: Number, default: 10 },
  maxBetAmount: { type: Number, default: 10000 },
  bettingEnabled: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  withdrawalEnabled: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
}); 

module.exports = mongoose.model('Settings', settingsSchema);
