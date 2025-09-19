/**
 * Result Service - Handles all result declaration logic
 * Manages admin result selection, validation, and auto-declaration
 */

const Round = require("../models/Round");
const Result = require("../models/Result");
const TripleDigit = require("../models/TripleDigit");
const SingleDigit = require("../models/SingleDigit");
const Bet = require("../models/Bet");
const NumberSelection = require("../models/NumberSelection");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const {
  generateTripleDigitNumbers,
  generateSingleDigitNumbers,
  calculateSingleDigitFromTriple,
  getValidUnlockedTripleDigit,
  validateTripleDigitSelection,
} = require("../utils/numberGenerator");

/**
 * Initialize numbers for a round (200 triple digits, 10 single digits)
 * @param {ObjectId} roundId - The round ID
 * @returns {Promise<Object>} Object containing generated numbers
 */
async function initializeRoundNumbers(roundId) {
  try {
    // Check if numbers already exist for this round
    const existingTriples = await TripleDigit.countDocuments({ roundId });
    const existingSingles = await SingleDigit.countDocuments({ roundId });

    if (existingTriples > 0 || existingSingles > 0) {
      console.log(`Numbers already initialized for round ${roundId}`);
      return await getRoundNumbers(roundId);
    }

    // Generate triple digit numbers
    const tripleDigitNumbers = generateTripleDigitNumbers();
    const singleDigitNumbers = generateSingleDigitNumbers();

    // Prepare triple digit documents for insertion
    const tripleDigitDocs = tripleDigitNumbers.map((td) => ({
      roundId,
      number: td.number,
      tokens: td.tokens,
      sumDigits: td.sumDigits,
      lastDigit: td.lastDigit,
      locked: td.locked,
      classType: td.classType,
    }));

    // Prepare single digit documents for insertion
    const singleDigitDocs = singleDigitNumbers.map((sd) => ({
      roundId,
      number: sd.number,
      tokens: sd.tokens,
      locked: sd.locked,
    }));

    // Insert all numbers into database
    await TripleDigit.insertMany(tripleDigitDocs);
    await SingleDigit.insertMany(singleDigitDocs);

    console.log(
      `Initialized ${tripleDigitDocs.length} triple digits and ${singleDigitDocs.length} single digits for round ${roundId}`
    );

    return {
      tripleDigits: tripleDigitNumbers,
      singleDigits: singleDigitNumbers,
      statistics: {
        totalTripleDigits: tripleDigitNumbers.length,
        lockedTripleDigits: tripleDigitNumbers.filter((td) => td.locked).length,
        totalSingleDigits: singleDigitNumbers.length,
        lockedSingleDigits: singleDigitNumbers.filter((sd) => sd.locked).length,
      },
    };
  } catch (error) {
    console.error("Error initializing round numbers:", error);
    throw error;
  }
}

/**
 * Get numbers for a specific round
 * @param {ObjectId} roundId - The round ID
 * @returns {Promise<Object>} Object containing round numbers
 */
async function getRoundNumbers(roundId) {
  try {
    const tripleDigits = await TripleDigit.find({ roundId }).lean();
    const singleDigits = await SingleDigit.find({ roundId }).lean();

    return {
      tripleDigits: tripleDigits.map((td) => ({
        number: td.number,
        tokens: td.tokens,
        sumDigits: td.sumDigits,
        lastDigit: td.lastDigit,
        locked: td.locked,
        classType: td.classType,
      })),
      singleDigits: singleDigits.map((sd) => ({
        number: sd.number,
        tokens: sd.tokens,
        locked: sd.locked,
      })),
      statistics: {
        totalTripleDigits: tripleDigits.length,
        lockedTripleDigits: tripleDigits.filter((td) => td.locked).length,
        totalSingleDigits: singleDigits.length,
        lockedSingleDigits: singleDigits.filter((sd) => sd.locked).length,
      },
    };
  } catch (error) {
    console.error("Error getting round numbers:", error);
    throw error;
  }
}

/**
 * Validate admin result selection
 * @param {ObjectId} roundId - The round ID
 * @param {string} tripleDigitNumber - Selected triple digit number
 * @returns {Promise<Object>} Validation result
 */
async function validateAdminSelection(roundId, tripleDigitNumber) {
  try {
    const roundNumbers = await getRoundNumbers(roundId);
    return validateTripleDigitSelection(
      tripleDigitNumber,
      roundNumbers.tripleDigits,
      roundNumbers.singleDigits
    );
  } catch (error) {
    console.error("Error validating admin selection:", error);
    throw error;
  }
}

/**
 * Check if it's time for admin to declare result (last 10 minutes, but not last 1 minute)
 * @param {Object} round - The round object
 * @returns {Object} Timing validation result
 */
function validateResultDeclarationTiming(round) {
  const now = new Date();

  // Parse time slot to get end time
  const timeSlotParts = round.timeSlot.split(" - ");
  if (timeSlotParts.length !== 2) {
    return { canDeclare: false, message: "Invalid time slot format" };
  }

  const endTimeStr = timeSlotParts[1];
  const [time, ampm] = endTimeStr.split(" ");
  const [hours, minutes] = time.split(":").map(Number);

  let endHour = hours;
  if (ampm === "PM" && hours !== 12) endHour += 12;
  if (ampm === "AM" && hours === 12) endHour = 0;

  const roundEndTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    endHour,
    minutes || 0,
    0
  );

  const minutesToEnd = (roundEndTime - now) / (1000 * 60);

  // Admin can declare in last 10 minutes but not in last 1 minute
  if (minutesToEnd > 10) {
    return {
      canDeclare: false,
      isAdminPeriod: false,
      message:
        "Result can only be declared in the last 10 minutes of the round",
      minutesToEnd: Math.ceil(minutesToEnd),
    };
  }

  if (minutesToEnd <= 1 && minutesToEnd > 0) {
    return {
      canDeclare: false,
      isAdminPeriod: false,
      isSystemPeriod: true,
      message:
        "System auto-declaration period. Admin cannot declare result in the last 1 minute",
      minutesToEnd: Math.ceil(minutesToEnd),
    };
  }

  if (minutesToEnd <= 0) {
    return {
      canDeclare: false,
      isAdminPeriod: false,
      isSystemPeriod: true,
      roundEnded: true,
      message: "Round has ended. System should auto-declare result",
      minutesToEnd: 0,
    };
  }

  // Admin period: last 10 minutes but not last 1 minute
  return {
    canDeclare: true,
    isAdminPeriod: true,
    isSystemPeriod: false,
    message: "Admin can declare result now",
    minutesToEnd: Math.ceil(minutesToEnd),
  };
}

/**
 * Declare result by admin
 * @param {ObjectId} roundId - The round ID
 * @param {string} tripleDigitNumber - Selected triple digit number
 * @param {ObjectId} adminId - Admin ID who declared the result
 * @returns {Promise<Object>} Result declaration response
 */
async function declareResultByAdmin(roundId, tripleDigitNumber, adminId) {
  try {
    // Get round details
    const round = await Round.findById(roundId);
    if (!round) {
      return { success: false, message: "Round not found" };
    }

    // Check if result already declared
    const existingResult = await Result.findOne({ roundId });
    if (existingResult) {
      return {
        success: false,
        message: "Result already declared for this round",
      };
    }

    // Validate timing
    const timingValidation = validateResultDeclarationTiming(round);
    if (!timingValidation.canDeclare) {
      return { success: false, message: timingValidation.message };
    }

    // Validate selection
    const selectionValidation = await validateAdminSelection(
      roundId,
      tripleDigitNumber
    );
    if (!selectionValidation.success) {
      return { success: false, message: selectionValidation.message };
    }

    // Create result
    const result = new Result({
      roundId,
      date: round.gameDate
        ? round.gameDate.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      timeSlot: round.timeSlot,
      tripleDigitNumber: tripleDigitNumber,
      singleDigitResult: selectionValidation.result.singleDigit.toString(),
      declaredBy: "admin",
      sumOfTripleDigit: selectionValidation.result.sum,
      isAutoGenerated: false,
    });

    await result.save();

    // Update round status
    await Round.findByIdAndUpdate(roundId, {
      status: "completed",
      winningNumber: tripleDigitNumber,
      resultDeclaredAt: new Date(),
    });

    // Process bets for this round
    await processBetsForResult(
      roundId,
      tripleDigitNumber,
      selectionValidation.result.singleDigit
    );

    console.log(
      `Admin declared result for round ${roundId}: ${tripleDigitNumber} -> ${selectionValidation.result.singleDigit}`
    );

    return {
      success: true,
      result: result,
      message: "Result declared successfully",
    };
  } catch (error) {
    console.error("Error declaring result by admin:", error);
    throw error;
  }
}

/**
 * Auto-declare result by system
 * @param {ObjectId} roundId - The round ID
 * @returns {Promise<Object>} Result declaration response
 */
async function autoGenerateResult(roundId) {
  try {
    // Get round details
    const round = await Round.findById(roundId);
    if (!round) {
      return { success: false, message: "Round not found" };
    }

    // Check if result already declared
    const existingResult = await Result.findOne({ roundId });
    if (existingResult) {
      return {
        success: false,
        message: "Result already declared for this round",
      };
    }

    // Get round numbers
    const roundNumbers = await getRoundNumbers(roundId);

    // Get a valid unlocked triple digit
    const selectedTriple = getValidUnlockedTripleDigit(
      roundNumbers.tripleDigits,
      roundNumbers.singleDigits
    );

    if (!selectedTriple) {
      // Fallback: If no valid triple digit found, unlock a single digit and try again
      console.log(
        "No valid unlocked triple digit found, attempting fallback..."
      );

      // Find any unlocked triple digit
      const unlockedTriples = roundNumbers.tripleDigits.filter(
        (td) => !td.locked
      );
      if (unlockedTriples.length === 0) {
        return {
          success: false,
          message: "No unlocked triple digits available for auto-generation",
        };
      }

      // Pick the first unlocked triple
      const fallbackTriple = unlockedTriples[0];
      const fallbackResult = calculateSingleDigitFromTriple(
        fallbackTriple.number
      );

      // Unlock the corresponding single digit
      await SingleDigit.updateOne(
        { roundId, number: fallbackResult.singleDigit },
        { locked: false }
      );

      console.log(
        `Unlocked single digit ${fallbackResult.singleDigit} for fallback auto-declaration`
      );

      // Create result with fallback
      const resultDoc = new Result({
        roundId,
        date: round.gameDate
          ? round.gameDate.toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        timeSlot: round.timeSlot,
        tripleDigitNumber: fallbackTriple.number,
        singleDigitResult: fallbackResult.singleDigit.toString(),
        declaredBy: "system",
        sumOfTripleDigit: fallbackResult.sum,
        isAutoGenerated: true,
      });

      await resultDoc.save();

      // Update round status
      await Round.findByIdAndUpdate(roundId, {
        status: "completed",
        winningNumber: fallbackTriple.number,
        resultDeclaredAt: new Date(),
      });

      // Process bets for this round
      await processBetsForResult(
        roundId,
        fallbackTriple.number,
        fallbackResult.singleDigit
      );

      console.log(
        `System auto-declared result (fallback) for round ${roundId}: ${fallbackTriple.number} -> ${fallbackResult.singleDigit}`
      );

      return {
        success: true,
        result: resultDoc,
        message: "Result auto-generated successfully (with fallback)",
        autoGenerated: true,
        fallbackUsed: true,
      };
    }

    const result = calculateSingleDigitFromTriple(selectedTriple);

    // Create result
    const resultDoc = new Result({
      roundId,
      date: round.gameDate
        ? round.gameDate.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      timeSlot: round.timeSlot,
      tripleDigitNumber: selectedTriple,
      singleDigitResult: result.singleDigit.toString(),
      declaredBy: "system",
      sumOfTripleDigit: result.sum,
      isAutoGenerated: true,
    });

    await resultDoc.save();

    // Update round status
    await Round.findByIdAndUpdate(roundId, {
      status: "completed",
      winningNumber: selectedTriple,
      resultDeclaredAt: new Date(),
    });

    // Process bets for this round
    await processBetsForResult(roundId, selectedTriple, result.singleDigit);

    console.log(
      `System auto-declared result for round ${roundId}: ${selectedTriple} -> ${result.singleDigit}`
    );

    return {
      success: true,
      result: resultDoc,
      message: "Result auto-generated successfully",
      autoGenerated: true,
    };
  } catch (error) {
    console.error("Error auto-generating result:", error);
    throw error;
  }
}

/**
 * Process bets and update user balances based on result
 * @param {ObjectId} roundId - The round ID
 * @param {string} winningTripleDigit - The winning triple digit
 * @param {number} winningSingleDigit - The winning single digit
 */
async function processBetsForResult(
  roundId,
  winningTripleDigit,
  winningSingleDigit
) {
  try {
    // Find all bets for this round
    const bets = await NumberSelection.find({ roundId, status: "pending" });

    console.log(`Processing ${bets.length} bets for round ${roundId}`);

    for (const bet of bets) {
      let isWinner = false;
      let winAmount = 0;

      // Check if bet is a winner based on class type
      if (bet.classType === "D") {
        // Single digit bet - check against winning single digit
        if (parseInt(bet.number) === winningSingleDigit) {
          isWinner = true;
          winAmount = bet.amount * 9; // 9x multiplier for single digit
        }
      } else {
        // Triple digit bet - check against winning triple digit
        if (bet.number === winningTripleDigit) {
          isWinner = true;
          // Different multipliers based on class
          const multiplier =
            bet.classType === "A"
              ? 100
              : bet.classType === "B"
              ? 200
              : bet.classType === "C"
              ? 500
              : 100;
          winAmount = bet.amount * multiplier;
        }
      }

      // Update bet status
      bet.status = isWinner ? "win" : "loss";
      bet.winningAmount = winAmount;
      bet.resultProcessedAt = new Date();
      await bet.save();

      // If winner, add to user balance and create transaction
      if (isWinner && winAmount > 0) {
        const user = await User.findById(bet.userId);
        if (user) {
          const previousBalance = user.walletBalance || user.wallet || 0;
          user.walletBalance = previousBalance + winAmount;
          user.wallet = user.walletBalance; // Keep both fields in sync
          await user.save();

          // Create transaction record
          const transaction = new Transaction({
            userId: bet.userId,
            type: "bet_won",
            amount: winAmount,
            status: "completed",
            description: `Bet won: ${bet.classType}-${bet.number}, Result: ${winningTripleDigit}/${winningSingleDigit}`,
          });
          await transaction.save();

          console.log(
            `✅ User ${bet.userId} won ₹${winAmount} for bet ${bet._id}`
          );
        }
      }
    }

    console.log(`Processed all bets for round ${roundId}`);
  } catch (error) {
    console.error("Error processing bets:", error);
    throw error;
  }
}

/**
 * Get result for a specific round
 * @param {ObjectId} roundId - The round ID
 * @returns {Promise<Object>} Result data
 */
async function getResultForRound(roundId) {
  try {
    const result = await Result.findOne({ roundId }).lean();
    if (!result) {
      return { success: false, message: "Result not found for this round" };
    }

    return {
      success: true,
      result: result,
    };
  } catch (error) {
    console.error("Error getting result for round:", error);
    throw error;
  }
}

/**
 * Get recent results with pagination
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} Results data
 */
async function getRecentResults(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;

    const results = await Result.find({})
      .sort({ declaredAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("roundId", "gameClass timeSlot")
      .lean();

    const totalResults = await Result.countDocuments({});

    return {
      success: true,
      results: results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        totalResults: totalResults,
        hasNext: page < Math.ceil(totalResults / limit),
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting recent results:", error);
    throw error;
  }
}

module.exports = {
  initializeRoundNumbers,
  getRoundNumbers,
  validateAdminSelection,
  validateResultDeclarationTiming,
  declareResultByAdmin,
  autoGenerateResult,
  processBetsForResult,
  getResultForRound,
  getRecentResults,
};
