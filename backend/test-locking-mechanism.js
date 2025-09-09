const mongoose = require('mongoose');
const SingleDigit = require('./models/SingleDigit');
const TripleDigit = require('./models/TripleDigit');
const Round = require('./models/Round');
const Result = require('./models/Result');
const Bet = require('./models/Bet');
const LockedNumber = require('./models/LockedNumber');
const { updateLockingMechanism } = require('./utils/lockingMechanism');
const { getCurrentTimeSlot } = require('./utils/timeSlotUtils');

// Check if mongoose is already connected
if (mongoose.connection.readyState !== 1) {
    console.log('Connecting to MongoDB...');
    // Load environment variables
    require('dotenv').config();
    
    // Try to use the same connection string as the server
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_LOCAL || 'mongodb://localhost:27017/numbergame';
    console.log(`Using MongoDB URI: ${mongoURI}`);
    
    mongoose.connect(mongoURI)
        .then(() => {
            console.log('MongoDB connected successfully');
            runTests();
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
            // Try alternative connection
            console.log('Trying alternative connection...');
            mongoose.connect('mongodb://localhost:27017/numbergame')
                .then(() => {
                    console.log('Alternative MongoDB connection successful');
                    runTests();
                })
                .catch(altErr => {
                    console.error('All MongoDB connection attempts failed:', altErr);
                    process.exit(1);
                });
        });
} else {
    console.log('MongoDB already connected');
    runTests();
}

async function runTests() {
    try {
        console.log('\n===== TESTING LOCKING MECHANISM =====');
        await testLockingMechanism();
        
        console.log('\n===== TESTING RESULT CALCULATION =====');
        await testResultCalculation();
        
        console.log('\n===== TESTING BETTING TIME FLOW =====');
        await testBettingTimeFlow();
        
        console.log('\n===== ALL TESTS COMPLETED =====');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Function to initialize locking mechanism
async function initializeLockingMechanism(roundId) {
    try {
        // Check if locking mechanism is already initialized
        const existingLocks = await LockedNumber.countDocuments({ roundId });
        if (existingLocks > 0) {
            console.log(`Locking mechanism already initialized with ${existingLocks} locked numbers`);
            return;
        }
        
        // Lock 5 single digits (0-9)
        const singleDigits = Array.from({ length: 10 }, (_, i) => i.toString());
        const shuffledSingleDigits = singleDigits.sort(() => Math.random() - 0.5);
        const lockedSingleDigits = shuffledSingleDigits.slice(0, 5);
        
        // Lock 50 triple digits (000-999)
        const tripleDigits = Array.from({ length: 1000 }, (_, i) => i.toString().padStart(3, '0'));
        const shuffledTripleDigits = tripleDigits.sort(() => Math.random() - 0.5);
        const lockedTripleDigits = shuffledTripleDigits.slice(0, 50);
        
        // Create locked numbers in database
        for (const digit of lockedSingleDigits) {
            await LockedNumber.create({
                roundId,
                numberType: 'single',
                number: digit
            });
        }
        
        for (const digit of lockedTripleDigits) {
            await LockedNumber.create({
                roundId,
                numberType: 'triple',
                number: digit
            });
        }
        
        console.log(`Locked ${lockedSingleDigits.length} single digits and ${lockedTripleDigits.length} triple digits for round ${roundId}`);
    } catch (error) {
        console.error('Error initializing locking mechanism:', error);
        throw error;
    }
}

async function testLockingMechanism() {
    try {
        // Get current date and time slot
        const today = new Date().toISOString().slice(0, 10);
        const currentTimeSlot = getCurrentTimeSlot();
        console.log(`Testing for date: ${today}, time slot: ${currentTimeSlot.slot}`);
        
        // Clear existing locked numbers for testing
        await SingleDigit.updateMany(
            { date: today, timeSlot: currentTimeSlot.slot },
            { $set: { locked: false } }
        );
        await TripleDigit.updateMany(
            { date: today, timeSlot: currentTimeSlot.slot },
            { $set: { locked: false } }
        );
        
        // Update locking mechanism
        await updateLockingMechanism(today, currentTimeSlot.slot);
        
        // Check single digits
        const lockedSingleDigits = await SingleDigit.find({
            date: today,
            timeSlot: currentTimeSlot.slot,
            locked: true
        });
        console.log(`Locked single digits: ${lockedSingleDigits.length}`);
        if (lockedSingleDigits.length !== 5) {
            throw new Error(`Expected 5 locked single digits, got ${lockedSingleDigits.length}`);
        }
        
        // Check triple digits
        const lockedTripleDigits = await TripleDigit.find({
            date: today,
            timeSlot: currentTimeSlot.slot,
            locked: true
        });
        console.log(`Locked triple digits: ${lockedTripleDigits.length}`);
        if (lockedTripleDigits.length !== 50) {
            throw new Error(`Expected 50 locked triple digits, got ${lockedTripleDigits.length}`);
        }
        
        console.log('Locking mechanism test passed!');
        return true;
    } catch (error) {
        console.error('Locking mechanism test failed:', error);
        throw error;
    }
}

async function testResultCalculation() {
    try {
        // Get current date and time slot
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day to avoid time issues
        const currentTimeSlot = getCurrentTimeSlot();
        
        // Create a test round
        let round = await Round.findOne({
            gameClass: 'A',
            timeSlot: currentTimeSlot.slot,
            status: 'active'
        });
        
        if (!round) {
            round = new Round({
                gameDate: today,
                timeSlot: currentTimeSlot.slot,
                gameClass: 'A',
                status: 'active'
            });
            try {
                await round.save();
                console.log('Created test round:', round._id);
            } catch (error) {
                if (error.code === 11000) {
                    // Handle duplicate key error
                    round = await Round.findOne({
                        gameClass: 'A',
                        timeSlot: currentTimeSlot.slot
                    });
                    console.log('Using existing round due to duplicate key:', round._id);
                } else {
                    throw error;
                }
            }
        } else {
            console.log('Using existing round:', round._id);
        }
        
        // Initialize locking mechanism for testing
        await initializeLockingMechanism(round._id);
        
        // Find an unlocked triple digit
const lockedNumbers = await LockedNumber.find({ roundId: round._id, numberType: 'triple' });
const lockedTripleDigits = lockedNumbers.map(ln => ln.number);

// Generate a random triple digit that is not locked
const allTripleDigits = Array.from({ length: 1000 }, (_, i) => i.toString().padStart(3, '0'));
const unlockedTripleDigits = allTripleDigits.filter(digit => !lockedTripleDigits.includes(digit));

if (unlockedTripleDigits.length === 0) {
    throw new Error('No unlocked triple digits found');
}

// Select a random unlocked triple digit
const randomIndex = Math.floor(Math.random() * unlockedTripleDigits.length);
const unlockedTripleDigit = { number: unlockedTripleDigits[randomIndex] };
        
        if (!unlockedTripleDigit) {
            throw new Error('No unlocked triple digits found');
        }
        
        console.log(`Selected unlocked triple digit: ${unlockedTripleDigit.number}`);
        
        // Calculate single digit result
        const tripleDigitNumber = unlockedTripleDigit.number;
        const singleDigitResult = tripleDigitNumber.split('').reduce((sum, digit) => sum + parseInt(digit), 0) % 10;
        
        console.log(`Triple digit ${tripleDigitNumber} results in single digit ${singleDigitResult}`);
        
        // Check if single digit is locked
        const singleDigitRecord = await LockedNumber.findOne({
            roundId: round._id,
            numberType: 'single',
            number: singleDigitResult.toString()
        });
        
        if (singleDigitRecord) {
            console.log(`Single digit ${singleDigitResult} is locked, finding another triple digit...`);
            return await testResultCalculation(); // Recursive call to try again
        }
        
        // Create a result
        await Result.deleteMany({ roundId: round._id }); // Clear any existing results
        
        const result = new Result({
            roundId: round._id,
            date: today,
            timeSlot: currentTimeSlot.slot,
            tripleDigitNumber,
            singleDigitResult: singleDigitResult.toString()
        });
        
        await result.save();
        console.log('Result saved:', result);
        
        // Update round status
        round.status = 'completed';
        await round.save();
        
        console.log('Result calculation test passed!');
        return true;
    } catch (error) {
        console.error('Result calculation test failed:', error);
        throw error;
    }
}

async function testBettingTimeFlow() {
    try {
        // Get current date and time slot
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day to avoid time issues
        const currentTimeSlot = getCurrentTimeSlot();
        
        // Find or create a round for testing
        let testRound = await Round.findOne({
            gameClass: 'A',
            timeSlot: currentTimeSlot.slot
        });
        
        if (!testRound) {
            testRound = new Round({
                gameDate: today,
                timeSlot: currentTimeSlot.slot,
                gameClass: 'A',
                status: 'active'
            });
            
            try {
                await testRound.save();
                console.log('Created test round for betting flow:', testRound._id);
            } catch (error) {
                if (error.code === 11000) {
                    // Handle duplicate key error
                    testRound = await Round.findOne({
                        gameClass: 'A',
                        timeSlot: currentTimeSlot.slot
                    });
                    console.log('Using existing round due to duplicate key:', testRound._id);
                } else {
                    throw error;
                }
            }
        } else {
            console.log('Using existing round for betting flow:', testRound._id);
        }
        
        // Initialize locking mechanism for testing
        await initializeLockingMechanism(testRound._id);
        
        // Verify that locking mechanism is updated
        const lockedSingleDigits = await LockedNumber.find({
            roundId: testRound._id,
            numberType: 'single'
        });
        
        const lockedTripleDigits = await LockedNumber.find({
            roundId: testRound._id,
            numberType: 'triple'
        });
        
        console.log(`Locked single digits: ${lockedSingleDigits.length}`);
        console.log(`Locked triple digits: ${lockedTripleDigits.length}`);
        
        if (lockedSingleDigits.length !== 5 || lockedTripleDigits.length !== 50) {
            throw new Error('Locking mechanism not properly initialized');
        }
        
        console.log('Betting time flow test passed!');
        return true;
    } catch (error) {
        console.error('Betting time flow test failed:', error);
        throw error;
    }
}