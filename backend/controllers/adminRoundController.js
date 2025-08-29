const mongoose = require('mongoose');
const Round = require('../models/Round');
const Bet = require('../models/Bet');
const { validationResult } = require('express-validator');

// Get all rounds for a specific date
const getRounds = async(req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        const rounds = await Round.find({
            gameDate: { $gte: startOfDay, $lt: endOfDay }
        }).sort({ createdAt: 1 });

        // If no rounds exist, create them for the day
        if (rounds.length === 0) {
            const newRounds = await initializeDailyRounds(startOfDay);
            return res.json({
                success: true,
                data: { rounds: newRounds }
            });
        }

        res.json({
            success: true,
            data: { rounds }
        });
    } catch (error) {
        console.error('Get rounds error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rounds'
        });
    }
};

// Initialize daily rounds (13 rounds from 11 AM to 12 AM)
const initializeDailyRounds = async(date = new Date()) => {
    try {
        const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Check if rounds already exist
        const existingRounds = await Round.find({
            gameDate: {
                $gte: startDate,
                $lt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingRounds.length > 0) {
            return existingRounds;
        }

        const rounds = [];
        const timeSlots = [
            '10:00 AM - 11:00 AM',
            '11:00 AM - 12:00 PM',
            '12:00 PM - 01:00 PM',
            '01:00 PM - 02:00 PM',
            '02:00 PM - 03:00 PM',
            '03:00 PM - 04:00 PM',
            '04:00 PM - 05:00 PM',
            '05:00 PM - 06:00 PM',
            '06:00 PM - 07:00 PM',
            '07:00 PM - 08:00 PM',
            '08:00 PM - 09:00 PM',
            '09:00 PM - 10:00 PM',
            '10:00 PM - 11:00 PM',
            '11:00 PM - 12:00 AM',
            '12:00 AM - 01:00 AM',
            '01:00 AM - 02:00 AM',
            '02:00 AM - 03:00 AM'
        ];

        // Create rounds for each class (A, B, C, D) and time slot
        for (let i = 0; i < timeSlots.length; i++) {
            for (const gameClass of['A', 'B', 'C', 'D']) {
                rounds.push({
                    gameClass,
                    timeSlot: timeSlots[i],
                    gameDate: startDate,
                    status: 'active',
                    totalBets: 0,
                    totalAmount: 0
                });
            }
        }

        return await Round.insertMany(rounds);
    } catch (error) {
        console.error('Initialize daily rounds error:', error);
        throw error;
    }
};

// Get current active round
const getCurrentRound = async(req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        // Get current time in HH:MM format
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Determine which time slot is currently active
        let activeTimeSlot = null;
        const timeSlots = [
            { start: 10, end: 10, slot: '10:00 AM - 10:50 AM' },
            { start: 11, end: 11, slot: '11:00 AM - 11:50 AM' },
            { start: 12, end: 12, slot: '12:00 PM - 12:50 PM' },
            { start: 13, end: 13, slot: '01:00 PM - 01:50 PM' },
            { start: 14, end: 14, slot: '02:00 PM - 02:50 PM' },
            { start: 15, end: 15, slot: '03:00 PM - 03:50 PM' },
            { start: 16, end: 16, slot: '04:00 PM - 04:50 PM' },
            { start: 17, end: 17, slot: '05:00 PM - 05:50 PM' },
            { start: 18, end: 18, slot: '06:00 PM - 06:50 PM' },
            { start: 19, end: 19, slot: '07:00 PM - 07:50 PM' },
            { start: 20, end: 20, slot: '08:00 PM - 08:50 PM' },
            { start: 21, end: 21, slot: '09:00 PM - 09:50 PM' },
            { start: 22, end: 22, slot: '10:00 PM - 10:50 PM' },
            { start: 23, end: 23, slot: '11:00 PM - 11:50 PM' },
            { start: 0, end: 0, slot: '12:00 AM - 12:50 AM' },
            { start: 1, end: 1, slot: '01:00 AM - 01:50 AM' },
            { start: 2, end: 2, slot: '02:00 AM - 02:50 AM' }
        ];

        for (const timeSlot of timeSlots) {
            if (currentHour === timeSlot.start && currentMinute < 55) {
                activeTimeSlot = timeSlot.slot;
                break;
            }
        }

        if (!activeTimeSlot) {
            return res.json({
                success: true,
                data: {
                    activeRounds: [],
                    message: 'No active rounds at this time'
                }
            });
        }

        const activeRounds = await Round.find({
            gameDate: { $gte: startOfDay, $lt: endOfDay },
            timeSlot: activeTimeSlot,
            status: 'active'
        });

        res.json({
            success: true,
            data: {
                activeRounds,
                currentTimeSlot: activeTimeSlot
            }
        });
    } catch (error) {
        console.error('Get current round error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching current round'
        });
    }
};

// Get betting statistics for a round
const getRoundStats = async(req, res) => {
    try {
        const { roundId } = req.params;

        const round = await Round.findById(roundId);
        if (!round) {
            return res.status(404).json({
                success: false,
                message: 'Round not found'
            });
        }

        // Get all bets for this round
        const bets = await Bet.find({ roundId }).populate('userId', 'username');

        // Calculate number statistics
        const numberStats = {};
        for (let i = 0; i <= 9; i++) {
            numberStats[i] = {
                number: i,
                betCount: 0,
                totalAmount: 0,
                bettors: []
            };
        }

        let totalBets = 0;
        let totalAmount = 0;

        bets.forEach(bet => {
            totalBets++;
            totalAmount += bet.amount;

            bet.numbers.forEach(number => {
                numberStats[number].betCount++;
                numberStats[number].totalAmount += bet.amount;
                numberStats[number].bettors.push({
                    username: bet.userId.username,
                    amount: bet.amount
                });
            });
        });

        // Get least bet numbers for admin selection
        const sortedNumbers = Object.values(numberStats).sort((a, b) => {
            if (a.betCount === b.betCount) {
                return a.totalAmount - b.totalAmount;
            }
            return a.betCount - b.betCount;
        });

        const leastBetNumbers = sortedNumbers.slice(0, 4).map(stat => ({
            ...stat,
            profitability: totalAmount - stat.totalAmount
        }));

        res.json({
            success: true,
            data: {
                round,
                totalBets,
                totalAmount,
                numberStats: Object.values(numberStats),
                leastBetNumbers,
                suggestedResults: leastBetNumbers
            }
        });
    } catch (error) {
        console.error('Get round stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching round statistics'
        });
    }
};

// Declare result for a round
const declareResult = async(req, res) => {
    try {
        console.log('🔍 Declare result called with:', { roundId: req.params.roundId, body: req.body });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(' Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { roundId } = req.params;
        const { resultNumber, adminNotes } = req.body;
        const adminId = req.admin.adminId;

        console.log(' Processing result declaration:', { roundId, resultNumber, adminId });

        const round = await Round.findById(roundId);
        console.log(' Round found:', round ? 'Yes' : 'No');

        if (!round) {
            console.log(' Round not found');
            return res.status(404).json({
                success: false,
                message: 'Round not found'
            });
        }

        console.log(' Round status:', round.status);
        if (round.status === 'completed') {
            console.log(' Result already declared');
            return res.status(400).json({
                success: false,
                message: 'Result already declared for this round'
            });
        }

        // Update round with result
        round.winningNumber = resultNumber.toString();
        round.status = 'completed';
        round.resultDeclaredAt = new Date();
        if (adminNotes) {
            round.adminNotes = adminNotes;
        }

        await round.save();

        // Update all bets for this round
        const bets = await Bet.find({ roundId });

        for (const bet of bets) {
            // Check if the bet is a winner based on game class
            let isWinner = false;

            if (bet.gameClass === 'A') {
                // For Class A, check if selectedNumber matches resultNumber
                isWinner = bet.selectedNumber === resultNumber.toString();
            } else {
                // For Class B, C, D, check if selectedNumber matches resultNumber
                isWinner = bet.selectedNumber === resultNumber.toString();
            }

            if (isWinner) {
                bet.status = 'won';
                bet.winAmount = bet.betAmount * 10; // 1:10 payout ratio

                // Add winning amount to user's wallet
                const User = require('../models/User');
                await User.findByIdAndUpdate(
                    bet.userId, { $inc: { wallet: bet.winAmount } }
                );
            } else {
                bet.status = 'lost';
            }

            await bet.save();
        }

        res.json({
            success: true,
            message: 'Result declared successfully',
            data: {
                round,
                winningNumber: resultNumber,
                totalBets: bets.length,
                winningBets: bets.filter(bet => bet.status === 'won').length
            }
        });
    } catch (error) {
        console.error('Declare result error:', error);
        res.status(500).json({
            success: false,
            message: 'Error declaring result'
        });
    }
};

// Get results history
const getResultsHistory = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { gameClass, date } = req.query;

        const skip = (page - 1) * limit;

        let query = { status: 'completed' };

        if (gameClass) {
            query.gameClass = gameClass;
        }

        if (date) {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
            query.gameDate = { $gte: startOfDay, $lt: endOfDay };
        }

        const [rounds, totalRounds] = await Promise.all([
            Round.find(query)
            .populate('resultDeclaredBy', 'username fullName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
            Round.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                rounds,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalRounds / limit),
                    totalRounds,
                    hasNextPage: page < Math.ceil(totalRounds / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get results history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching results history'
        });
    }
};

// Auto-initialize daily rounds (can be called by cron job)
const autoInitializeRounds = async(req, res) => {
    try {
        const today = new Date();
        const rounds = await initializeDailyRounds(today);

        res.json({
            success: true,
            message: `Initialized ${rounds.length} rounds for today`,
            data: { rounds }
        });
    } catch (error) {
        console.error('Auto initialize rounds error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initializing daily rounds'
        });
    }
};

// Get least bet numbers for a round (for admin result selection)
const getLeastBetNumbers = async(req, res) => {
    try {
        const { roundId } = req.params;

        const round = await Round.findById(roundId);
        if (!round) {
            return res.status(404).json({
                success: false,
                message: 'Round not found'
            });
        }

        // Get betting statistics for this round
        const bettingStats = await Bet.aggregate([
            { $match: { roundId: new mongoose.Types.ObjectId(roundId) } }, // Convert to ObjectId
            {
                $group: {
                    _id: { $toInt: '$selectedNumber' }, // Convert string to integer
                    totalBets: { $sum: 1 },
                    totalAmount: { $sum: '$betAmount' } // Use betAmount field
                }
            },
            { $sort: { totalAmount: 1 } } // Sort by lowest amount first
        ]);

        // Create array of all numbers (0-9) with their betting stats
        const allNumbers = [];
        for (let i = 0; i <= 9; i++) {
            const numberStats = bettingStats.find(stat => stat._id === i);
            allNumbers.push({
                number: i,
                totalBets: numberStats ? numberStats.totalBets : 0,
                totalAmount: numberStats ? numberStats.totalAmount : 0
            });
        }

        // Sort numbers by different criteria for strategic advantage
        const sortedByAmount = [...allNumbers].sort((a, b) => a.totalAmount - b.totalAmount);
        const sortedByBetCount = [...allNumbers].sort((a, b) => a.totalBets - b.totalBets);

        // Combined strategic sorting: prioritize numbers with both low amount AND low bet count
        const strategicNumbers = [...allNumbers].sort((a, b) => {
            // Primary: sort by total amount (lowest first)
            const amountDiff = a.totalAmount - b.totalAmount;
            if (amountDiff !== 0) return amountDiff;

            // Secondary: if amounts are equal, sort by bet count (lowest first)
            return a.totalBets - b.totalBets;
        });

        // Get the most strategic numbers (top 4)
        const leastBetNumbers = strategicNumbers.slice(0, 4);

        // Additional analysis
        const leastAmountNumbers = sortedByAmount.slice(0, 4);
        const leastCountNumbers = sortedByBetCount.slice(0, 4);

        res.json({
            success: true,
            data: {
                roundId: round._id,
                roundNumber: round.roundNumber,
                allNumbers,

                // Strategic recommendations (primary)
                leastBetNumbers,
                strategicRecommendation: leastBetNumbers[0], // Best strategic choice

                // Separate analysis for admin reference
                analysis: {
                    leastAmountNumbers, // Numbers with lowest total amount
                    leastCountNumbers, // Numbers with lowest bet count
                    combinedStrategy: leastBetNumbers // Best of both worlds
                },

                // Summary stats
                summary: {
                    totalBets: bettingStats.reduce((sum, stat) => sum + stat.totalBets, 0),
                    totalAmount: bettingStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
                    averageAmountPerNumber: bettingStats.length > 0 ?
                        bettingStats.reduce((sum, stat) => sum + stat.totalAmount, 0) / 10 : 0,
                    averageBetsPerNumber: bettingStats.length > 0 ?
                        bettingStats.reduce((sum, stat) => sum + stat.totalBets, 0) / 10 : 0
                }
            }
        });
    } catch (error) {
        console.error('Get least bet numbers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching least bet numbers'
        });
    }
};

module.exports = {
    getAllRounds: getRounds,
    getCurrentRound,
    getRoundDetails: getRoundStats,
    createRound: initializeDailyRounds,
    declareResult,
    getLeastBetNumbers,
    initializeDailyRounds: autoInitializeRounds
};