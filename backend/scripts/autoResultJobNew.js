/**
 * Auto Result Job - Generates automated results for game rounds
 * This automatically generates results for completed rounds when admin is not available
 */

const mongoose = require('mongoose');
const Round = require('../models/Round');
const Result = require('../models/Result');
const Bet = require('../models/Bet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

let jobRunning = false;

/**
 * Generates a random winning number based on game class using predefined number lists
 */
function generateWinningNumber(gameClass) {
    switch (gameClass) {
        case 'A':
            const classANumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            return classANumbers[Math.floor(Math.random() * classANumbers.length)];

        case 'B':
            const classBNumbers = [
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
            ];
            return classBNumbers[Math.floor(Math.random() * classBNumbers.length)];

        case 'C':
            const classCNumbers = [
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
            ];
            return classCNumbers[Math.floor(Math.random() * classCNumbers.length)];

        case 'D':
            const classDNumbers = ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'];
            return classDNumbers[Math.floor(Math.random() * classDNumbers.length)];

        default:
            return Math.floor(Math.random() * 1000).toString();
    }
}

/**
 * Calculate winnings for a bet
 */
function calculateWinnings(selectedNumber, winningNumber, betAmount, gameClass) {
    // Direct match always wins
    if (selectedNumber === winningNumber) {
        const multiplier = gameClass === 'D' ? 9 : gameClass === 'C' ? 500 : gameClass === 'B' ? 200 : 100;
        return betAmount * multiplier;
    }

    // For Class D, check if the selected digit matches the winning digit
    if (gameClass === 'D') {
        const selectedDigit = parseInt(selectedNumber);
        const winningDigit = parseInt(winningNumber);
        if (selectedDigit === winningDigit) {
            return betAmount * 9;
        }
    }

    // For Class A and B, check if selected single digit matches the unit digit of result
    if ((gameClass === 'A' || gameClass === 'B') && selectedNumber.length === 1 && winningNumber.length === 3) {
        const selectedDigit = parseInt(selectedNumber);
        const winningDigit = parseInt(winningNumber) % 10;
        if (selectedDigit === winningDigit) {
            return betAmount * 9;
        }
    }

    // For Class C, check exact match only (no single digit betting)
    if (gameClass === 'C') {
        return 0; // Only exact matches win for Class C
    }

    return 0;
}

/**
 * Process results for completed rounds
 */
async function processCompletedRounds() {
    try {
        // Find active rounds that should be completed (past their end time)
        const completedRounds = await Round.find({
            status: 'active',
            createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // 30 minutes old
        });

        for (const round of completedRounds) {
            console.log(`Processing round ${round._id} for ${round.gameClass || 'mixed'}`);

            // Get all bets for this round
            const bets = await Bet.find({ roundId: round._id, status: 'pending' });

            if (bets.length === 0) {
                console.log(`No bets found for round ${round._id}, skipping`);
                continue;
            }

            // Group bets by game class
            const betsByClass = {};
            bets.forEach(bet => {
                if (!betsByClass[bet.gameClass]) {
                    betsByClass[bet.gameClass] = [];
                }
                betsByClass[bet.gameClass].push(bet);
            });

            // Generate results for each game class
            for (const [gameClass, classBets] of Object.entries(betsByClass)) {
                const winningNumber = generateWinningNumber(gameClass);

                // Create result
                const result = new Result({
                    roundId: round._id,
                    gameClass,
                    winningNumber,
                    totalBets: classBets.length,
                    totalAmount: classBets.reduce((sum, bet) => sum + bet.betAmount, 0),
                    winningAmount: 0,
                    resultDeclaredAt: new Date()
                });

                let totalWinningAmount = 0;

                // Process each bet
                for (const bet of classBets) {
                    const winAmount = calculateWinnings(bet.selectedNumber, winningNumber, bet.betAmount, gameClass);

                    // Update bet
                    bet.status = winAmount > 0 ? 'won' : 'lost';
                    bet.winAmount = winAmount;
                    bet.resultDeclared = true;
                    bet.resultDeclaredAt = new Date();
                    await bet.save();

                    totalWinningAmount += winAmount;

                    // If won, add to user balance
                    if (winAmount > 0) {
                        const user = await User.findById(bet.userId);
                        if (user) {
                            const previousBalance = user.walletBalance || user.wallet || 0;
                            user.walletBalance = previousBalance + winAmount;
                            user.wallet = user.walletBalance; // Keep both fields in sync
                            await user.save();

                            // Create transaction record
                            const transaction = new Transaction({
                                userId: bet.userId,
                                type: 'bet_won',
                                amount: winAmount,
                                status: 'completed',
                                description: `Bet won: ${gameClass}-${bet.selectedNumber}, Result: ${winningNumber}`
                            });
                            await transaction.save();

                            console.log(`✅ User ${bet.userId} won ₹${winAmount} for bet ${bet._id}`);
                        }
                    }
                }

                result.winningAmount = totalWinningAmount;
                await result.save();

                console.log(`✅ Result generated for ${gameClass}: ${winningNumber} (${classBets.length} bets, ₹${totalWinningAmount} winnings)`);
            }

            // Mark round as completed
            round.status = 'completed';
            await round.save();
        }

    } catch (error) {
        console.error('❌ Error processing completed rounds:', error);
    }
}

/**
 * Auto result generation job
 */
async function startAutoResultJob() {
    console.log('🎯 Auto Result Job started - will process results every 2 minutes');

    // Run immediately once
    setTimeout(processCompletedRounds, 5000); // Wait 5 seconds after startup

    // Then run every 2 minutes
    setInterval(async() => {
        if (jobRunning) {
            console.log('⏳ Previous job still running, skipping...');
            return;
        }

        jobRunning = true;
        try {
            await processCompletedRounds();
        } finally {
            jobRunning = false;
        }
    }, 2 * 60 * 1000); // Every 2 minutes
}

module.exports = {
    startAutoResultJob,
    generateWinningNumber,
    calculateWinnings
};