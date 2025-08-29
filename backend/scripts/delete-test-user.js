const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/number-game');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const deleteTestUser = async () => {
  await connectDB();
  
  try {
    // Delete test user
    const result = await User.deleteOne({ username: 'testuser' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Test user deleted successfully');
    } else {
      console.log('ℹ️ No test user found to delete');
    }
    
  } catch (error) {
    console.error('❌ Error deleting test user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

deleteTestUser();
