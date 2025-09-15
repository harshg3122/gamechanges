require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import all models to ensure they're registered
const User = require("../models/User");
const Admin = require("../models/Admin");
const Round = require("../models/Round");
const Bet = require("../models/Bet");
const WalletRequest = require("../models/WalletRequest");
const Agent = require("../models/Agent");
const QRCode = require("../models/QRCode");
const Settings = require("../models/Settings");

async function initializeLocalDatabase() {
  try {
    console.log("🚀 Starting Local Database Initialization...");

    // Connect to local MongoDB
    const mongoURI =
      process.env.MONGODB_LOCAL || "mongodb://localhost:27017/numbergame";
    console.log(`📡 Connecting to local MongoDB: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB connected successfully");

    // Just ensure collections exist and get stats
    console.log("\n📊 Database Collections Status:");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name).join(", ")
    );

    // Get counts
    const stats = await Promise.all([
      User.countDocuments().catch(() => 0),
      Admin.countDocuments().catch(() => 0),
      Round.countDocuments().catch(() => 0),
      Bet.countDocuments().catch(() => 0),
      WalletRequest.countDocuments().catch(() => 0),
      Agent.countDocuments().catch(() => 0),
      Settings.countDocuments().catch(() => 0),
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
      console.log("\n👤 Creating default admin...");

      const admin = new Admin({
        email: "admin@numbergame.com",
        username: "admin",
        passwordHash: "Admin@123", // Will be hashed by pre-save middleware
        fullName: "System Administrator",
        role: "super-admin",
      });

      await admin.save();
      console.log("✅ Default admin created successfully");
      console.log("📧 Email: admin@numbergame.com");
      console.log("👤 Username: admin");
      console.log("🔑 Password: Admin@123");
    } else {
      console.log(`\n👑 Admin already exists (${adminCount} admins found)`);
    }

    // Create basic settings if none exist
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      console.log("\n⚙️ Creating default settings...");

      const settings = new Settings({
        gameSettings: {
          minBet: 10,
          maxBet: 10000,
          gameDuration: 300, // 5 minutes
          resultDeclarationTime: 60, // 1 minute
        },
        walletSettings: {
          minWithdrawal: 100,
          maxWithdrawal: 50000,
          withdrawalFee: 5,
        },
      });

      await settings.save();
      console.log("✅ Default settings created successfully");
    } else {
      console.log(
        `\n⚙️ Settings already exist (${settingsCount} settings found)`
      );
    }

    console.log("\n🎉 Database initialization completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Start your server: npm run dev");
    console.log("2. Access admin panel with: admin@numbergame.com / Admin@123");
    console.log("3. Your database is ready for the number game application!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the initialization
initializeLocalDatabase();
