const mongoose = require('mongoose');
const User = require('../models/User');
const Bet = require('../models/Bet');
const { getCurrentTimeSlot, isBettingAllowed } = require('../utils/timeSlots');

// Connect to MongoDB Cloud
mongoose.connect('mongodb+srv://963sohamraut:tiIJDdXD8oSGbrfD@game.h39d7ua.mongodb.net/numbergame?retryWrites=true&w=majority&appName=Game')
  .then(() => console.log('✅ MongoDB Cloud connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Possible bet options
const BET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const BET_AMOUNTS = [10, 20, 50, 100, 200, 500];

async function placeBetsForAllUsers() {
  try {
    console.log('🎰 Starting to place bets for all users...');
    
    // Skip betting time check for now - force betting
    // if (!isBettingAllowed()) {
    //   console.log('❌ Betting is not allowed at this time');
    //   return;
    // }
    
    const currentTimeSlot = getCurrentTimeSlot();
    console.log(`📅 Current time slot: ${currentTimeSlot.slot}`);
    
    // Get all users with balance
    const users = await User.find({ balance: { $gt: 0 } });
    console.log(`👥 Found ${users.length} users with balance`);
    
    const betsToPlace = [];
    
    for (const user of users) {
      // Random number of bets per user (2-5)
      const numBets = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < numBets; i++) {
        // Random bet amount (ensure user has enough balance)
        const availableAmounts = BET_AMOUNTS.filter(amount => amount <= user.balance);
        if (availableAmounts.length === 0) continue;
        
        const betAmount = availableAmounts[Math.floor(Math.random() * availableAmounts.length)];
        const betChoice = BET_OPTIONS[Math.floor(Math.random() * BET_OPTIONS.length)];
        
        betsToPlace.push({
          userId: user._id,
          username: user.username,
          timeSlot: currentTimeSlot.slot,
          betAmount: betAmount,
          betChoice: betChoice,
          placedAt: new Date(),
          status: 'ACTIVE'
        });
        
        // Update user balance
        user.balance -= betAmount;
      }
      
      // Save updated user balance
      await user.save();
    }
    
    // Insert all bets
    if (betsToPlace.length > 0) {
      await Bet.insertMany(betsToPlace);
      console.log(`✅ Successfully placed ${betsToPlace.length} bets!`);
      
      // Show summary
      const summary = {};
      betsToPlace.forEach(bet => {
        if (!summary[bet.betChoice]) summary[bet.betChoice] = 0;
        summary[bet.betChoice] += bet.betAmount;
      });
      
      console.log('\n📊 Betting Summary:');
      Object.entries(summary).forEach(([choice, total]) => {
        console.log(`${choice}: ₹${total}`);
      });
      
      console.log(`\n💰 Total amount bet: ₹${betsToPlace.reduce((sum, bet) => sum + bet.betAmount, 0)}`);
    } else {
      console.log('❌ No bets could be placed (insufficient balance)');
    }
    
  } catch (error) {
    console.error('❌ Error placing bets:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the script
if (require.main === module) {
  placeBetsForAllUsers();
}

module.exports = { placeBetsForAllUsers };