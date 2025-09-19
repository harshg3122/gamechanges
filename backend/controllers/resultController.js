const Result = require("../models/Result");
const Bet = require("../models/Bet");
const SingleDigit = require("../models/SingleDigit");
const TripleDigit = require("../models/TripleDigit");
const Round = require("../models/Round");
const NumberSelection = require("../models/NumberSelection");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const resultService = require("../services/resultService");
const { calculateSingleDigitFromTriple } = require("../utils/numberGenerator");

// GET /api/results/profit-numbers?roundId=...
const getProfitNumbers = async (req, res) => {
  try {
    const { roundId } = req.query;

    if (!roundId) {
      return res.status(400).json({
        success: false,
        message: "roundId is required",
      });
    }

    // Get all bets for the round
    const bets = await NumberSelection.find({ roundId });

    // Calculate profit for each possible winning number
    const profitAnalysis = {};

    // For single digits (0-9)
    for (let digit = 0; digit <= 9; digit++) {
      const digitBets = bets.filter(
        (bet) => bet.classType === "D" && bet.number === digit.toString()
      );
      const totalBetAmount = digitBets.reduce(
        (sum, bet) => sum + bet.amount,
        0
      );
      const potentialPayout = totalBetAmount * 9; // 9x multiplier for single digit

      profitAnalysis[`single_${digit}`] = {
        type: "single",
        number: digit,
        totalBets: digitBets.length,
        totalBetAmount,
        potentialPayout,
        houseProfit: totalBetAmount - potentialPayout,
      };
    }

    // For triple digits, we'll analyze the most bet numbers
    const tripleDigitBets = bets.filter((bet) => bet.classType !== "D");
    const tripleDigitSummary = {};

    tripleDigitBets.forEach((bet) => {
      if (!tripleDigitSummary[bet.number]) {
        tripleDigitSummary[bet.number] = {
          totalBets: 0,
          totalAmount: 0,
        };
      }
      tripleDigitSummary[bet.number].totalBets += 1;
      tripleDigitSummary[bet.number].totalAmount += bet.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        singleDigitAnalysis: profitAnalysis,
        tripleDigitSummary,
        totalBets: bets.length,
        totalBetAmount: bets.reduce((sum, bet) => sum + bet.amount, 0),
      },
    });
  } catch (error) {
    console.error("Error getting profit numbers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// POST /api/results/declare
const declareResult = async (req, res) => {
  try {
    const { roundId, tripleDigitNumber } = req.body;

    if (!roundId || !tripleDigitNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing roundId or tripleDigitNumber",
      });
    }

    // Get admin ID from request (assuming it's set by auth middleware)
    const adminId = req.admin ? req.admin._id : req.user ? req.user._id : null;

    // Declare result using the service
    const result = await resultService.declareResultByAdmin(
      roundId,
      tripleDigitNumber,
      adminId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error in declareResult controller:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET /api/results/view?roundId=...
const viewResult = async (req, res) => {
  try {
    const { roundId } = req.query;
    if (!roundId) {
      return res.status(400).json({
        success: false,
        message: "roundId is required",
      });
    }

    // Check if result exists using service
    const resultResponse = await resultService.getResultForRound(roundId);
    if (resultResponse.success) {
      return res.status(200).json(resultResponse);
    }

    // If no result exists, check if we should auto-declare
    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    // Validate timing for auto-declaration
    const timingValidation =
      resultService.validateResultDeclarationTiming(round);

    // If it's system period (last 1 minute or round ended), auto-declare
    if (timingValidation.isSystemPeriod || timingValidation.roundEnded) {
      try {
        // Initialize numbers if not already done
        await resultService.initializeRoundNumbers(roundId);

        // Auto-generate result
        const autoResult = await resultService.autoGenerateResult(roundId);

        if (autoResult.success) {
          return res.status(200).json(autoResult);
        } else {
          return res.status(400).json(autoResult);
        }
      } catch (error) {
        console.error("Error in auto result generation:", error);
        return res.status(500).json({
          success: false,
          message: "Error auto-generating result",
        });
      }
    } else {
      // Not time for auto-declaration yet
      return res.status(200).json({
        success: false,
        message: timingValidation.message,
        timing: {
          canDeclare: timingValidation.canDeclare,
          isAdminPeriod: timingValidation.isAdminPeriod,
          minutesToEnd: timingValidation.minutesToEnd,
        },
      });
    }
  } catch (err) {
    console.error("Error in viewResult controller:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET /api/results/tables - Get current round tables
const getTables = async (req, res) => {
  try {
    const { roundId } = req.query;

    // If no roundId provided, get current active round
    let round;
    if (roundId) {
      round = await Round.findById(roundId);
    } else {
      round = await Round.findOne({ status: "active" }).sort({ createdAt: -1 });
    }

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "No active round found",
      });
    }

    // Initialize numbers for this round using the service
    const roundNumbers = await resultService.initializeRoundNumbers(round._id);

    // Get all bets for this round to update token amounts
    const bets = await NumberSelection.find({ roundId: round._id });

    // Update single digit table with actual bet amounts
    const singleDigitTable = roundNumbers.singleDigits.map((sd) => {
      const digitBets = bets.filter(
        (bet) => bet.classType === "D" && bet.number === sd.number.toString()
      );
      const actualTokens = digitBets.reduce((sum, bet) => sum + bet.amount, 0);

      return {
        number: sd.number,
        tokens: actualTokens > 0 ? actualTokens : sd.tokens, // Use actual bets or generated tokens
        lock: sd.locked,
      };
    });

    // Update triple digit table with actual bet amounts
    const tripleDigitTable = roundNumbers.tripleDigits.map((td) => {
      const numberBets = bets.filter(
        (bet) => bet.classType !== "D" && bet.number === td.number
      );
      const actualTokens = numberBets.reduce((sum, bet) => sum + bet.amount, 0);

      return {
        number: parseInt(td.number),
        classType: td.classType,
        tokens: actualTokens > 0 ? actualTokens : td.tokens, // Use actual bets or generated tokens
        sumDigits: td.sumDigits,
        onesDigit: td.lastDigit,
        lock: td.locked,
      };
    });

    const statistics = {
      totalBets: bets.length,
      totalBetAmount: bets.reduce((sum, bet) => sum + bet.amount, 0),
      lockedSingleDigitEntries: singleDigitTable.filter((s) => s.lock).length,
      totalSingleDigitEntries: singleDigitTable.length,
      lockedTripleDigitEntries: tripleDigitTable.filter((t) => t.lock).length,
      totalTripleDigitEntries: tripleDigitTable.length,
    };

    res.status(200).json({
      success: true,
      data: {
        roundId: round._id,
        singleDigitTable,
        tripleDigitTable,
        statistics,
      },
    });
  } catch (error) {
    console.error("Error getting tables:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET /api/results/history
const getResultHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const historyResponse = await resultService.getRecentResults(page, limit);

    if (historyResponse.success) {
      res.status(200).json({
        success: true,
        data: {
          results: historyResponse.results,
          pagination: historyResponse.pagination,
        },
      });
    } else {
      res.status(500).json(historyResponse);
    }
  } catch (error) {
    console.error("Error getting result history:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// This function is now handled by resultService.processBetsForResult
// Keeping for backward compatibility but delegating to service
async function processBetsForRound(
  roundId,
  winningDigit,
  winningTripleDigit = null
) {
  try {
    // If we have the winning triple digit, use it; otherwise try to find it from results
    let tripleDigit = winningTripleDigit;
    if (!tripleDigit) {
      const result = await Result.findOne({ roundId });
      if (result) {
        tripleDigit = result.tripleDigitNumber;
      }
    }

    // Use the service function for processing
    if (tripleDigit) {
      await resultService.processBetsForResult(
        roundId,
        tripleDigit,
        winningDigit
      );
    } else {
      console.warn(
        `No triple digit found for round ${roundId}, processing single digit only`
      );
      // Fallback to old logic for single digit only
      const bets = await NumberSelection.find({
        roundId,
        status: "pending",
        classType: "D",
      });

      for (const bet of bets) {
        let isWinner = false;
        let winAmount = 0;

        if (parseInt(bet.number) === winningDigit) {
          isWinner = true;
          winAmount = bet.amount * 9;
        }

        bet.status = isWinner ? "win" : "loss";
        bet.winningAmount = winAmount;
        bet.resultProcessedAt = new Date();
        await bet.save();

        if (isWinner && winAmount > 0) {
          const user = await User.findById(bet.userId);
          if (user) {
            const previousBalance = user.walletBalance || user.wallet || 0;
            user.walletBalance = previousBalance + winAmount;
            user.wallet = user.walletBalance;
            await user.save();

            const transaction = new Transaction({
              userId: bet.userId,
              type: "bet_won",
              amount: winAmount,
              status: "completed",
              description: `Bet won: ${bet.classType}-${bet.number}, Winning digit: ${winningDigit}`,
            });
            await transaction.save();
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing bets for round:", error);
    throw error;
  }
}

module.exports = {
  getProfitNumbers,
  declareResult,
  viewResult,
  getTables,
  getResultHistory,
  processBetsForRound, // Export for backward compatibility
};
