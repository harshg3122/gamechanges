const Result = require("../models/Result");
const Bet = require("../models/Bet");
const SingleDigit = require("../models/SingleDigit");
const TripleDigit = require("../models/TripleDigit");
const Round = require("../models/Round");
const LockedNumber = require("../models/LockedNumber");
const {
  isNumberLocked,
  getUnlockedTripleDigit,
  updateLockingMechanismByRoundId,
} = require("../utils/lockingMechanism");

// Helper: calculate single digit from triple digit
function getSingleDigit(triple) {
  const sum = triple.split("").reduce((acc, d) => acc + parseInt(d, 10), 0);
  return (sum % 10).toString();
}

// Helper: check if single digit is locked
async function isSingleDigitLocked(roundId, digit) {
  return await isNumberLocked(roundId, "single", digit.toString());
}

// GET /api/results/profit-numbers?roundId=...
const getProfitNumbers = async (req, res) => {
  try {
    const { roundId } = req.query;
    if (!roundId)
      return res
        .status(400)
        .json({ success: false, message: "Missing roundId" });
    const round = await Round.findById(roundId);
    if (!round)
      return res
        .status(404)
        .json({ success: false, message: "Round not found" });

    // Initialize locking mechanism if not already done
    await updateLockingMechanismByRoundId(roundId);

    // Get all bets for this round, class A (single digit)
    const bets = await Bet.find({ roundId, gameClass: "A" });
    const numberStats = {};
    for (const bet of bets) {
      const num = bet.selectedNumber;
      if (!numberStats[num]) numberStats[num] = { tokens: 0 };
      numberStats[num].tokens += bet.betAmount;
    }
    // For each single digit, check lock status
    const profitNumbers = await Promise.all(
      Object.entries(numberStats).map(async ([number, stat]) => {
        const locked = await isNumberLocked(roundId, "single", number);
        return {
          number,
          tokens: stat.tokens,
          locked,
        };
      })
    );
    res.status(200).json({ success: true, profitNumbers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/results/declare
const declareResult = async (req, res) => {
  try {
    const { roundId, tripleDigitNumber } = req.body;
    if (!roundId || !tripleDigitNumber) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing roundId or tripleDigitNumber",
        });
    }
    const round = await Round.findById(roundId);
    if (!round)
      return res
        .status(404)
        .json({ success: false, message: "Round not found" });
    const date = round.gameDate
      ? round.gameDate.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const timeSlot = round.timeSlot;

    // Initialize locking mechanism if not already done
    await updateLockingMechanismByRoundId(roundId);

    // First check if the provided triple digit is locked
    const tripleDigitLocked = await isNumberLocked(
      roundId,
      "triple",
      tripleDigitNumber
    );
    if (tripleDigitLocked) {
      return res.status(400).json({
        success: false,
        message:
          "The selected triple digit number is locked. Please choose another number.",
      });
    }

    // Calculate the single digit result from the triple digit
    let triple = tripleDigitNumber;
    let singleDigit = getSingleDigit(triple);

    // Check if the resulting single digit is locked
    let singleDigitLocked = await isNumberLocked(
      roundId,
      "single",
      singleDigit
    );
    if (singleDigitLocked) {
      return res.status(400).json({
        success: false,
        message:
          "The resulting single digit is locked. Please choose another triple digit number.",
      });
    }

    // Check if a result already exists for this round
    const existingResult = await Result.findOne({ roundId });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: "A result has already been declared for this round.",
      });
    }

    // Save result
    const result = new Result({
      roundId,
      date,
      timeSlot,
      tripleDigitNumber: triple,
      singleDigitResult: singleDigit,
    });
    await result.save();

    // Update round status to indicate result has been declared
    await Round.findByIdAndUpdate(roundId, { status: "completed" });

    // Process bets for this round
    await processBetsForRound(roundId, singleDigit);

    res.status(201).json({
      success: true,
      result,
      message: `Result declared successfully: Triple digit ${triple} results in single digit ${singleDigit}`,
    });
  } catch (err) {
    console.error("Error declaring result:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Process bets for a round after result declaration
async function processBetsForRound(roundId, winningDigit) {
  try {
    console.log(
      `Processing bets for round ${roundId} with winning digit ${winningDigit}`
    );

    // Get all bets for this round
    const bets = await Bet.find({ roundId, status: "pending" });
    console.log(`Found ${bets.length} bets to process`);

    // Process each bet
    for (const bet of bets) {
      // Check if bet wins
      const isWinning = bet.selectedNumber === winningDigit;

      // Calculate payout based on game class
      let payout = 0;
      if (isWinning) {
        // Get payout multiplier from settings
        const settings = await Settings.findOne({});
        const multiplier = settings?.payoutMultiplier || 9; // Default to 9x if not set

        payout = bet.betAmount * multiplier;

        // Update user balance
        await User.findByIdAndUpdate(bet.userId, {
          $inc: { walletBalance: payout },
        });

        // Create transaction record for winning
        const transaction = new Transaction({
          userId: bet.userId,
          type: "bet_win",
          amount: payout,
          status: "completed",
          description: `Won bet on ${bet.gameClass}-${bet.selectedNumber}`,
        });
        await transaction.save();
      }

      // Update bet status
      bet.status = isWinning ? "won" : "lost";
      bet.payout = isWinning ? payout : 0;
      await bet.save();
    }

    console.log(`Processed ${bets.length} bets for round ${roundId}`);
  } catch (error) {
    console.error("Error processing bets:", error);
  }
}

// GET /api/results/view?roundId=...
const viewResult = async (req, res) => {
  try {
    const { roundId } = req.query;
    if (!roundId)
      return res
        .status(400)
        .json({ success: false, message: "Missing roundId" });
    let result = await Result.findOne({ roundId });
    if (result) {
      return res.status(200).json({ success: true, result });
    }

    // No result yet, check if we are in the last 2 minutes of the slot
    const round = await Round.findById(roundId);
    if (!round)
      return res
        .status(404)
        .json({ success: false, message: "Round not found" });
    const now = new Date();
    const timeSlot = round.timeSlot; // e.g., "10:00 AM - 11:00 AM"
    // Parse slot end time
    let slotEnd = null;
    if (timeSlot) {
      const match = timeSlot.match(/-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        slotEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hour,
          minute,
          0,
          0
        );
        // If slotEnd is in the past (e.g., after midnight), add a day
        if (slotEnd < now && now.getHours() - hour > 2)
          slotEnd.setDate(slotEnd.getDate() + 1);
      }
    }
    if (!slotEnd) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid timeSlot format" });
    }
    const diffToEnd = (slotEnd - now) / 60000; // minutes until slot end
    if (diffToEnd <= 2 && diffToEnd >= 0) {
      // Auto-declare result in last 2 minutes
      const date = round.gameDate
        ? round.gameDate.toISOString().slice(0, 10)
        : null;

      // Initialize locking mechanism if not already done
      await updateLockingMechanismByRoundId(roundId);

      try {
        // Get an unlocked triple digit
        const triple = await getUnlockedTripleDigit(roundId);
        const singleDigit = getSingleDigit(triple);

        // Verify the single digit is not locked
        const singleDigitLocked = await isNumberLocked(
          roundId,
          "single",
          singleDigit
        );
        if (singleDigitLocked) {
          // This is unlikely since we're selecting from unlocked triples
          return res.status(400).json({
            success: false,
            message:
              "Could not find a valid triple digit with unlocked single digit result.",
          });
        }
        result = new Result({
          roundId,
          date,
          timeSlot,
          tripleDigitNumber: triple,
          singleDigitResult: singleDigit,
        });
        await result.save();

        // Process bets for this round
        await processBetsForRound(roundId, singleDigit);

        // Update round status to indicate result has been declared
        await Round.findByIdAndUpdate(roundId, { status: "completed" });

        return res
          .status(200)
          .json({ success: true, result, autoDeclared: true });
      } catch (error) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "No unlocked triple digit numbers found to declare result.",
          });
      }
    } else {
      // Not in last 2 minutes
      return res
        .status(200)
        .json({
          success: false,
          message:
            "Result not declared yet. Auto-declare will happen in the last 2 minutes of the slot.",
        });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/results/tables?roundId=...
const getTables = async (req, res) => {
  try {
    const { roundId } = req.query;
    if (!roundId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing roundId" });
    }
    // Fetch round to get date and timeSlot
    const round = await Round.findById(roundId);
    if (!round) {
      return res
        .status(404)
        .json({ success: false, message: "Round not found" });
    }

    // Initialize locking mechanism if not already done
    await updateLockingMechanismByRoundId(roundId);

    // Get locked numbers for this round
    const lockedNumbers = await LockedNumber.find({ roundId }).lean();

    // Separate single and triple digits
    const lockedSingleDigits = lockedNumbers.filter(
      (ln) => ln.numberType === "single"
    );
    const lockedTripleDigits = lockedNumbers.filter(
      (ln) => ln.numberType === "triple"
    );

    // Get all bets for this round to calculate tokens
    const bets = await Bet.find({ roundId });

    // Create single digit table with tokens and lock status
    const singleDigitTable = Array.from({ length: 10 }, (_, i) => {
      const digit = i.toString();
      const isLocked = lockedSingleDigits.some((ln) => ln.number === digit);
      const totalTokens = bets
        .filter((bet) => bet.gameClass === "A" && bet.selectedNumber === digit)
        .reduce((sum, bet) => sum + bet.betAmount, 0);

      return {
        number: i,
        tokens: totalTokens,
        lock: isLocked,
      };
    });

    // Create triple digit table - show only numbers with bets or locked status
    const tripleDigitStats = {};

    // Add bets data
    bets
      .filter((bet) => bet.gameClass !== "A" && bet.selectedNumber.length === 3)
      .forEach((bet) => {
        const number = bet.selectedNumber;
        if (!tripleDigitStats[number]) {
          tripleDigitStats[number] = { tokens: 0, classType: bet.gameClass };
        }
        tripleDigitStats[number].tokens += bet.betAmount;
      });

    // Add locked triple digits
    lockedTripleDigits.forEach((ln) => {
      if (!tripleDigitStats[ln.number]) {
        tripleDigitStats[ln.number] = { tokens: 0, classType: "N/A" };
      }
    });

    // Create triple digit table
    const tripleDigitTable = Object.entries(tripleDigitStats).map(
      ([number, stats]) => {
        const isLocked = lockedTripleDigits.some((ln) => ln.number === number);
        const sum = number
          .split("")
          .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
        const onesDigit = sum % 10;

        return {
          number: parseInt(number, 10),
          classType: stats.classType,
          tokens: stats.tokens,
          sumDigits: sum,
          onesDigit: onesDigit,
          lock: isLocked,
        };
      }
    );

    // Calculate statistics
    const statistics = {
      totalBets: bets.length,
      totalBetAmount: bets.reduce((sum, bet) => sum + bet.betAmount, 0),
      lockedSingleDigitEntries: lockedSingleDigits.length,
      totalSingleDigitEntries: 10,
      lockedTripleDigitEntries: lockedTripleDigits.length,
      totalTripleDigitEntries: Object.keys(tripleDigitStats).length,
    };

    res.json({
      success: true,
      data: {
        singleDigitTable,
        tripleDigitTable,
        statistics,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/game/results (history)
const getResultHistory = async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProfitNumbers,
  declareResult,
  viewResult,
  getTables,
  getResultHistory,
};
