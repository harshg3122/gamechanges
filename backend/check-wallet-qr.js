const mongoose = require('mongoose');
const WalletRequest = require('./models/WalletRequest');
const QRCode = require('./models/QRCode');

async function checkWalletAndQR() {
  try {
    await mongoose.connect('mongodb+srv://963sohamraut:tiIJDdXD8oSGbrfD@game.h39d7ua.mongodb.net/numbergame?retryWrites=true&w=majority&appName=Game');
    console.log('Connected to database');

    // Check wallet requests
    const walletRequests = await WalletRequest.find({});
    console.log('Total wallet requests:', walletRequests.length);
    
    if (walletRequests.length > 0) {
      console.log('Sample wallet request:', walletRequests[0]);
    }

    // Check QR codes
    const qrCodes = await QRCode.find({});
    console.log('Total QR codes:', qrCodes.length);
    
    if (qrCodes.length > 0) {
      console.log('Sample QR code:', qrCodes[0]);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWalletAndQR();
