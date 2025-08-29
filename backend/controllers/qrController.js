// Upload QR image
exports.uploadQRImage = async (req, res) => {
  try {
    const { imageData } = req.body;
    const adminId = req.user.id;
    let qr = await QRCode.findOne();
    if (qr) {
      qr.imageData = imageData;
      qr.uploadedBy = adminId;
      qr.updatedAt = new Date();
      await qr.save();
    } else {
      qr = new QRCode({ imageData, uploadedBy: adminId });
      await qr.save();
    }
    res.json({ success: true, message: 'QR image uploaded', data: qr });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error uploading QR image' });
  }
};
// Get all QR codes
exports.getAllQRCodes = async (req, res) => {
  try {
    const qrcodes = await QRCode.find();
    res.json({ success: true, data: qrcodes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching QR codes' });
  }
};

// Generate QR code
exports.generateQRCode = async (req, res) => {
  try {
    // Example: generate a new QR code (actual implementation may vary)
    const { data } = req.body;
    // You may use a QR code library here to generate imageData
    const qr = new QRCode({ imageData: data, uploadedBy: req.user.id });
    await qr.save();
    res.json({ success: true, message: 'QR code generated', data: qr });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error generating QR code' });
  }
};
// Assign QR code to user/admin
exports.assignQRCode = async (req, res) => {
  try {
    const { qrId, userId, adminId } = req.body;
    const qr = await QRCode.findById(qrId);
    if (!qr) return res.status(404).json({ success: false, message: 'QR code not found' });
    if (userId) qr.assignedToUser = userId;
    if (adminId) qr.assignedToAdmin = adminId;
    qr.updatedAt = new Date();
    await qr.save();
    res.json({ success: true, message: 'QR code assigned', data: qr });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error assigning QR code' });
  }
};

// Deactivate QR code
exports.deactivateQRCode = async (req, res) => {
  try {
    const { qrId } = req.body;
    const qr = await QRCode.findById(qrId);
    if (!qr) return res.status(404).json({ success: false, message: 'QR code not found' });
    qr.status = 'inactive';
    qr.updatedAt = new Date();
    await qr.save();
    res.json({ success: true, message: 'QR code deactivated', data: qr });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deactivating QR code' });
  }
};

// Download QR image
exports.downloadQRCode = async (req, res) => {
  try {
    const { qrId } = req.params;
    const qr = await QRCode.findById(qrId);
    if (!qr || !qr.imageData) return res.status(404).json({ success: false, message: 'QR code image not found' });
    // Assuming imageData is a base64 string with mime type prefix
    const matches = qr.imageData.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ success: false, message: 'Invalid image data' });
    const mimeType = matches[1];
    const base64Data = matches[2];
    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', 'attachment; filename="qr_code.' + mimeType.split('/')[1] + '"');
    res.send(imgBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error downloading QR code image' });
  }
};
const QRCode = require('../models/QRCode');
const Admin = require('../models/Admin');

// Admin uploads/updates QR code
exports.uploadQRCode = async (req, res) => {
  try {
    const { imageData } = req.body;
    const adminId = req.user.id;
    let qr = await QRCode.findOne();
    if (qr) {
      qr.imageData = imageData;
      qr.uploadedBy = adminId;
      qr.updatedAt = new Date();
      await qr.save();
    } else {
      qr = new QRCode({ imageData, uploadedBy: adminId });
      await qr.save();
    }
    res.json({ success: true, message: 'QR code updated', data: qr });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error uploading QR code' });
  }
};

// User fetches current QR code
exports.getQRCode = async (req, res) => {
  try {
    const qr = await QRCode.findOne().sort({ updatedAt: -1 });
    if (!qr) return res.status(404).json({ success: false, message: 'No QR code found' });
    res.json({ success: true, data: qr });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching QR code' });
  }
};
