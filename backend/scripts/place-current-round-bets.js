require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const NumberSelection = require('../models/NumberSelection');
const Round = require('../models/Round');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Place bet for a user AND update round stats
async function placeBet(userId, gameClass, selectedNumbers, betAmounts, roundId) {
  try {
    console.log(`🎯 Placing bets for user ${userId} on round ${roundId}`);

    // Create multiple bets
    for (let i = 0; i < selectedNumbers.length; i++) {
      const bet = new NumberSelection({
        userId: userId,
        classType: gameClass,
        number: selectedNumbers[i],
        amount: betAmounts[i],
        roundId: roundId,
        placedAt: new Date(),
        status: 'pending'
      });

      await bet.save();
      console.log(`  ✅ Bet placed: ${gameClass} - ${selectedNumbers[i]} - ₹${betAmounts[i]}`);

      // UPDATE ROUND STATS - THIS WAS MISSING!
      await Round.findByIdAndUpdate(roundId, {
        $inc: { 
          totalBets: 1,
          totalAmount: betAmounts[i]
        }
      });
    }

    return true;
  } catch (error) {
    console.error(`❌ Error placing bet for user ${userId}:`, error.message);
    return false;
  }
}

// Quick massive betting function
async function quickMassiveBetting() {
  try {
    await connectDB();
    console.log('🚀 QUICK MASSIVE BETTING STARTED!\n');

    const roundId = '68a05f696460802ce83ee638';
    console.log(`📅 Target Round: ${roundId}\n`);

    // Check if round exists first
    const round = await Round.findById(roundId);
    if (!round) {
      console.error('❌ Round not found!');
      return;
    }
    console.log(`✅ Round found: ${round.gameClass} - ${round.timeSlot}\n`);

    // All user IDs with massive bets - SMALLER AMOUNTS FOR TESTING
    const massiveBets = [
      { userId: '68a01b93531b39211704118d', gameClass: 'A', numbers: ['123', '456', '789'], amounts: [50, 75, 100] },
      { userId: '68a01b99531b392117041191', gameClass: 'A', numbers: ['190', '235', '370'], amounts: [60, 80, 120] },
      { userId: '68a01b9f531b392117041197', gameClass: 'A', numbers: ['550', '226', '668'], amounts: [40, 70, 90] },
      { userId: '68a01ba5531b39211704119b', gameClass: 'A', numbers: ['777', '444', '666'], amounts: [45, 85, 110] },
      { userId: '68a01bab531b39211704119f', gameClass: 'A', numbers: ['111', '222', '333'], amounts: [55, 95, 130] }
    ];

    let totalSuccessful = 0;
    let totalPlaced = 0;

    for (const userBet of massiveBets) {
      console.log(`🎯 PLACING BETS - User ${userBet.userId}:`);
      
      const success = await placeBet(
        userBet.userId,
        userBet.gameClass,
        userBet.numbers,
        userBet.amounts,
        roundId
      );

      if (success) {
        totalSuccessful += userBet.numbers.length;
        console.log(`✅ ${userBet.numbers.length} bets placed successfully!\n`);
      }
      
      totalPlaced += userBet.numbers.length;
    }

    console.log('🎉 MASSIVE BETTING COMPLETED!');
    console.log(`📊 Final Stats: ${totalSuccessful}/${totalPlaced} bets successful`);

    // Check updated round stats
    const updatedRound = await Round.findById(roundId);
    console.log(`\n📈 UPDATED Round Stats:`);
    console.log(`   Total Bets: ${updatedRound.totalBets}`);
    console.log(`   Total Amount: ₹${updatedRound.totalAmount}`);

    // Double check with NumberSelection count
    const roundBets = await NumberSelection.find({ roundId: roundId });
    const manualTotal = roundBets.reduce((sum, bet) => sum + bet.amount, 0);
    console.log(`\n🔍 Manual Count Check:`);
    console.log(`   NumberSelection Count: ${roundBets.length}`);
    console.log(`   Manual Total Amount: ₹${manualTotal}`);

  } catch (error) {
    console.error('❌ Error in massive betting:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run quick massive betting
quickMassiveBetting();
