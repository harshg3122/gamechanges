// Real-time notification broadcast (Socket.IO)
let ioInstance;
exports.setSocketIO = (io) => {
  ioInstance = io;
};

function broadcastNotification(notification) {
  if (ioInstance) {
    ioInstance.emit('notification', notification);
  }
}
// Notification Controller - Handles notification logic
const Notification = require('../models/Notification');

// Fetch all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

// Send notification
exports.sendNotification = async (req, res) => {
  try {
    const { message, type, user, admin } = req.body;
    const notification = await Notification.create({ message, type, user, admin });
    broadcastNotification(notification);
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sending notification' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error marking notification as read' });
  }
};
