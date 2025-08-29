const Bet = require('../models/Bet');
const Round = require('../models/Round');
const Result = require('../models/Result');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getCurrentTimeSlot, getTimingInfo } = require('../utils/timeSlots');
// Calculate sum of digits for result logic
const calculateDigitSum = (number) => {
  return number.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
};

// Get the unit digit from a number
const getUnitDigit = (number) => {
  const sum = calculateDigitSum(number);
  return sum % 10;
};

// Check if a bet wins based on the result
const checkWinningBet = (selectedNumber, winningNumber, gameClass) => {
  // Direct match always wins
  if (selectedNumber === winningNumber) {
    return true;
  }

  // For Class D, also check if the unit digit matches
  if (gameClass === 'D') {
    const selectedDigit = parseInt(selectedNumber);
    const winningDigit = getUnitDigit(parseInt(winningNumber));
    return selectedDigit === winningDigit;
  }

  // For other classes, check if selected single digit matches the unit digit of result
  if (selectedNumber.length === 1 && winningNumber.length >= 3) {
    const selectedDigit = parseInt(selectedNumber);
    const winningDigit = getUnitDigit(parseInt(winningNumber));
    return selectedDigit === winningDigit;
  }

  return false;
};

// Game numbers for each class with the new structure
const GAME_NUMBERS = {
  A: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  B: [
    '0', '127', '136', '145', '190', '235', '280', '370', '479', '460', '569', '389', '578',
    '1', '128', '137', '146', '236', '245', '290', '380', '470', '489', '560', '678', '579',
    '2', '129', '138', '147', '156', '237', '246', '345', '390', '480', '570', '589', '679',
    '3', '120', '139', '148', '157', '238', '247', '256', '346', '490', '580', '175', '256',
    '4', '130', '149', '158', '167', '239', '248', '257', '347', '356', '590', '680', '789',
    '5', '140', '159', '168', '230', '249', '258', '267', '348', '357', '456', '690', '780',
    '6', '123', '150', '169', '178', '240', '259', '268', '349', '358', '457', '367', '790',
    '7', '124', '160', '179', '250', '269', '278', '340', '359', '368', '458', '467', '890',
    '8', '125', '134', '170', '189', '260', '279', '350', '369', '378', '459', '567', '468',
    '9', '135', '180', '234', '270', '289', '360', '379', '450', '469', '478', '568', '679',
  ],
  C: [
    '0', '550', '668', '244', '299', '226', '334', '488', '667', '118',
    '1', '100', '119', '155', '227', '335', '344', '399', '588', '669',
    '2', '200', '110', '228', '255', '336', '449', '660', '688', '778',
    '3', '300', '166', '229', '337', '355', '445', '599', '779', '788',
    '4', '400', '112', '220', '266', '338', '446', '455', '699', '770',
    '5', '500', '113', '122', '177', '339', '366', '447', '799', '889',
    '6', '600', '114', '277', '330', '448', '466', '556', '880', '899',
    '7', '700', '115', '133', '188', '223', '377', '449', '557', '566',
    '8', '800', '116', '224', '233', '288', '440', '477', '558', '990',
    '9', '900', '117', '144', '199', '225', '388', '559', '577', '667',
  ],
  D: ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'],
};

// Get available numbers for each game class
const getGameNumbers = async (req, res) => {
  try {
    res.json({
      success: true,
      data: GAME_NUMBERS,
      message: 'Game numbers fetched successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching game numbers'
    });
  }
};

// Place a bet (supports multiple numbers)
const placeBet = async (req, res) => {
  try {
    const { gameClass, selectedNumbers, betAmounts, timeSlot } = req.body;
    const userId = req.user.id;

    // Debug logging
    console.log('PlaceBet request received:');
    console.log('- gameClass:', gameClass, 'type:', typeof gameClass);
    console.log('- selectedNumbers:', selectedNumbers, 'type:', typeof selectedNumbers);
    console.log('- betAmounts:', betAmounts, 'type:', typeof betAmounts);
    console.log('- timeSlot:', timeSlot);

    // Handle both single and multiple bet formats for backward compatibility
    let numbersArray, amountsArray;

    // Check if it's the old single bet format or new multiple bet format
    if (req.body.selectedNumber !== undefined && req.body.betAmount !== undefined) {
      // Backward compatibility: single bet format
      numbersArray = [req.body.selectedNumber];
      amountsArray = [req.body.betAmount];
    } else if (selectedNumbers && betAmounts) {
      // New multiple bet format
      numbersArray = Array.isArray(selectedNumbers) ? selectedNumbers : [selectedNumbers];
      amountsArray = Array.isArray(betAmounts) ? betAmounts : [betAmounts];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Provide either (selectedNumber, betAmount) or (selectedNumbers, betAmounts)'
      });
    }

    // Validate arrays have same length
    if (numbersArray.length !== amountsArray.length) {
      return res.status(400).json({
        success: false,
        message: 'selectedNumbers and betAmounts arrays must have the same length'
      });
    }

    // Validate input
    if (!gameClass || numbersArray.length === 0 || amountsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: gameClass and bet selections'
      });
    }

    // Validate game class
    if (!['A', 'B', 'C', 'D'].includes(gameClass)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game class. Must be A, B, C, or D'
      });
    }

    // Validate each bet amount and calculate total
    let totalBetAmount = 0;
    const validatedBets = [];

    for (let i = 0; i < numbersArray.length; i++) {
      const selectedNumber = numbersArray[i];
      const betAmount = amountsArray[i];

      // Ensure betAmount is a number
      const betAmountNum = Number(betAmount);
      if (isNaN(betAmountNum) || betAmountNum <= 0) {
        return res.status(400).json({
          success: false,
          message: `Bet amount at index ${i} must be a valid number greater than 0`
        });
      }

      // Convert selectedNumber to string for consistent comparison
      const selectedNumberStr = String(selectedNumber);

      // Validate selected number for game class
      if (!GAME_NUMBERS[gameClass].includes(selectedNumberStr)) {
        return res.status(400).json({
          success: false,
          message: `Invalid number ${selectedNumberStr} for game class ${gameClass}. Available numbers: ${GAME_NUMBERS[gameClass].slice(0, 10).join(', ')}...`
        });
      }

      totalBetAmount += betAmountNum;
      validatedBets.push({
        selectedNumber: selectedNumberStr,
        betAmount: betAmountNum
      });
    }

    console.log(`Total bet amount: ${totalBetAmount}`);

    // Check user balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`User ${userId} balance check:`);
    console.log(`- walletBalance: ${user.walletBalance}`);
    console.log(`- wallet: ${user.wallet}`);
    console.log(`- totalBetAmount: ${totalBetAmount}`);
    console.log(`- totalBetAmount type: ${typeof totalBetAmount}`);

    const currentBalance = user.walletBalance || user.wallet || 0;
    console.log(`- currentBalance: ${currentBalance}`);
    console.log(`- comparison: ${currentBalance} < ${totalBetAmount} = ${currentBalance < totalBetAmount}`);

    if (currentBalance < totalBetAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${currentBalance}, Required: ${totalBetAmount}`
      });
    }

    // Get current time slot info
    const currentTimeSlot = getCurrentTimeSlot();
    const timingInfo = getTimingInfo();
    
    // Get or create current round
    let currentRound = await Round.findOne({ status: 'active' });
    if (!currentRound) {
      // Generate a unique round number
      const roundCount = await Round.countDocuments();
      currentRound = new Round({
        gameClass: 'A', // Default to A, since we support all classes in one round
        timeSlot: currentTimeSlot.slot,
        status: 'active'
      });
      await currentRound.save();
    }

    // Create multiple bets
    const createdBets = [];
    const transactions = [];

    for (const betData of validatedBets) {
      const bet = new Bet({
        userId,
        roundId: currentRound._id,
        gameClass,
        selectedNumber: betData.selectedNumber,
        betAmount: betData.betAmount,
        timeSlot: currentTimeSlot.slot,
        status: 'pending'
      });

      await bet.save();
      createdBets.push(bet);

      // Create transaction record for each bet
      const transaction = new Transaction({
        userId,
        type: 'bet_placed',
        amount: -betData.betAmount,
        status: 'completed',
        description: `Bet placed on ${gameClass}-${betData.selectedNumber}`
      });

      await transaction.save();
      transactions.push(transaction);
    }

    // Deduct total amount from wallet
    const previousBalance = user.walletBalance || user.wallet || 0;
    user.walletBalance = previousBalance - totalBetAmount;

    // Also update wallet field for backward compatibility
    user.wallet = user.walletBalance;

    console.log(`Balance updated: ${previousBalance} - ${totalBetAmount} = ${user.walletBalance}`);
    await user.save();

    res.status(201).json({
      success: true,
      message: `${createdBets.length} bet(s) placed successfully`,
      data: {
        bets: createdBets,
        totalBets: createdBets.length,
        totalBetAmount: totalBetAmount,
        newWalletBalance: user.walletBalance,
        remainingBalance: user.walletBalance,
        transactions: transactions
      }
    });
  } catch (err) {
    console.error('Error placing bet(s):', err);
    res.status(500).json({
      success: false,
      message: 'Error placing bet(s)'
    });
  }
};

// Get current user's bets
const getUserBets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, gameClass, status } = req.query;

    // Build query
    const query = { userId };
    if (gameClass) query.gameClass = gameClass;
    if (status) query.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bets = await Bet.find(query)
      .populate('roundId', 'timeSlot status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Update bet status and resultDeclared field based on current status
    const updatedBets = bets.map(bet => {
      let resultDeclared = false;
      if (bet.status === 'won' || bet.status === 'lost') {
        resultDeclared = true;
        bet.resultDeclared = true;
      } else if (bet.status === 'pending') {
        resultDeclared = false;
        bet.resultDeclared = false;
      }

      return {
        ...bet.toObject(),
        resultDeclared
      };
    });

    const totalBets = await Bet.countDocuments(query);
    const totalPages = Math.ceil(totalBets / parseInt(limit));

    res.json({
      success: true,
      data: {
        bets: updatedBets,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBets,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      },
      message: 'User bets fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching user bets:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching user bets'
    });
  }
};

// Get current round information
const getCurrentRound = async (req, res) => {
  try {
    // Get the current time slot properly
    const currentTimeSlot = getCurrentTimeSlot();
    console.log('Current time slot info:', currentTimeSlot);
    
    // Extract just the slot name for database query
    const slotName = currentTimeSlot.slot;
    console.log('Searching for slot:', slotName);
    
    let currentRound = await Round.findOne({ 
      timeSlot: slotName,
      status: 'active' 
    });
    console.log('Found round:', currentRound);

    if (!currentRound) {
      // Create a new round if none exists
      currentRound = new Round({
        gameClass: 'A', // Default to A, since we support all classes in one round
        timeSlot: slotName,
        status: 'active'
      });
      await currentRound.save();
      console.log('Created new round:', currentRound);
    }

    res.json({
      success: true,
      data: currentRound,
      timeSlotInfo: currentTimeSlot,
      message: 'Current round fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching current round:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching current round'
    });
  }
};

// Get game results
const getResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate('roundId', 'roundNumber')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: results,
      message: 'Results fetched successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching results'
    });
  }
};

// Generate winning number (admin-favorable algorithm)
const generateWinningNumber = async (roundId) => {
  try {
    // Get all bets for this round
    const bets = await Bet.find({ roundId, status: 'pending' });

    if (bets.length === 0) {
      // No bets, pick random number from all classes
      const allNumbers = Object.values(GAME_NUMBERS).flat();
      const randomIndex = Math.floor(Math.random() * allNumbers.length);
      return allNumbers[randomIndex];
    }

    // Count total bet amounts for each number
    const numberStats = {};

    // Initialize stats for all possible numbers
    for (const gameClass in GAME_NUMBERS) {
      for (const number of GAME_NUMBERS[gameClass]) {
        numberStats[number] = {
          totalAmount: 0,
          betCount: 0,
          gameClass
        };
      }
    }

    // Calculate stats from bets, considering both direct matches and digit sum matches
    bets.forEach(bet => {
      // Count direct bets on this number
      if (numberStats[bet.selectedNumber]) {
        numberStats[bet.selectedNumber].totalAmount += bet.betAmount;
        numberStats[bet.selectedNumber].betCount += 1;
      }

      // For each potential winning number, check if this bet would win
      for (const potentialWinner in numberStats) {
        if (checkWinningBet(bet.selectedNumber, potentialWinner, bet.gameClass)) {
          numberStats[potentialWinner].totalAmount += bet.betAmount;
          numberStats[potentialWinner].betCount += 1;
        }
      }
    });

    // Find number with least total potential payout (admin favorable)
    let winningNumber = GAME_NUMBERS.D[0]; // Default to '0'
    let minAmount = Infinity;

    for (const [number, stats] of Object.entries(numberStats)) {
      if (stats.totalAmount < minAmount) {
        minAmount = stats.totalAmount;
        winningNumber = number;
      }
    }

    return winningNumber;
  } catch (err) {
    console.error('Error generating winning number:', err);
    // Fallback to random number
    const allNumbers = Object.values(GAME_NUMBERS).flat();
    const randomIndex = Math.floor(Math.random() * allNumbers.length);
    return allNumbers[randomIndex];
  }
};

// Auto-generate results (called by cron job)
const autoGenerateResults = async () => {
  try {
    // Find active round
    const activeRound = await Round.findOne({ status: 'active' });
    if (!activeRound) {
      console.log('No active round found');
      return;
    }

    // Generate winning number
    const winningNumber = await generateWinningNumber(activeRound._id);

    // Find winning game class
    let winningGameClass = 'D';
    for (const [gameClass, numbers] of Object.entries(GAME_NUMBERS)) {
      if (numbers.includes(winningNumber)) {
        winningGameClass = gameClass;
        break;
      }
    }

    // Create result
    const result = new Result({
      roundId: activeRound._id,
      winningNumber: winningNumber,
      gameClass: winningGameClass,
      createdAt: new Date()
    });

    await result.save();

    // Update round status
    activeRound.status = 'completed';
    activeRound.resultDeclaredAt = new Date();
    await activeRound.save();

    // Process all bets for this round
    const bets = await Bet.find({ roundId: activeRound._id, status: 'pending' });

    for (const bet of bets) {
      if (checkWinningBet(bet.selectedNumber, winningNumber, bet.gameClass)) {
        // Winner - multiply by 4
        bet.status = 'won';
        bet.winAmount = bet.betAmount * 4;
        bet.resultDeclared = true;
        bet.resultDeclaredAt = new Date();

        // Add winnings to user wallet
        const user = await User.findById(bet.userId);
        if (user) {
          user.walletBalance += bet.winAmount;
          await user.save();

          // Create winning transaction
          const transaction = new Transaction({
            userId: bet.userId,
            type: 'win',
            amount: bet.winAmount,
            status: 'completed',
            description: `Won ${bet.winAmount} tokens for bet on ${bet.gameClass}-${bet.selectedNumber}, Result: ${winningGameClass}-${winningNumber}`
          });

          await transaction.save();
        }
      } else {
        // Loser
        bet.status = 'lost';
        bet.winAmount = 0;
        bet.resultDeclared = true;
        bet.resultDeclaredAt = new Date();
      }

      await bet.save();
    }

    console.log(`Result generated for round ${activeRound._id}: ${winningGameClass}-${winningNumber}`);
    return result;
  } catch (err) {
    console.error('Error auto-generating results:', err);
  }
};

// Get result for a specific round or timeSlot
const getResultForTimeSlot = async (req, res) => {
  try {
    const { roundId, timeSlot } = req.query;
    let query = {};
    if (roundId) query.roundId = roundId;
    if (timeSlot) query["timeSlot"] = timeSlot;
    let result;
    if (Object.keys(query).length > 0) {
      result = await Result.findOne(query).populate('roundId', 'timeSlot roundNumber');
    } else {
      return res.status(400).json({ success: false, message: 'Provide roundId or timeSlot' });
    }
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching result' });
  }
};

module.exports = {
  getGameNumbers,
  placeBet,
  getUserBets,
  getCurrentRound,
  getResults,
  getResultForTimeSlot,
  generateWinningNumber,
  autoGenerateResults
};
