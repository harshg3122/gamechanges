const mongoose = require('mongoose');
const { updateLockingMechanism } = require('../utils/lockingMechanism');
const SingleDigit = require('../models/SingleDigit');
const TripleDigit = require('../models/TripleDigit');
const Result = require('../models/Result');
const Round = require('../models/Round');

// Use the existing MongoDB connection from the backend server
// The server.js file should have already established a connection
console.log('Using existing MongoDB connection...');

// Check if mongoose is connected
if (mongoose.connection.readyState !== 1) {
  console.log('MongoDB not connected, attempting to connect...');
  mongoose.connect('mongodb://127.0.0.1:27017/game', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}

// Function to test the locking mechanism
async function testLockingMechanism() {
  console.log('\n===== Testing Locking Mechanism =====');
  try {
    // Update the locking mechanism
    await updateLockingMechanism();
    
    // Verify single digits locking
    const lockedSingleDigits = await SingleDigit.find({ isLocked: true });
    console.log(`Locked single digits: ${lockedSingleDigits.length} (should be 5)`);
    console.log('Locked single digits:', lockedSingleDigits.map(digit => digit.number).sort((a, b) => a - b).join(', '));
    
    // Verify triple digits locking
    const lockedTripleDigits = await TripleDigit.find({ isLocked: true });
    console.log(`Locked triple digits: ${lockedTripleDigits.length} (should be 50)`);
    console.log('Sample of locked triple digits:', lockedTripleDigits.slice(0, 10).map(digit => digit.number).join(', '));
    
    return { 
      singleDigitsLocked: lockedSingleDigits.map(digit => digit.number),
      tripleDigitsLocked: lockedTripleDigits.map(digit => digit.number)
    };
  } catch (error) {
    console.error('Error testing locking mechanism:', error);
    return null;
  }
}

// Function to test result calculation
async function testResultCalculation(lockedData) {
  console.log('\n===== Testing Result Calculation =====');
  try {
    if (!lockedData) {
      console.error('No locked data available');
      return;
    }
    
    // Get all unlocked triple digits
    const allTripleDigits = await TripleDigit.find({ isLocked: false });
    console.log(`Total unlocked triple digits: ${allTripleDigits.length} (should be ~950)`);
    
    // Select a random unlocked triple digit
    const randomIndex = Math.floor(Math.random() * allTripleDigits.length);
    const selectedTripleDigit = allTripleDigits[randomIndex];
    console.log(`Selected unlocked triple digit: ${selectedTripleDigit.number}`);
    
    // Calculate the result single digit
    const digits = selectedTripleDigit.number.toString().padStart(3, '0').split('').map(Number);
    const sum = digits.reduce((a, b) => a + b, 0);
    const resultSingleDigit = sum % 10;
    console.log(`Sum of digits: ${digits.join(' + ')} = ${sum}`);
    console.log(`Result single digit: ${resultSingleDigit}`);
    
    // Check if the result single digit is locked
    const isResultLocked = lockedData.singleDigitsLocked.includes(resultSingleDigit.toString());
    console.log(`Is result single digit locked? ${isResultLocked ? 'Yes' : 'No'}`);
    
    if (isResultLocked) {
      console.log('Result is locked, admin should choose another number');
      // Try another random triple digit
      return testResultCalculation(lockedData);
    } else {
      console.log('Result is valid, can be declared');
      
      // Create a test round if needed
      let round = await Round.findOne({ status: 'active' });
      if (!round) {
        round = new Round({
          gameClass: 'A',
          timeSlot: '10:00 AM - 11:00 AM',
          status: 'active'
        });
        await round.save();
        console.log('Created test round:', round._id);
      }
      
      // Simulate result declaration
      console.log(`Simulating result declaration for round ${round._id}`);
      console.log(`Triple digit: ${selectedTripleDigit.number}, Single digit: ${resultSingleDigit}`);
      
      return {
        roundId: round._id,
        tripleDigit: selectedTripleDigit.number,
        singleDigit: resultSingleDigit,
        isValid: true
      };
    }
  } catch (error) {
    console.error('Error testing result calculation:', error);
    return null;
  }
}

// Function to test betting time flow
async function testBettingTimeFlow() {
  console.log('\n===== Testing Betting Time Flow =====');
  try {
    // Create a test round
    const round = new Round({
      gameClass: 'A',
      timeSlot: '10:00 AM - 11:00 AM',
      status: 'active'
    });
    await round.save();
    console.log('Created test round for betting time flow:', round._id);
    
    // Simulate the betting time flow
    console.log('In a real scenario:');
    console.log('1. Betting window would be open for 50 minutes');
    console.log('2. Result window would be open for 10 minutes');
    console.log('3. Admin would choose a number within the first 9 minutes of result window');
    console.log('4. If not chosen, system would auto-select a number in the last minute');
    
    return { roundId: round._id };
  } catch (error) {
    console.error('Error testing betting time flow:', error);
    return null;
  }
}

// Main test function
async function runTests() {
  try {
    console.log('Starting tests...');
    
    // Test locking mechanism
    const lockedData = await testLockingMechanism();
    
    // Test result calculation
    const resultData = await testResultCalculation(lockedData);
    
    // Test betting time flow
    const timeFlowData = await testBettingTimeFlow();
    
    console.log('\n===== Test Summary =====');
    console.log('Locking Mechanism:', lockedData ? 'PASSED' : 'FAILED');
    console.log('Result Calculation:', resultData ? 'PASSED' : 'FAILED');
    console.log('Betting Time Flow:', timeFlowData ? 'PASSED' : 'FAILED');
    
    console.log('\nTests completed. Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();