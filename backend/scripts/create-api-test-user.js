const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function createKnownTestUser() {
  try {
    console.log('📋 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing test user if exists
    console.log('\n🗑️  Cleaning up existing test user...');
    await User.deleteOne({ username: 'apitestuser' });

    console.log('\n👤 Creating new test user...');
    const testUser = new User({
      username: 'apitestuser',
      email: 'apitest@example.com',
      mobileNumber: '9999888777',
      passwordHash: 'testpass123', // Let the model hash it
      walletBalance: 1000,
      isActive: true,
      role: 'user'
    });

    await testUser.save();
    console.log('✅ Test user created successfully');

    // Verify the password works
    console.log('\n🔍 Verifying password...');
    const savedUser = await User.findOne({ username: 'apitestuser' });
    const isMatch = await savedUser.checkPassword('testpass123');
    console.log(`Password verification: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);

    console.log('\n📊 Test user details:');
    console.log({
      username: savedUser.username,
      email: savedUser.email,
      mobile: savedUser.mobileNumber,
      balance: savedUser.walletBalance,
      isActive: savedUser.isActive
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createKnownTestUser();
