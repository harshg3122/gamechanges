const mongoose = require('mongoose');

// Load all models
require('./models/User');
require('./models/WalletRequest'); 
require('./models/Admin');
require('./models/Transaction');

const processWalletRequestTest = async () => {
  try {
    await mongoose.connect('mongodb+srv://963sohamraut:tiIJDdXD8oSGbrfD@game.h39d7ua.mongodb.net/numbergame');
    console.log('Connected to DB');

    const WalletRequest = mongoose.model('WalletRequest');
    const User = mongoose.model('User');
    const Transaction = mongoose.model('Transaction');
    
    const requestId = '689b91d9385a4030f9d1426d';
    const action = 'approve';
    const adminNotes = 'Payment verified and approved by admin';
    const adminId = '689b89d20ee974af2a4d351f';

    console.log('Finding wallet request...');
    const request = await WalletRequest.findById(requestId).populate('userId');
    
    if (!request) {
      console.log('Wallet request not found');
      return;
    }

    console.log('Request found:', {
      type: request.type,
      amount: request.amount,
      status: request.status,
      userId: request.userId._id
    });

    if (request.status !== 'pending') {
      console.log('This request has already been processed');
      return;
    }

    const user = request.userId;
    console.log('User current balance:', user.walletBalance);
    
    if (action === 'approve') {
      if (request.type === 'add_token') {
        // Add tokens to user balance
        const previousBalance = user.walletBalance || user.wallet || 0;
        user.walletBalance = previousBalance + request.amount;
        user.wallet = user.walletBalance;
        await user.save();

        console.log('Updated user balance from', previousBalance, 'to', user.walletBalance);

        // Create transaction record
        const transaction = new Transaction({
          userId: user._id,
          type: 'add_token',
          amount: request.amount,
          status: 'completed',
          description: `Add token request approved by admin`,
          balanceBefore: previousBalance,
          balanceAfter: user.walletBalance,
          referenceId: `APPROVED_${request._id.toString().slice(-6)}`
        });
        await transaction.save();
        console.log('Transaction created:', transaction.referenceId);
      }

      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }

    request.adminNotes = adminNotes || '';
    request.processedBy = adminId;
    request.processedAt = new Date();
    await request.save();

    console.log('✅ Wallet request processed successfully:', {
      status: request.status,
      processedBy: request.processedBy,
      processedAt: request.processedAt
    });

  } catch (error) {
    console.error('❌ Process wallet request error:', error);
  } finally {
    process.exit(0);
  }
};

processWalletRequestTest();
