/**
 * Admin Result Controller - Handles admin-specific result operations
 * Comprehensive result declaration with proper validation and error messages
 */

const Round = require("../models/Round");
const Result = require("../models/Result");
const TripleDigit = require("../models/TripleDigit");
const SingleDigit = require("../models/SingleDigit");
const resultService = require("../services/resultService");
const { calculateSingleDigitFromTriple } = require("../utils/numberGenerator");

/**
 * Get current round with numbers for admin panel
 * GET /api/admin-panel/results/current-round
 */
const getCurrentRoundForAdmin = async (req, res) => {
  try {
    // Get current active round
    let currentRound = await Round.findOne({ status: "active" }).sort({
      createdAt: -1,
    });

    if (!currentRound) {
      // Create a new round if none exists
      const now = new Date();
      const currentHour = now.getHours();
      let timeSlot;

      if (currentHour >= 10 && currentHour < 11) {
        timeSlot = "10:00 AM - 11:00 AM";
      } else if (currentHour >= 11 && currentHour < 12) {
        timeSlot = "11:00 AM - 12:00 PM";
      } else if (currentHour >= 12 && currentHour < 13) {
        timeSlot = "12:00 PM - 01:00 PM";
      } else if (currentHour >= 13 && currentHour < 14) {
        timeSlot = "01:00 PM - 02:00 PM";
      } else if (currentHour >= 14 && currentHour < 15) {
        timeSlot = "02:00 PM - 03:00 PM";
      } else if (currentHour >= 15 && currentHour < 16) {
        timeSlot = "03:00 PM - 04:00 PM";
      } else if (currentHour >= 16 && currentHour < 17) {
        timeSlot = "04:00 PM - 05:00 PM";
      } else if (currentHour >= 17 && currentHour < 18) {
        timeSlot = "05:00 PM - 06:00 PM";
      } else if (currentHour >= 18 && currentHour < 19) {
        timeSlot = "06:00 PM - 07:00 PM";
      } else if (currentHour >= 19 && currentHour < 20) {
        timeSlot = "07:00 PM - 08:00 PM";
      } else if (currentHour >= 20 && currentHour < 21) {
        timeSlot = "08:00 PM - 09:00 PM";
      } else if (currentHour >= 21 && currentHour < 22) {
        timeSlot = "09:00 PM - 10:00 PM";
      } else if (currentHour >= 22 && currentHour < 23) {
        timeSlot = "10:00 PM - 11:00 PM";
      } else {
        timeSlot = "11:00 PM - 12:00 AM";
      }

      currentRound = new Round({
        gameClass: "A",
        timeSlot: timeSlot,
        status: "active",
      });
      await currentRound.save();
    }

    // Initialize numbers for this round
    const roundNumbers = await resultService.initializeRoundNumbers(
      currentRound._id
    );

    // Get timing validation
    const timingValidation =
      resultService.validateResultDeclarationTiming(currentRound);

    // Check if result already exists
    const existingResult = await Result.findOne({ roundId: currentRound._id });

    res.json({
      success: true,
      round: currentRound,
      numbers: roundNumbers,
      timing: timingValidation,
      resultDeclared: !!existingResult,
      result: existingResult,
    });
  } catch (error) {
    console.error("Error getting current round for admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Declare result with comprehensive validation
 * POST /api/admin-panel/results/declare
 */
const declareResultByAdmin = async (req, res) => {
  try {
    const { roundId, tripleDigitNumber } = req.body;

    if (!roundId || !tripleDigitNumber) {
      return res.status(400).json({
        success: false,
        error: "MISSING_PARAMETERS",
        message: "Round ID and triple digit number are required",
      });
    }

    // Validate triple digit format
    if (!/^\d{3}$/.test(tripleDigitNumber)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_FORMAT",
        message: "Triple digit number must be exactly 3 digits",
      });
    }

    // Get round
    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        error: "ROUND_NOT_FOUND",
        message: "Round not found",
      });
    }

    // Check if result already declared
    const existingResult = await Result.findOne({ roundId });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        error: "RESULT_ALREADY_DECLARED",
        message: "Result has already been declared for this round",
      });
    }

    // Validate timing
    const timingValidation =
      resultService.validateResultDeclarationTiming(round);
    if (!timingValidation.canDeclare) {
      return res.status(400).json({
        success: false,
        error: "INVALID_TIMING",
        message: timingValidation.message,
        timing: timingValidation,
      });
    }

    // Check if triple digit exists and is not locked
    const tripleDigit = await TripleDigit.findOne({
      roundId,
      number: tripleDigitNumber,
    });

    if (!tripleDigit) {
      return res.status(400).json({
        success: false,
        error: "TRIPLE_NOT_FOUND",
        message: "Triple digit number not found in current round",
      });
    }

    if (tripleDigit.locked) {
      return res.status(400).json({
        success: false,
        error: "TRIPLE_LOCKED",
        message: `Triple digit ${tripleDigitNumber} is locked. Please choose another number.`,
        tripleDigit: tripleDigitNumber,
      });
    }

    // Calculate resulting single digit
    const calculation = calculateSingleDigitFromTriple(tripleDigitNumber);
    const resultingSingleDigit = calculation.singleDigit;

    // Check if resulting single digit is locked
    const singleDigit = await SingleDigit.findOne({
      roundId,
      number: resultingSingleDigit,
    });

    if (singleDigit && singleDigit.locked) {
      return res.status(400).json({
        success: false,
        error: "SINGLE_LOCKED",
        message: `The sum ${calculation.sum} results in digit ${resultingSingleDigit} which is locked. Please choose another triple digit number.`,
        calculation: {
          tripleDigit: tripleDigitNumber,
          sum: calculation.sum,
          singleDigit: resultingSingleDigit,
        },
      });
    }

    // Get admin ID
    const adminId = req.admin ? req.admin._id : req.user ? req.user._id : null;

    // Declare result using service
    const result = await resultService.declareResultByAdmin(
      roundId,
      tripleDigitNumber,
      adminId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "DECLARATION_FAILED",
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: "Result declared successfully",
      result: result.result,
      calculation: {
        tripleDigit: tripleDigitNumber,
        sum: calculation.sum,
        singleDigit: resultingSingleDigit,
      },
    });
  } catch (error) {
    console.error("Error declaring result by admin:", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};

/**
 * Get profit analysis for admin decision making
 * GET /api/admin-panel/results/profit-analysis
 */
const getProfitAnalysis = async (req, res) => {
  try {
    const { roundId } = req.query;

    if (!roundId) {
      return res.status(400).json({
        success: false,
        message: "Round ID is required",
      });
    }

    // Get round numbers
    const roundNumbers = await resultService.getRoundNumbers(roundId);

    // Calculate profit analysis for each unlocked triple digit
    const profitAnalysis = [];

    for (const triple of roundNumbers.tripleDigits) {
      if (!triple.locked) {
        const calculation = calculateSingleDigitFromTriple(triple.number);
        const singleDigit = roundNumbers.singleDigits.find(
          (sd) => sd.number === calculation.singleDigit
        );

        profitAnalysis.push({
          tripleDigit: triple.number,
          tokens: triple.tokens,
          sum: calculation.sum,
          resultingSingleDigit: calculation.singleDigit,
          singleDigitLocked: singleDigit ? singleDigit.locked : false,
          canSelect: !singleDigit || !singleDigit.locked,
        });
      }
    }

    // Sort by tokens (descending) to show most profitable first
    profitAnalysis.sort((a, b) => b.tokens - a.tokens);

    res.json({
      success: true,
      analysis: profitAnalysis,
      summary: {
        totalUnlockedTriples: profitAnalysis.length,
        selectableTriples: profitAnalysis.filter((p) => p.canSelect).length,
        lockedDueToSingleDigit: profitAnalysis.filter((p) => !p.canSelect)
          .length,
      },
    });
  } catch (error) {
    console.error("Error getting profit analysis:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get result status for a round
 * GET /api/admin-panel/results/status
 */
const getResultStatus = async (req, res) => {
  try {
    const { roundId } = req.query;

    if (!roundId) {
      return res.status(400).json({
        success: false,
        message: "Round ID is required",
      });
    }

    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    const result = await Result.findOne({ roundId });
    const timingValidation =
      resultService.validateResultDeclarationTiming(round);

    res.json({
      success: true,
      round: {
        id: round._id,
        timeSlot: round.timeSlot,
        status: round.status,
      },
      result: result,
      timing: timingValidation,
      canDeclare: timingValidation.canDeclare && !result,
    });
  } catch (error) {
    console.error("Error getting result status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getCurrentRoundForAdmin,
  declareResultByAdmin,
  getProfitAnalysis,
  getResultStatus,
};
