const mongoose = require('mongoose');
const User = require('../models/User');

// Use existing connection or create new one
const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Using existing MongoDB connection');
      return;
    }
    
    // Try cloud database first (from create-username-admin.js)
    try {
      const conn = await mongoose.connect('mongodb+srv://963sohamraut:tiIJDdXD8oSGbrfD@game.h39d7ua.mongodb.net/numbergame?retryWrites=true&w=majority&appName=Game');
      console.log(`✅ MongoDB connected (cloud): ${conn.connection.host}`);
      return;
    } catch (cloudError) {
      console.log('⚠️ Cloud connection failed, trying local...');
    }
    
    // Try local connection
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/number-game');
    console.log(`✅ MongoDB connected (local): ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Try alternative connection method
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/number-game');
      console.log('✅ Connected via 127.0.0.1');
    } catch (err2) {
      console.error('❌ Alternative connection failed:', err2.message);
      process.exit(1);
    }
  }
};

// Add balance to user by mobile number or username
const addBalance = async (identifier, amount) => {
  try {
    // Find user by mobile number or username
    const user = await User.findOne({
      $or: [
        { mobileNumber: identifier },
        { username: identifier }
      ]
    });

    if (!user) {
      console.error(`❌ User not found: ${identifier}`);
      return false;
    }

    // Update wallet balance
    const previousBalance = user.walletBalance || 0;
    user.walletBalance = previousBalance + amount;
    await user.save();

    console.log(`✅ Balance updated for ${user.username}:`);
    console.log(`   Previous: ₹${previousBalance}`);
    console.log(`   Added: ₹${amount}`);
    console.log(`   Current: ₹${user.walletBalance}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error updating balance for ${identifier}:`, error.message);
    return false;
  }
};

// Main function
const main = async () => {
  console.log('🎯 Quick Balance Update Script Started...\n');
  
  await connectDB();
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 2) {
    // Single user balance update: node quick-balance.js username 1000
    const [identifier, amount] = args;
    await addBalance(identifier, parseInt(amount));
  } else if (args.length === 0) {
    // Batch update for test users
    const updates = [
      { identifier: 'BetterOneTest', amount: 20000 },
      { identifier: 'BetterTwoTest', amount: 30000 },
      { identifier: 'BetterThreeTest', amount: 10000 },
      { identifier: 'BetterFourTest', amount: 20000 },
      { identifier: 'BetterFiveTest', amount: 50000 }
    ];
    
    console.log('📊 Batch updating balances for test users...\n');
    
    for (const update of updates) {
      await addBalance(update.identifier, update.amount);
      console.log(''); // Empty line for readability
    }
  } else {
    console.log('Usage:');
    console.log('  Single update: node quick-balance.js <username/mobile> <amount>');
    console.log('  Batch update: node quick-balance.js');
  }
  
  console.log('\n🎯 Script completed!');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script error:', error.message);
  process.exit(1);
});
