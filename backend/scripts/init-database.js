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

// Database initialization script
const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting Database Initialization...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');

    // Create indexes for better performance
    console.log('📊 Creating database indexes...');
    
    try {
      // User indexes
      try { await User.collection.createIndex({ email: 1 }, { unique: true }); } catch (err) { if (err.code !== 86) throw err; }
      try { await User.collection.createIndex({ username: 1 }, { unique: true }); } catch (err) { if (err.code !== 86) throw err; }
      try { await User.collection.createIndex({ mobileNumber: 1 }, { unique: true }); } catch (err) { if (err.code !== 86) throw err; }
      try { await User.collection.createIndex({ referral: 1 }); } catch (err) { if (err.code !== 86) throw err; }
      
      // Admin indexes
      try { await Admin.collection.createIndex({ email: 1 }, { unique: true }); } catch (err) { if (err.code !== 86) throw err; }
      
      // Round indexes
      try { await Round.collection.createIndex({ gameDate: 1, roundNumber: 1 }, { unique: true }); } catch (err) { if (err.code !== 86) throw err; }
      try { await Round.collection.createIndex({ status: 1 }); } catch (err) { if (err.code !== 86) throw err; }
      
      // Bet indexes
      try { await Bet.collection.createIndex({ userId: 1 }); } catch (err) { if (err.code !== 86) throw err; }
      try { await Bet.collection.createIndex({ roundId: 1 }); } catch (err) { if (err.code !== 86) throw err; }
      try { await Bet.collection.createIndex({ createdAt: -1 }); } catch (err) { if (err.code !== 86) throw err; }
      
      // WalletRequest indexes
      try { await WalletRequest.collection.createIndex({ userId: 1 }); } catch (err) { if (err.code !== 86) throw err; }
      try { await WalletRequest.collection.createIndex({ status: 1 }); } catch (err) { if (err.code !== 86) throw err; }
      
      // Agent indexes
      try { await Agent.collection.createIndex({ referralCode: 1 }, { unique: true }); } catch (err) { if (err.code !== 86) throw err; }
      
      console.log('✅ Database indexes created (skipped existing ones)');
    } catch (error) {
      console.log('⚠️  Index creation completed with some existing indexes skipped');
    }

    // Seed default admin user
    console.log('👤 Checking for admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@numbergame.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      admin = new Admin({
        email: adminEmail,
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
      console.log('✅ Admin user created');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
    } else {
      console.log('✅ Admin user already exists');
    }

    // Seed default settings
    console.log('⚙️ Checking app settings...');
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        minBetAmount: 10,
        maxBetAmount: 10000,
        bettingEnabled: true,
        maintenanceMode: false,
        withdrawalEnabled: true,
        gameRules: {
          roundDuration: 50, // minutes
          resultDelay: 10, // minutes
          dailyRounds: 13
        }
      });
      
      await settings.save();
      console.log('✅ Default settings created');
    } else {
      console.log('✅ Settings already exist');
    }

    // Create sample agent (optional)
    console.log('🤝 Checking for sample agent...');
    let agent = await Agent.findOne({ referralCode: 'SAMPLE001' });
    if (!agent) {
      agent = new Agent({
        fullName: 'Sample Agent',
        mobile: '9999999999',
        password: 'Agent@123',
        referralCode: 'SAMPLE001',
        users: []
      });
      
      await agent.save();
      console.log('✅ Sample agent created');
    } else {
      console.log('✅ Sample agent already exists');
    }

    // Initialize today's rounds if none exist
    console.log('🎯 Checking today\'s rounds...');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const existingRounds = await Round.countDocuments({
      gameDate: {
        $gte: startOfDay,
        $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (existingRounds === 0) {
      console.log('🎯 Creating today\'s rounds...');
      const rounds = [];
      
      // Create 17 rounds starting from 10:00 AM
      for (let i = 0; i < 17; i++) {
        const startTime = new Date(startOfDay);
        startTime.setHours(10 + Math.floor(i * 55 / 60), (i * 55) % 60, 0, 0);
        
        const endTime = new Date(startTime.getTime() + 50 * 60 * 1000); // 50 minutes later
        
        const round = new Round({
          gameDate: startOfDay,
          status: startTime <= new Date() ? 'active' : 'active', // Set all to active for now
          gameClass: 'A', // Use valid enum value
          timeSlot: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`
        });
        
        rounds.push(round);
      }
      
      await Round.insertMany(rounds);
      console.log(`✅ Created ${rounds.length} rounds for today`);
    } else {
      console.log(`✅ Today's rounds already exist (${existingRounds} rounds)`);
    }

    // Database statistics
    console.log('\n📊 Database Statistics:');
    const stats = await Promise.all([
      User.countDocuments(),
      Admin.countDocuments(),
      Round.countDocuments(),
      Bet.countDocuments(),
      WalletRequest.countDocuments(),
      Agent.countDocuments(),
      QRCode.countDocuments(),
      Settings.countDocuments()
    ]);

    console.log(`👥 Users: ${stats[0]}`);
    console.log(`👑 Admins: ${stats[1]}`);
    console.log(`🎯 Rounds: ${stats[2]}`);
    console.log(`🎲 Bets: ${stats[3]}`);
    console.log(`💰 Wallet Requests: ${stats[4]}`);
    console.log(`🤝 Agents: ${stats[5]}`);
    console.log(`📱 QR Codes: ${stats[6]}`);
    console.log(`⚙️ Settings: ${stats[7]}`);

    console.log('\n🎉 Database initialization completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  } finally {
    await mongoose.disconnect();
  }
};

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { initializeDatabase };
