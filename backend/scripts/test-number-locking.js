// Test script to verify number locking functionality
const mongoose = require('mongoose');
const axios = require('axios');
const { updateNumberLockStatus } = require('../controllers/gameController');
const Round = require('../models/Round');
const Bet = require('../models/Bet');
const SingleDigit = require('../models/SingleDigit');
const TripleDigit = require('../models/TripleDigit');
const Settings = require('../models/Settings');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/game', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  runTest();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

async function runTest() {
  try {
    console.log('🧪 Starting number locking test...');
    
    // 1. Create a test round
    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    const timeSlot = '12:00-13:00';
    
    let testRound = await Round.findOne({ timeSlot, status: 'active' });
    if (!testRound) {
      testRound = new Round({
        gameClass: 'A',
        timeSlot,
        status: 'active'
      });
      await testRound.save();
      console.log(`✅ Created test round: ${testRound._id}`);
    } else {
      console.log(`✅ Using existing round: ${testRound._id}`);
    }
    
    // 2. Create or update settings with lock threshold
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({
        numberLockThreshold: 30, // 30% threshold for locking
        minBetAmount: 10,
        maxBetAmount: 10000,
        bettingEnabled: true
      });
      await settings.save();
      console.log('✅ Created settings with numberLockThreshold: 30%');
    } else {
      settings.numberLockThreshold = 30;
      await settings.save();
      console.log('✅ Updated settings with numberLockThreshold: 30%');
    }
    
    // 3. Clear existing bets for this round
    await Bet.deleteMany({ roundId: testRound._id });
    console.log('✅ Cleared existing bets for test round');
    
    // 4. Clear existing SingleDigit and TripleDigit records for this timeSlot
    await SingleDigit.deleteMany({ date: currentDate, timeSlot });
    await TripleDigit.deleteMany({ date: currentDate, timeSlot });
    console.log('✅ Cleared existing SingleDigit and TripleDigit records');
    
    // 5. Create test bets with specific distribution to trigger locking
    const testBets = [
      // Single digit bets (Class A) - digit '5' will have 40% of total bets (should be locked)
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'A', selectedNumber: '1', betAmount: 100, timeSlot, status: 'pending' },
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'A', selectedNumber: '2', betAmount: 100, timeSlot, status: 'pending' },
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'A', selectedNumber: '3', betAmount: 100, timeSlot, status: 'pending' },
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'A', selectedNumber: '4', betAmount: 100, timeSlot, status: 'pending' },
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'A', selectedNumber: '5', betAmount: 400, timeSlot, status: 'pending' }, // 40% of single digit bets
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'A', selectedNumber: '6', betAmount: 100, timeSlot, status: 'pending' },
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'A', selectedNumber: '7', betAmount: 100, timeSlot, status: 'pending' },
      
      // Triple digit bets (Class B) - number '123' will have 35% of total bets (should be locked)
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'B', selectedNumber: '123', betAmount: 350, timeSlot, status: 'pending' }, // 35% of triple digit bets
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'B', selectedNumber: '456', betAmount: 150, timeSlot, status: 'pending' },
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'B', selectedNumber: '789', betAmount: 150, timeSlot, status: 'pending' },
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'B', selectedNumber: '234', betAmount: 150, timeSlot, status: 'pending' },
      { userId: '123456789012345678901234', roundId: testRound._id, gameClass: 'B', selectedNumber: '567', betAmount: 200, timeSlot, status: 'pending' },
    ];
    
    await Bet.insertMany(testBets);
    console.log(`✅ Created ${testBets.length} test bets`);
    
    // 6. Run the updateNumberLockStatus function
    console.log('🔄 Running updateNumberLockStatus...');
    await updateNumberLockStatus(testRound._id);
    
    // 7. Check the results
    const singleDigit5 = await SingleDigit.findOne({ date: currentDate, timeSlot, digit: '5' });
    const tripleDigit123 = await TripleDigit.findOne({ date: currentDate, timeSlot, number: '123' });
    
    console.log('\n📊 Test Results:');
    console.log(`Single Digit '5' locked: ${singleDigit5?.locked}`);
    console.log(`Triple Digit '123' locked: ${tripleDigit123?.locked}`);
    
    // Check other digits that should not be locked
    const singleDigit1 = await SingleDigit.findOne({ date: currentDate, timeSlot, digit: '1' });
    const tripleDigit456 = await TripleDigit.findOne({ date: currentDate, timeSlot, number: '456' });
    
    console.log(`Single Digit '1' locked: ${singleDigit1?.locked}`);
    console.log(`Triple Digit '456' locked: ${tripleDigit456?.locked}`);
    
    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}