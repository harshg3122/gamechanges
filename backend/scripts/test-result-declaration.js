require('dotenv').config();
const mongoose = require('mongoose');
const Round = require('../models/Round');
const Bet = require('../models/Bet');
const User = require('../models/User');

async function testResultDeclaration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const roundId = '68a033ca6460802ce83ee15f';
    
    // Check if round exists
    const round = await Round.findById(roundId);
    console.log('Round found:', round ? 'Yes' : 'No');
    if (round) {
      console.log('Round status:', round.status);
      console.log('Round winningNumber:', round.winningNumber);
    }

    // Check if bets exist
    const bets = await Bet.find({ roundId });
    console.log('Bets found:', bets.length);

    // Try to update round
    if (round) {
      round.winningNumber = '4';
      round.status = 'completed';
      round.resultDeclaredAt = new Date();
      
      await round.save();
      console.log('✅ Round updated successfully');
      
      // Update bets
      for (const bet of bets) {
        const isWinner = bet.selectedNumber === '4';
        
        if (isWinner) {
          bet.status = 'won';
          bet.winAmount = bet.betAmount * 10;
          
          // Update user wallet
          await User.findByIdAndUpdate(
            bet.userId,
            { $inc: { wallet: bet.winAmount } }
          );
          console.log(`✅ User ${bet.userId} won ₹${bet.winAmount}`);
        } else {
          bet.status = 'lost';
        }
        
        await bet.save();
      }
      
      console.log('✅ All bets updated successfully');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testResultDeclaration();
