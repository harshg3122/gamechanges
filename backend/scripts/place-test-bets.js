const axios = require('axios');

const users = [
  { name: 'BetterOneTest', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWYxYWJjZGQ2YWEyNjM4ZjIzMzc0ZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU1MjgxNzI2LCJleHAiOjE3NTU4ODY1MjZ9.QN5e7ViUUNAELvRb0MfFkuqOw6pCwvtJD9Vns2TK8OE' },
  { name: 'BetterTwoTest', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWYxYWYzZGQ2YWEyNjM4ZjIzMzc1MyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU1MjgxNzM2LCJleHAiOjE3NTU4ODY1MzZ9.oJvK4AeuQ5L4lnqxVvWYY8RKmCXhm6LHFwUa-P4yDis' },
  { name: 'BetterTwoTest', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWYxYWYzZGQ2YWEyNjM4ZjIzMzc1MyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU1MjgxNzM2LCJleHAiOjE3NTU4ODY1MzZ9.oJvK4AeuQ5L4lnqxVvWYY8RKmCXhm6LHFwUa-P4yDis' },
  { name: 'BetterThreeTest', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWYxYjJjZGQ2YWEyNjM4ZjIzMzc1NyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU1MjgxNzQ2LCJleHAiOjE3NTU4ODY1NDZ9.BVBNjdM5_mJCVy-W1N0xDbz1MXNOslJnhzZhXA-5X7Q' },
  { name: 'BetterFourTest', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWYxYjY0ZGQ2YWEyNjM4ZjIzMzc1YiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU1MjgxNzU2LCJleHAiOjE3NTU4ODY1NTZ9.LpGkOBBiJN9-g7h2_uXn6AH5N3Fm-O7jq6bWMb4K8PQ' },
  { name: 'BetterFiveTest', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWYxYjlkZGQ2YWEyNjM4ZjIzMzc1ZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU1MjgxNzY3LCJleHAiOjE3NTU4ODY1Njd9.HQyU8mNh7nX2vW9fMZ7PK8aLbC5dR6sTgUe4FpAq3Oj' },
  // Add more users for massive betting
  { name: 'BetterSixTest', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWYxYjlkZGQ2YWEyNjM4ZjIzMzc1ZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU1MjgxNzY3LCJleHAiOjE3NTU4ODY1Njd9.HQyU8mNh7nX2vW9fMZ7PK8aLbC5dR6sTgUe4FpAq3Oj' },
  { name: 'BetterSevenTest', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWYxYjlkZGQ2YWEyNjM4ZjIzMzc1ZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU1MjgxNzY3LCJleHAiOjE3NTU4ODY1Njd9.HQyU8mNh7nX2vW9fMZ7PK8aLbC5dR6sTgUe4FpAq3Oj' }
];

const singleDigitBets = [
  { betType: 'singleDigit', number: '1', amount: 50 },
  { betType: 'singleDigit', number: '2', amount: 60 },
  { betType: 'singleDigit', number: '3', amount: 70 },
  { betType: 'singleDigit', number: '4', amount: 40 },
  { betType: 'singleDigit', number: '5', amount: 80 },
  { betType: 'singleDigit', number: '6', amount: 45 },
  { betType: 'singleDigit', number: '7', amount: 65 },
  { betType: 'singleDigit', number: '8', amount: 55 },
  { betType: 'singleDigit', number: '9', amount: 75 },
  { betType: 'singleDigit', number: '0', amount: 35 }
];

const tripleDigitBets = [
  { betType: 'tripleDigit', number: '111', amount: 90 },
  { betType: 'tripleDigit', number: '222', amount: 85 },
  { betType: 'tripleDigit', number: '333', amount: 75 },
  { betType: 'tripleDigit', number: '444', amount: 95 },
  { betType: 'tripleDigit', number: '555', amount: 80 },
  { betType: 'tripleDigit', number: '123', amount: 65 },
  { betType: 'tripleDigit', number: '456', amount: 95 },
  { betType: 'tripleDigit', number: '789', amount: 70 },
  { betType: 'tripleDigit', number: '234', amount: 85 },
  { betType: 'tripleDigit', number: '567', amount: 60 },
  { betType: 'tripleDigit', number: '890', amount: 88 },
  { betType: 'tripleDigit', number: '012', amount: 45 }
];

async function placeBet(user, bet) {
  try {
    const response = await axios.post('http://localhost:5000/api/game/bet', bet, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ ${user.name}: ${bet.betType} ${bet.number} ₹${bet.amount}`);
    return true;
  } catch (error) {
    console.log(`❌ ${user.name}: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function massiveBettingRound() {
  console.log('🚀 Starting MASSIVE betting round...\n');
  
  let totalBets = 0;
  let successfulBets = 0;
  
  // Multiple betting rounds
  for (let round = 1; round <= 3; round++) {
    console.log(`🎯 === ROUND ${round} ===`);
    
    for (const user of users) {
      console.log(`📱 ${user.name} - Round ${round}:`);
      
      // 3-5 single digit bets per user per round
      const singleBetCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < singleBetCount; i++) {
        const bet = singleDigitBets[Math.floor(Math.random() * singleDigitBets.length)];
        totalBets++;
        if (await placeBet(user, bet)) successfulBets++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 2-4 triple digit bets per user per round
      const tripleBetCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < tripleBetCount; i++) {
        const bet = tripleDigitBets[Math.floor(Math.random() * tripleDigitBets.length)];
        totalBets++;
        if (await placeBet(user, bet)) successfulBets++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(''); // Space between users
    }
    
    console.log(`Round ${round} completed! Waiting 2 seconds...\n`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`🎯 MASSIVE BETTING COMPLETED! ${successfulBets}/${totalBets} bets successful\n`);
  
  // Check final results
  try {
    const response = await axios.get('http://localhost:5000/api/game/current-round');
    console.log('📊 Final Round Status:');
    console.log(`Time Slot: ${response.data.timeSlot}`);
    console.log(`Total Bets: ${response.data.totalBets || 0}`);
    console.log(`Total Amount: ₹${response.data.totalBetAmount || 0}`);
  } catch (error) {
    console.log('❌ Could not fetch current round status');
  }
}

async function placeAllBets() {
  console.log('🎯 Starting automated bet placement...\n');
  
  let totalBets = 0;
  let successfulBets = 0;
  
  for (const user of users) {
    console.log(`📱 Placing bets for ${user.name}:`);
    
    // Place 3-4 single digit bets per user
    const singleBetCount = Math.floor(Math.random() * 2) + 3;
    for (let i = 0; i < singleBetCount; i++) {
      const bet = singleDigitBets[Math.floor(Math.random() * singleDigitBets.length)];
      totalBets++;
      if (await placeBet(user, bet)) successfulBets++;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Place 4-6 triple digit bets per user
    const tripleBetCount = Math.floor(Math.random() * 3) + 4;
    for (let i = 0; i < tripleBetCount; i++) {
      const bet = tripleDigitBets[Math.floor(Math.random() * tripleDigitBets.length)];
      totalBets++;
      if (await placeBet(user, bet)) successfulBets++;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('');
  }
  
  console.log(`🎯 Betting completed! ${successfulBets}/${totalBets} bets successful\n`);
  
  // Check results
  try {
    const response = await axios.get('http://localhost:5000/api/game/current-round');
    console.log('📊 Current Round Status:');
    console.log(`Time Slot: ${response.data.timeSlot}`);
    console.log(`Total Bets: ${response.data.totalBets || 0}`);
    console.log(`Total Amount: ₹${response.data.totalBetAmount || 0}`);
  } catch (error) {
    console.log('❌ Could not fetch current round status');
  }
}

// Run massive betting or normal betting based on argument
const runMassive = process.argv.includes('--massive');
if (runMassive) {
  massiveBettingRound();
} else {
  placeAllBets();
}