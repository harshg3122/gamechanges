const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function listAllUsers() {
  try {
    console.log('📋 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Listing all users...');
    const users = await User.find({}, {
      _id: 1,
      username: 1,
      email: 1,
      mobileNumber: 1,
      isActive: 1,
      passwordHash: 1
    });

    console.log(`\n📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email || 'Not set'}`);
      console.log(`   Mobile: ${user.mobileNumber || 'Not set'}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Has Password: ${!!user.passwordHash}`);
    });

    if (users.length === 0) {
      console.log('\n⚠️  No users found in database!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

listAllUsers();
