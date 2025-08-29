const mongoose = require('mongoose');
const WalletRequest = require('./models/WalletRequest');
const QRCode = require('./models/QRCode');
const User = require('./models/User');
const Admin = require('./models/Admin');

async function createTestData() {
  try {
    await mongoose.connect('mongodb+srv://963sohamraut:tiIJDdXD8oSGbrfD@game.h39d7ua.mongodb.net/numbergame?retryWrites=true&w=majority&appName=Game');
    console.log('Connected to database');

    // Get first user and admin
    const user = await User.findOne({});
    const admin = await Admin.findOne({});
    
    console.log('User found:', user ? user.username : 'None');
    console.log('Admin found:', admin ? admin.username : 'None');

    if (!user) {
      console.log('No users found, cannot create wallet requests');
    } else {
      // Create sample wallet requests
      const addTokenRequest = new WalletRequest({
        userId: user._id,
        type: 'add_token',
        amount: 500,
        status: 'pending'
      });

      const withdrawRequest = new WalletRequest({
        userId: user._id,
        type: 'withdraw_token', 
        amount: 200,
        status: 'pending'
      });

      await addTokenRequest.save();
      await withdrawRequest.save();
      
      console.log('✅ Created wallet requests successfully');
    }

    if (!admin) {
      console.log('No admin found, cannot create QR codes');
    } else {
      // Create sample QR codes with proper fields
      const upiQR = new QRCode({
        paymentMethod: 'UPI',
        upiId: 'admin@paytm',
        description: 'Main UPI QR Code',
        qrCodeImage: '/uploads/qr-codes/sample-upi.jpg',
        createdBy: admin._id,
        isActive: true
      });

      const phonepeQR = new QRCode({
        paymentMethod: 'PHONEPE',
        upiId: 'admin@phonepe',
        description: 'PhonePe Payment QR',
        qrCodeImage: '/uploads/qr-codes/sample-phonepe.jpg', 
        createdBy: admin._id,
        isActive: true
      });

      await upiQR.save();
      await phonepeQR.save();

      console.log('✅ Created QR codes successfully');
    }

    console.log('✅ Test data creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestData();
