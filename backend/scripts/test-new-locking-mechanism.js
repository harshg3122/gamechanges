/**
 * Test script for the new locking mechanism using LockedNumber model
 */

const mongoose = require('mongoose');
const Round = require('../models/Round');
const LockedNumber = require('../models/LockedNumber');
const { updateLockingMechanismByRoundId, getLockedNumbers, isNumberLocked, getUnlockedTripleDigit } = require('../utils/lockingMechanism');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/game';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  runTests();
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

async function runTests() {
  try {
    console.log('\n===== TESTING NEW LOCKING MECHANISM =====\n');
    
    // Step 1: Find or create a test round
    let round = await findOrCreateTestRound();
    console.log(`Using test round with ID: ${round._id}`);
    
    // Step 2: Initialize locking mechanism for the round
    console.log('\n----- Testing updateLockingMechanismByRoundId -----');
    await updateLockingMechanismByRoundId(round._id);
    console.log('Locking mechanism initialized');
    
    // Step 3: Get locked numbers
    console.log('\n----- Testing getLockedNumbers -----');
    const lockedNumbers = await getLockedNumbers(round._id);
    console.log(`Found ${lockedNumbers.length} locked numbers`);
    console.log(`Single digits locked: ${lockedNumbers.filter(n => n.numberType === 'single').length}`);
    console.log(`Triple digits locked: ${lockedNumbers.filter(n => n.numberType === 'triple').length}`);
    
    // Step 4: Test isNumberLocked
    console.log('\n----- Testing isNumberLocked -----');
    // Test a few single digits
    for (let i = 0; i < 10; i++) {
      const isLocked = await isNumberLocked(round._id, 'single', i.toString());
      console.log(`Single digit ${i} is locked: ${isLocked}`);
    }
    
    // Test a few triple digits
    const testTriples = ['000', '123', '456', '789', '999'];
    for (const triple of testTriples) {
      const isLocked = await isNumberLocked(round._id, 'triple', triple);
      console.log(`Triple digit ${triple} is locked: ${isLocked}`);
    }
    
    // Step 5: Test getUnlockedTripleDigit
    console.log('\n----- Testing getUnlockedTripleDigit -----');
    try {
      const unlockedTriple = await getUnlockedTripleDigit(round._id);
      console.log(`Found unlocked triple digit: ${unlockedTriple}`);
      
      // Verify it's actually unlocked
      const isLocked = await isNumberLocked(round._id, 'triple', unlockedTriple);
      console.log(`Verification - Triple ${unlockedTriple} is locked: ${isLocked} (should be false)`);
    } catch (error) {
      console.error('Error getting unlocked triple digit:', error.message);
    }
    
    console.log('\n===== TEST COMPLETED =====\n');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

async function findOrCreateTestRound() {
  // Try to find an existing test round
  let round = await Round.findOne({ status: 'betting' });
  
  // If no betting round exists, create a new one
  if (!round) {
    const currentDate = new Date();
    const timeSlot = `${currentDate.getHours()}:00 - ${currentDate.getHours() + 1}:00`;
    
    round = new Round({
      gameDate: currentDate,
      timeSlot: timeSlot,
      status: 'betting',
      createdAt: currentDate
    });
    
    await round.save();
    console.log('Created new test round');
  }
  
  return round;
}