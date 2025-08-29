// Notification Model - Stores system/user notifications
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'error', 'warning'], default: 'info' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
