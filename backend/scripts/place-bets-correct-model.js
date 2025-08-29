require('dotenv').config();
const mongoose = require('mongoose');
const Bet = require('../models/Bet');

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

// Place bet for a user
async function placeBet(userId, gameClass, selectedNumbers, betAmounts, roundId) {
  try {
    console.log(`🎯 Placing bets for user ${userId} on round ${roundId}`);

    // Create multiple bets
    for (let i = 0; i < selectedNumbers.length; i++) {
      const bet = new Bet({
        userId: userId,
        gameClass: gameClass,
        selectedNumber: selectedNumbers[i],
        betAmount: betAmounts[i],
        roundId: roundId,
        timeSlot: '12:00 PM',
        status: 'pending'
      });

      await bet.save();
      console.log(`  ✅ Bet placed: ${gameClass} - ${selectedNumbers[i]} - ₹${betAmounts[i]}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error placing bet for user ${userId}:`, error.message);
    return false;
  }
}

// Main function to place bets for the 12:00 PM round
async function placeBetsFor12PM() {
  try {
    await connectDB();
    console.log('🎯 Starting bet placement for 12:00 PM round...\n');

    const roundId = '68a06bcad260816d1b273643'; // Current 12:00 PM round

    // Define users and their bets (using valid numbers for each class)
    const userBets = [
      {
        userId: '68a01b93531b39211704118d', // user1
        gameClass: 'A',
        selectedNumbers: ['0', '1', '2'],
        betAmounts: [100, 150, 200]
      },
      {
        userId: '68a01b99531b392117041191', // user2
        gameClass: 'B',
        selectedNumbers: ['190', '235', '370'],
        betAmounts: [120, 180, 250]
      },
      {
        userId: '68a01b9f531b392117041197', // user3
        gameClass: 'C',
        selectedNumbers: ['550', '226', '668'],
        betAmounts: [80, 140, 190]
      },
      {
        userId: '68a01ba5531b39211704119b', // user4
        gameClass: 'A',
        selectedNumbers: ['3', '4', '5'],
        betAmounts: [90, 160, 220]
      },
      {
        userId: '68a01bab531b39211704119f', // user5
        gameClass: 'B',
        selectedNumbers: ['280', '136', '145'],
        betAmounts: [110, 170, 230]
      },
      {
        userId: '689e1f2dc8d0903fcb1b65ba', // richuser2000
        gameClass: 'C',
        selectedNumbers: ['299', '334', '244'],
        betAmounts: [130, 200, 270]
      },
      {
        userId: '689e2013c8d0903fcb1b6604', // player2024
        gameClass: 'A',
        selectedNumbers: ['6', '7', '8'],
        betAmounts: [95, 155, 210]
      },
      {
        userId: '689e20f1c8d0903fcb1b6632', // bigbetter
        gameClass: 'B',
        selectedNumbers: ['127', '456', '789'],
        betAmounts: [105, 175, 240]
      }
    ];

    let successfulBets = 0;
    let totalBets = 0;

    // Place bets for each user
    for (const userBet of userBets) {
      console.log(`📱 Placing bets for user ${userBet.userId}:`);
      
      const success = await placeBet(
        userBet.userId,
        userBet.gameClass,
        userBet.selectedNumbers,
        userBet.betAmounts,
        roundId
      );

      if (success) {
        successfulBets += userBet.selectedNumbers.length;
        console.log(`✅ Successfully placed ${userBet.selectedNumbers.length} bets\n`);
      } else {
        console.log(`❌ Failed to place bets for user ${userBet.userId}\n`);
      }

      totalBets += userBet.selectedNumbers.length;
    }

    console.log('🎯 Betting completed!');
    console.log(`📊 Results: ${successfulBets}/${totalBets} bets successful`);

  } catch (error) {
    console.error('❌ Error in bet placement:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
placeBetsFor12PM();
