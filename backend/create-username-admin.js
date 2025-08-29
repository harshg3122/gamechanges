const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function createAdminWithUsername() {
  try {
    // Connect to database  
    await mongoose.connect('mongodb+srv://963sohamraut:tiIJDdXD8oSGbrfD@game.h39d7ua.mongodb.net/numbergame?retryWrites=true&w=majority&appName=Game');
    console.log('Connected to database');

    // Delete existing admin with username 'admin' or email 'admin@test.com' if exists
    await Admin.deleteMany({
      $or: [
        { username: 'admin' },
        { email: 'admin@test.com' }
      ]
    });
    console.log('Cleared existing admin records');
    
    // Create admin with username (let pre-save hook handle hashing)
    const admin = new Admin({
      email: 'admin@test.com',
      username: 'admin',
      passwordHash: 'admin123', // This will be hashed by pre-save hook
      fullName: 'Test Admin',
      role: 'super-admin',
      permissions: {
        canManageUsers: true,
        canManageWallets: true,
        canSetResults: true,
        canViewReports: true,
        canManageAdmins: true
      },
      isActive: true,
      loginAttempts: 0
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdminWithUsername();
