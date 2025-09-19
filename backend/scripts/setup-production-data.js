/**
 * Production Data Setup Script
 * Sets up initial data for production deployment
 * Run with: npm run setup-production or node scripts/setup-production-data.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Round = require("../models/Round");
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const { seedGameNumbers } = require("./seedGameNumbers");

async function connectDB() {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      process.env.MONGODB_LOCAL ||
      "mongodb://localhost:27017/numbergame";

    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

async function setupAdminUser() {
  try {
    console.log("👤 Setting up admin user...");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@numbergame.com";
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: adminEmail }, { username: adminUsername }],
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      return existingAdmin;
    }

    // Create new admin (passwordHash will be hashed by pre-save hook)
    const admin = await Admin.create({
      email: adminEmail,
      username: adminUsername,
      passwordHash: adminPassword, // This will be hashed by the pre-save hook
      fullName: "System Administrator",
      role: "super-admin",
      isActive: true,
      permissions: {
        canManageUsers: true,
        canManageWallets: true,
        canSetResults: true,
        canViewReports: true,
        canManageAdmins: true,
      },
    });

    console.log("✅ Admin user created successfully");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Username: ${adminUsername}`);
    console.log(`🔑 Password: ${adminPassword}`);

    return admin;
  } catch (error) {
    console.error("❌ Error setting up admin user:", error);
    throw error;
  }
}

async function setupDailyRounds() {
  try {
    console.log("⏰ Setting up daily rounds...");

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Check if rounds already exist for today
    const existingRounds = await Round.find({
      gameDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    if (existingRounds.length > 0) {
      console.log(`✅ ${existingRounds.length} rounds already exist for today`);
      return existingRounds;
    }

    const timeSlots = [
      "10:00 AM - 11:00 AM",
      "11:00 AM - 12:00 PM",
      "12:00 PM - 01:00 PM",
      "01:00 PM - 02:00 PM",
      "02:00 PM - 03:00 PM",
      "03:00 PM - 04:00 PM",
      "04:00 PM - 05:00 PM",
      "05:00 PM - 06:00 PM",
      "06:00 PM - 07:00 PM",
      "07:00 PM - 08:00 PM",
      "08:00 PM - 09:00 PM",
      "09:00 PM - 10:00 PM",
      "10:00 PM - 11:00 PM",
      "11:00 PM - 12:00 AM",
    ];

    const rounds = [];

    // Create rounds for each time slot
    // Note: We're creating one round per time slot (not per game class)
    // as the new system handles all classes in one round
    for (let i = 0; i < timeSlots.length; i++) {
      const round = {
        gameClass: "A", // Default class, but supports all classes
        timeSlot: timeSlots[i],
        gameDate: startOfDay,
        status: "active",
        totalBets: 0,
        totalAmount: 0,
      };
      rounds.push(round);
    }

    const createdRounds = await Round.insertMany(rounds);
    console.log(`✅ Created ${createdRounds.length} rounds for today`);

    return createdRounds;
  } catch (error) {
    console.error("❌ Error setting up daily rounds:", error);
    throw error;
  }
}

async function setupGameNumbers() {
  try {
    console.log("🎲 Setting up game numbers...");

    // Get current active round or create one
    let currentRound = await Round.findOne({ status: "active" }).sort({
      createdAt: -1,
    });

    if (!currentRound) {
      // Create a default round
      currentRound = await Round.create({
        gameClass: "A",
        timeSlot: "10:00 AM - 11:00 AM",
        status: "active",
      });
      console.log("📅 Created default round for game numbers");
    }

    // Seed game numbers for the current round
    await seedGameNumbers();
    console.log("✅ Game numbers setup completed");
  } catch (error) {
    console.error("❌ Error setting up game numbers:", error);
    throw error;
  }
}

async function displaySetupSummary() {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("🎉 PRODUCTION SETUP COMPLETED");
    console.log("=".repeat(50));

    // Count data
    const adminCount = await Admin.countDocuments({});
    const roundCount = await Round.countDocuments({});
    const activeRounds = await Round.countDocuments({ status: "active" });

    console.log(`👤 Admins: ${adminCount}`);
    console.log(`⏰ Total Rounds: ${roundCount}`);
    console.log(`🟢 Active Rounds: ${activeRounds}`);

    console.log("\n📋 Next Steps:");
    console.log("1. Start the server: npm start");
    console.log("2. Access admin panel: http://localhost:5000/admin");
    console.log("3. Login with admin credentials shown above");
    console.log("4. The auto-result job will handle result declarations");

    console.log("\n🔧 API Endpoints:");
    console.log("- Admin Panel: /api/admin-panel/*");
    console.log("- Results: /api/results/*");
    console.log("- Current Round: /api/admin-panel/results/current-round");
    console.log("- Declare Result: POST /api/admin-panel/results/declare");

    console.log("\n" + "=".repeat(50));
  } catch (error) {
    console.error("❌ Error displaying setup summary:", error);
  }
}

async function main() {
  try {
    console.log("🚀 Starting production data setup...\n");

    await connectDB();

    // Setup core data
    await setupAdminUser();
    await setupDailyRounds();
    await setupGameNumbers();

    // Display summary
    await displaySetupSummary();

    console.log("✅ Production setup completed successfully!");
  } catch (error) {
    console.error("❌ Production setup failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Database connection closed");
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = {
  setupAdminUser,
  setupDailyRounds,
  setupGameNumbers,
};
