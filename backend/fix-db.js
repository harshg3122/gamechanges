require('dotenv').config();
const mongoose = require('mongoose');

async function fixDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_LOCAL;
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Drop existing email index
    const collection = mongoose.connection.db.collection('users');
    
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped old email index');
    } catch (err) {
      console.log('Email index might not exist, continuing...');
    }
    
    // Create new sparse unique index for email
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('✅ Created new sparse email index');
    
    console.log('Database fixed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixDatabase();
