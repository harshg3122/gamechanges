const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/number-game', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const debugUser = async () => {
  await connectDB();
  
  try {
    // Find test user
    const user = await User.findOne({ username: 'testuser' });
    
    if (user) {
      console.log('✅ Test user found:');
      console.log('   ID:', user._id);
      console.log('   Username:', user.username);
      console.log('   Mobile:', user.mobileNumber);
      console.log('   Email:', user.email);
      console.log('   Active:', user.isActive);
      console.log('   Wallet:', user.walletBalance);
      console.log('   PasswordHash exists:', !!user.passwordHash);
      
      // Test password check
      const isPasswordValid = await user.checkPassword('testpass123');
      console.log('   Password check result:', isPasswordValid);
      
    } else {
      console.log('❌ Test user not found');
      
      // List all users
      const allUsers = await User.find({});
      console.log(`Found ${allUsers.length} users in database:`);
      allUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.mobileNumber}) - Active: ${u.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

debugUser();
