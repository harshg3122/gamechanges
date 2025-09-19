/**
 * Seed Script for Game Numbers
 * Creates 200 triple digit numbers (160 locked) and 10 single digit numbers
 * Run with: node scripts/seedGameNumbers.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const TripleDigit = require("../models/TripleDigit");
const SingleDigit = require("../models/SingleDigit");
const Round = require("../models/Round");
const {
  generateTripleDigitNumbers,
  generateSingleDigitNumbers,
} = require("../utils/numberGenerator");

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

async function seedGameNumbers() {
  try {
    console.log("🌱 Starting game numbers seeding...");

    // Get or create a current round
    let currentRound = await Round.findOne({ status: "active" });

    if (!currentRound) {
      // Create a default round for seeding
      currentRound = new Round({
        gameClass: "A",
        timeSlot: "10:00 AM - 11:00 AM",
        status: "active",
      });
      await currentRound.save();
      console.log("📅 Created new round for seeding:", currentRound._id);
    }

    console.log("🎯 Using round:", currentRound._id);

    // Clear existing numbers for this round
    await TripleDigit.deleteMany({ roundId: currentRound._id });
    await SingleDigit.deleteMany({ roundId: currentRound._id });
    console.log("🧹 Cleared existing numbers");

    // Generate triple digit numbers
    console.log("🔢 Generating 200 triple digit numbers...");
    const tripleDigitNumbers = generateTripleDigitNumbers();

    // Prepare triple digit documents for insertion
    const tripleDigitDocs = tripleDigitNumbers.map((td) => ({
      roundId: currentRound._id,
      number: td.number,
      tokens: td.tokens,
      sumDigits: td.sumDigits,
      lastDigit: td.lastDigit,
      locked: td.locked,
      classType: td.classType,
    }));

    // Insert triple digits
    const insertedTriples = await TripleDigit.insertMany(tripleDigitDocs);
    console.log(`✅ Inserted ${insertedTriples.length} triple digit numbers`);

    const lockedTriples = insertedTriples.filter((td) => td.locked);
    console.log(`🔒 Locked ${lockedTriples.length} triple digits (80%)`);
    console.log(
      `🔓 Unlocked ${
        insertedTriples.length - lockedTriples.length
      } triple digits (20%)`
    );

    // Generate single digit numbers
    console.log("🔢 Generating 10 single digit numbers...");
    const singleDigitNumbers = generateSingleDigitNumbers();

    // Prepare single digit documents for insertion
    const singleDigitDocs = singleDigitNumbers.map((sd) => ({
      roundId: currentRound._id,
      number: sd.number,
      tokens: sd.tokens,
      locked: sd.locked,
    }));

    // Insert single digits
    const insertedSingles = await SingleDigit.insertMany(singleDigitDocs);
    console.log(`✅ Inserted ${insertedSingles.length} single digit numbers`);

    const lockedSingles = insertedSingles.filter((sd) => sd.locked);
    console.log(`🔒 Locked ${lockedSingles.length} single digits`);
    console.log(
      `🔓 Unlocked ${
        insertedSingles.length - lockedSingles.length
      } single digits`
    );

    // Display sample data
    console.log("\n📊 Sample Triple Digits (Top 10 by tokens):");
    const topTriples = await TripleDigit.find({ roundId: currentRound._id })
      .sort({ tokens: -1 })
      .limit(10)
      .lean();

    topTriples.forEach((td, index) => {
      console.log(
        `${index + 1}. ${td.number} - Tokens: ${td.tokens} - Sum: ${
          td.sumDigits
        } - Last: ${td.lastDigit} - ${td.locked ? "🔒 LOCKED" : "🔓 Unlocked"}`
      );
    });

    console.log("\n📊 Single Digits:");
    const allSingles = await SingleDigit.find({ roundId: currentRound._id })
      .sort({ number: 1 })
      .lean();

    allSingles.forEach((sd) => {
      console.log(
        `${sd.number} - Tokens: ${sd.tokens} - ${
          sd.locked ? "🔒 LOCKED" : "🔓 Unlocked"
        }`
      );
    });

    console.log("\n🎉 Game numbers seeding completed successfully!");
    console.log(`📝 Round ID: ${currentRound._id}`);
    console.log(`📈 Total Triple Digits: ${insertedTriples.length}`);
    console.log(`📈 Total Single Digits: ${insertedSingles.length}`);
  } catch (error) {
    console.error("❌ Error seeding game numbers:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await seedGameNumbers();
    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Database connection closed");
  }
}

// Run the seeder
if (require.main === module) {
  main();
}

module.exports = { seedGameNumbers };
