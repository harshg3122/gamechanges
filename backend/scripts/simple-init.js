require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models to ensure they're registered
const User = require('../models/User');
const Admin = require('../models/Admin');
const Round = require('../models/Round');
const Bet = require('../models/Bet');
const WalletRequest = require('../models/WalletRequest');
const Agent = require('../models/Agent');
const QRCode = require('../models/QRCode');
const Settings = require('../models/Settings');

async function initializeDatabase() {
  try {
    console.log('🚀 Starting Simple Database Initialization...');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Admin:Admin123@cluster0.mongodb.net/numbergame?retryWrites=true&w=majority');
    console.log('✅ MongoDB connected successfully');

    // Just ensure collections exist and get stats
    console.log('\n📊 Database Collections Status:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));

    // Get counts
    const stats = await Promise.all([
      User.countDocuments().catch(() => 0),
      Admin.countDocuments().catch(() => 0),
      Round.countDocuments().catch(() => 0),
      Bet.countDocuments().catch(() => 0),
      WalletRequest.countDocuments().catch(() => 0),
      Agent.countDocuments().catch(() => 0),
      Settings.countDocuments().catch(() => 0)
    ]);

    console.log(`👥 Users: ${stats[0]}`);
    console.log(`👑 Admins: ${stats[1]}`);
    console.log(`🎯 Rounds: ${stats[2]}`);
    console.log(`🎲 Bets: ${stats[3]}`);
    console.log(`💰 Wallet Requests: ${stats[4]}`);
    console.log(`🤝 Agents: ${stats[5]}`);
    console.log(`⚙️ Settings: ${stats[6]}`);

    // Create basic admin if none exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('\n👤 Creating default admin...');
      const passwordHash = await bcrypt.hash('Admin@123', 12);
      
      const admin = new Admin({
        email: 'admin@numbergame.com',
        passwordHash,
        fullName: 'System Administrator',
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
      console.log('✅ Default admin created');
      console.log('📧 Email: admin@numbergame.com');
      console.log('🔑 Password: Admin@123');
    } else {
      console.log(`✅ Found ${adminCount} admin(s) in database`);
    }

    // Create basic settings if none exist
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      console.log('\n⚙️ Creating default settings...');
      const settings = new Settings({
        minBetAmount: 10,
        maxBetAmount: 10000,
        bettingEnabled: true,
        maintenanceMode: false,
        withdrawalEnabled: true,
        gameRules: {
          roundDuration: 50,
          resultDelay: 10,
          dailyRounds: 13
        }
      });
      
      await settings.save();
      console.log('✅ Default settings created');
    } else {
      console.log(`✅ Found ${settingsCount} settings record(s) in database`);
    }

    console.log('\n🎉 Database is ready! You can now start the server.');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the initialization
initializeDatabase();
