const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function debugPassword() {
  try {
    console.log('📋 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Finding testuser1...');
    const user = await User.findOne({ username: 'testuser1' });
    
    if (!user) {
      console.log('❌ User testuser1 not found');
      return;
    }

    console.log('✅ User found:', {
      username: user.username,
      email: user.email,
      mobile: user.mobileNumber,
      hasPassword: !!user.passwordHash
    });

    // Test different common passwords
    const testPasswords = [
      'password123',
      'testpass123', 
      'password',
      '123456',
      'test123',
      'password',
      'user123'
    ];

    console.log('\n🧪 Testing passwords...');
    for (const pwd of testPasswords) {
      try {
        const isMatch = await bcrypt.compare(pwd, user.passwordHash);
        console.log(`   ${pwd}: ${isMatch ? '✅ MATCH' : '❌ No match'}`);
        if (isMatch) {
          console.log(`\n🎉 Found working password: "${pwd}"`);
          break;
        }
      } catch (error) {
        console.log(`   ${pwd}: ❌ Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugPassword();
