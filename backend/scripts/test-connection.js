const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection
const testDBConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB connections...');
    
    // Try Atlas connection first
    const atlasURI = process.env.MONGODB_URI;
    if (atlasURI) {
      console.log('📡 Testing Atlas connection...');
      await mongoose.connect(atlasURI);
      console.log('✅ Atlas connection successful!');
      await mongoose.disconnect();
    }
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Try local MongoDB as fallback
    try {
      console.log('🔄 Trying local MongoDB...');
      await mongoose.connect('mongodb://localhost:27017/numbergame');
      console.log('✅ Local MongoDB connection successful!');
      await mongoose.disconnect();
      return true;
    } catch (localError) {
      console.error('❌ Local MongoDB also failed:', localError.message);
      return false;
    }
  }
};

// Test basic server startup without database
const testServerWithoutDB = () => {
  return new Promise((resolve) => {
    console.log('🚀 Testing server startup (without DB)...');
    
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    // Test route
    app.get('/test', (req, res) => {
      res.json({ success: true, message: 'Server is working!' });
    });
    
    const server = app.listen(5001, () => {
      console.log('✅ Test server started on port 5001');
      server.close(() => {
        console.log('✅ Test server stopped successfully');
        resolve(true);
      });
    });
  });
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Backend Connection Tests');
  console.log('===========================');
  
  try {
    // Test 1: Database Connection
    const dbConnected = await testDBConnection();
    
    // Test 2: Basic Server
    await testServerWithoutDB();
    
    // Test 3: Environment Variables
    console.log('🔧 Environment Variables Check:');
    console.log(`- MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
    console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`- ADMIN_EMAIL: ${process.env.ADMIN_EMAIL ? '✅ Set' : '❌ Missing'}`);
    console.log(`- PORT: ${process.env.PORT || 'Using default 5000'}`);
    
    if (dbConnected) {
      console.log('\n🎉 All basic tests passed! MongoDB is accessible.');
      console.log('📝 You can now start the full server with: node server.js');
    } else {
      console.log('\n⚠️  Database connection failed, but server can start without it for basic testing.');
      console.log('💡 Make sure MongoDB Atlas is accessible or start local MongoDB.');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
};

runTests();
