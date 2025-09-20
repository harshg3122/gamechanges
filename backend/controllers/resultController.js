const Round = require("../models/Round");
const Result = require("../models/Result");
const SingleDigit = require("../models/SingleDigit");
const TripleDigit = require("../models/TripleDigit");
const fileQueue = require("../utils/fileQueue");
const asyncWrapper = require("../utils/asyncWrapper");

// Configuration for digit locking
const LOCK_PERCENT = 50;

// Get locked digits (50% in descending order: 9,8,7,6,5)
function getLockedDigits() {
  const total = 10;
  const toLock = Math.floor(total * (LOCK_PERCENT / 100)); // => 5
  // Descending from 9 -> 0
  const digits = Array.from({ length: 10 }, (_, i) => 9 - i); // [9,8,7,6,5,4,3,2,1,0]
  return new Set(digits.slice(0, toLock)); // {9,8,7,6,5}
}

// Convert triple digit string to individual digits
function tripleToDigits(tripleStr) {
  const s = String(tripleStr).padStart(3, "0");
  return s.split("").map((d) => Number(d));
}

// Generate random allowed triple digit
function randomTripleAllowed() {
  const locked = getLockedDigits();
  let attempts = 0;
  const maxAttempts = 1000;

  while (attempts < maxAttempts) {
    const n = Math.floor(Math.random() * 1000); // 0-999
    const s = String(n).padStart(3, "0");
    const digits = s.split("").map((d) => Number(d));

    // Check if any digit is locked
    if (!digits.some((d) => locked.has(d))) {
      return s;
    }
    attempts++;
  }

  // Fallback to 000 if no valid number found
  console.warn("⚠️  Could not find allowed triple digit, using 000");
  return "000";
}

// Declare result endpoint
exports.declareResult = asyncWrapper(async (req, res) => {
  const { winning, roundId, tripleDigitNumber } = req.body;
  const selectedNumber = winning || tripleDigitNumber;

  if (!selectedNumber) {
    return res.status(400).json({
      success: false,
      error: "Winning number required",
      message: "Please select a number to declare as result",
    });
  }

  // Get current round or specific round
  let round;
  if (roundId) {
    round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        error: "Round not found",
        message: "The specified round could not be found",
      });
    }
  } else {
    // Find or create current round
    round = await getCurrentRound();
  }

  // Check if result already declared
  const existingResult = await Result.findOne({ roundId: round._id });
  if (existingResult) {
    return res.status(400).json({
      success: false,
      error: "Result already declared for this round",
      message: "A result has already been declared for this round",
    });
  }

  // Check if the selected triple digit is locked in the database
  const selectedTripleDigit = await TripleDigit.findOne({
    roundId: round._id,
    number: String(selectedNumber).padStart(3, "0"),
  });

  if (selectedTripleDigit && selectedTripleDigit.lock) {
    return res.status(400).json({
      success: false,
      error: "Selected number is locked",
      message:
        "This number is locked and cannot be selected. Please choose another number.",
      lockedNumber: String(selectedNumber).padStart(3, "0"),
    });
  }

  // Calculate single digit result
  const digits = tripleToDigits(selectedNumber);
  const sum = digits.reduce((a, b) => a + b, 0);
  const singleDigitResult = sum % 10;

  // Check if the resulting single digit is locked
  const resultingSingleDigit = await SingleDigit.findOne({
    roundId: round._id,
    number: singleDigitResult,
  });

  if (resultingSingleDigit && resultingSingleDigit.lock) {
    return res.status(400).json({
      success: false,
      error: "Resulting single digit is locked",
      message: `This number results in single digit ${singleDigitResult} which is locked. Please choose another number.`,
      lockedSingleDigit: singleDigitResult,
      selectedTriple: String(selectedNumber).padStart(3, "0"),
    });
  }

  // Create result object
  const resultData = {
    roundId: round._id,
    timeSlot: round.timeSlot,
    tripleDigitNumber: String(selectedNumber).padStart(3, "0"),
    singleDigitResult: String(singleDigitResult),
    declaredBy: req.userId || null,
    declaredAt: new Date(),
  };

  try {
    // Try to save to database
    const result = new Result(resultData);
    await result.save();

    // Update round with result
    await Round.findByIdAndUpdate(round._id, {
      declared: true,
      status: "CLOSED",
      winningTripleNumber: resultData.tripleDigitNumber,
      winningSingleDigit: resultData.singleDigitResult,
      resultDeclaredAt: new Date(),
    });

    console.log(
      `✅ Result declared: ${resultData.tripleDigitNumber} -> ${resultData.singleDigitResult}`
    );

    return res.json({
      success: true,
      result: result.toObject(),
      round: {
        id: round._id,
        timeSlot: round.timeSlot,
        status: "CLOSED",
      },
      message: "Result declared successfully",
    });
  } catch (dbErr) {
    console.error("Database save failed, enqueueing result:", dbErr);

    // Enqueue for later processing
    const queueId = fileQueue.enqueue({
      type: "result",
      data: resultData,
      roundUpdate: {
        roundId: round._id,
        declared: true,
        status: "CLOSED",
        winningTripleNumber: resultData.tripleDigitNumber,
        winningSingleDigit: resultData.singleDigitResult,
        resultDeclaredAt: new Date(),
      },
    });

    return res.json({
      success: true,
      result: resultData,
      queued: true,
      queueId,
      message: "Result queued due to database unavailability",
    });
  }
});

// Get recent rounds
exports.getRecentRounds = asyncWrapper(async (req, res) => {
  try {
    const rounds = await Round.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("results");

    return res.json({
      success: true,
      rounds,
    });
  } catch (err) {
    console.error("Error fetching rounds:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch rounds",
    });
  }
});

// Get current round
async function getCurrentRound() {
  const now = new Date();
  const hour = now.getHours();
  const next = (hour + 1) % 24;

  const to12 = (h) => (h % 12 === 0 ? 12 : h % 12);
  const ampm = (h) => (h >= 12 ? "PM" : "AM");
  const slot = `${to12(hour)}:00 ${ampm(hour)} - ${to12(next)}:00 ${ampm(
    next
  )}`;

  // Find existing round for current time slot
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let round = await Round.findOne({
    timeSlot: slot,
    createdAt: { $gte: startOfDay },
  });

  if (!round) {
    round = await Round.create({
      timeSlot: slot,
      gameClass: "A",
      status: "BETTING_OPEN",
    });
    console.log(`🎮 Created new round: ${slot}`);
  }

  return round;
}

// Get current round endpoint with live data
exports.getCurrentRound = asyncWrapper(async (req, res) => {
  const round = await getCurrentRound();

  // Get the latest result for this round if any
  const result = await Result.findOne({ roundId: round._id }).sort({
    createdAt: -1,
  });

  // Calculate time remaining in the round
  const now = new Date();
  const [startTime, endTime] = round.timeSlot.split(" - ");
  const endHour = parseInt(endTime.split(":")[0]);
  const endAmPm = endTime.includes("PM") ? "PM" : "AM";
  let actualEndHour = endHour;
  if (endAmPm === "PM" && endHour !== 12) actualEndHour += 12;
  if (endAmPm === "AM" && endHour === 12) actualEndHour = 0;

  const roundEndTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    actualEndHour,
    0,
    0
  );
  const timeToEnd = Math.max(0, (roundEndTime - now) / (1000 * 60)); // minutes

  return res.json({
    success: true,
    data: {
      ...round.toObject(),
      result: result ? result.toObject() : null,
      timeRemaining: Math.floor(timeToEnd),
      status: result ? "CLOSED" : timeToEnd > 0 ? "ACTIVE" : "ENDED",
      winningNumber: result ? result.tripleDigitNumber : null,
      winningSingleDigit: result ? result.singleDigitResult : null,
    },
  });
});

// View result endpoint
exports.viewResult = asyncWrapper(async (req, res) => {
  const { roundId } = req.query;

  let round;
  if (roundId) {
    round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }
  } else {
    round = await getCurrentRound();
  }

  // Find result for this round
  let result = await Result.findOne({ roundId: round._id }).sort({
    createdAt: -1,
  });

  if (!result) {
    // Check if we should auto-declare (in last 10 minutes)
    const now = new Date();
    const [startTime, endTime] = round.timeSlot.split(" - ");
    const endHour = parseInt(endTime.split(":")[0]);
    const endAmPm = endTime.includes("PM") ? "PM" : "AM";
    let actualEndHour = endHour;
    if (endAmPm === "PM" && endHour !== 12) actualEndHour += 12;
    if (endAmPm === "AM" && endHour === 12) actualEndHour = 0;

    const roundEndTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      actualEndHour,
      0,
      0
    );
    const timeToEnd = (roundEndTime - now) / (1000 * 60); // minutes

    if (timeToEnd <= 10 && timeToEnd >= -5) {
      console.log("🤖 Auto-declaring result for round", round._id);

      // Auto-declare with random allowed number
      const winningTriple = randomTripleAllowed();
      const digits = tripleToDigits(winningTriple);
      const sum = digits.reduce((a, b) => a + b, 0);
      const singleDigitResult = sum % 10;

      const resultData = {
        roundId: round._id,
        timeSlot: round.timeSlot,
        tripleDigitNumber: winningTriple,
        singleDigitResult: String(singleDigitResult),
        declaredBy: null, // Auto-declared
        declaredAt: new Date(),
        autoDeclared: true,
      };

      try {
        result = new Result(resultData);
        await result.save();

        await Round.findByIdAndUpdate(round._id, {
          declared: true,
          status: "CLOSED",
          winningTripleNumber: winningTriple,
          winningSingleDigit: String(singleDigitResult),
          resultDeclaredAt: new Date(),
        });

        console.log(
          `✅ Auto-declared result: ${winningTriple} -> ${singleDigitResult}`
        );

        return res.json({
          success: true,
          result: result.toObject(),
          autoDeclared: true,
        });
      } catch (dbErr) {
        console.error("Auto-declaration failed:", dbErr);
        fileQueue.enqueue({
          type: "result",
          data: resultData,
          roundUpdate: {
            roundId: round._id,
            declared: true,
            status: "CLOSED",
            winningTripleNumber: winningTriple,
            winningSingleDigit: String(singleDigitResult),
            resultDeclaredAt: new Date(),
          },
        });
      }
    }

    return res.json({
      success: false,
      message: "No result declared yet",
    });
  }

  return res.json({
    success: true,
    result: result.toObject(),
    autoDeclared: false,
  });
});

// Get locked digits info
exports.getLockedDigits = asyncWrapper(async (req, res) => {
  const locked = Array.from(getLockedDigits());
  const unlocked = Array.from({ length: 10 }, (_, i) => i).filter(
    (d) => !locked.includes(d)
  );

  return res.json({
    success: true,
    data: {
      locked,
      unlocked,
      lockPercent: LOCK_PERCENT,
    },
  });
});

// Process queued items (for background job)
exports.processQueue = async () => {
  const pending = fileQueue.getPending();
  console.log(`🔄 Processing ${pending.length} queued items`);

  for (const item of pending) {
    try {
      if (item.data.type === "result") {
        // Try to save result
        const result = new Result(item.data.data);
        await result.save();

        // Update round
        if (item.data.roundUpdate) {
          await Round.findByIdAndUpdate(
            item.data.roundUpdate.roundId,
            item.data.roundUpdate
          );
        }

        // Remove from queue
        fileQueue.dequeue(item.id);
        console.log(`✅ Processed queued result: ${item.id}`);
      }
    } catch (err) {
      console.error(`❌ Failed to process queued item ${item.id}:`, err);
      fileQueue.incrementRetry(item.id);

      // Remove items with too many retries
      if (item.retries > 5) {
        fileQueue.dequeue(item.id);
        console.log(`🗑️  Removed failed item after 5 retries: ${item.id}`);
      }
    }
  }
};

// Get tables with proper sorting and locking
exports.getTables = asyncWrapper(async (req, res) => {
  try {
    const { roundId } = req.query;
    let round;

    if (roundId) {
      round = await Round.findById(roundId);
    } else {
      round = await getCurrentRound();
    }

    if (!round) {
      return res.json({
        success: true,
        data: { singleDigitTable: [], tripleDigitTable: [], statistics: {} },
      });
    }

    // Check if tables already exist in database for this round
    let singleDigits = await SingleDigit.find({ roundId: round._id }).sort({
      tokens: -1,
    });
    let tripleDigits = await TripleDigit.find({ roundId: round._id }).sort({
      tokens: -1,
    });

    // If no data exists, generate new tables
    if (singleDigits.length === 0 || tripleDigits.length === 0) {
      // Generate single digit table (10 digits with random tokens)
      const singleDigitTable = Array.from({ length: 10 }).map((_, n) => ({
        number: n,
        tokens: Math.floor(Math.random() * 500) + 400, // 400-900 tokens
        lock: false,
      }));

      // Sort single digits in DESCENDING order by tokens (highest first)
      singleDigitTable.sort((a, b) => b.tokens - a.tokens);

      // Lock top 50% (5 out of 10) digits in descending order
      singleDigitTable.forEach((digit, index) => {
        digit.lock = index < 5; // Top 5 highest tokens are locked
      });

      // Generate triple digit table (200 numbers)
      const tripleDigitTable = [];
      const usedNumbers = new Set();

      while (tripleDigitTable.length < 200) {
        const num = Math.floor(Math.random() * 1000);
        const numStr = num.toString().padStart(3, "0");

        if (!usedNumbers.has(numStr)) {
          usedNumbers.add(numStr);
          const sum = numStr.split("").reduce((a, d) => a + parseInt(d, 10), 0);
          tripleDigitTable.push({
            number: parseInt(numStr, 10),
            classType: "A",
            tokens: Math.floor(Math.random() * 1000) + 500, // 500-1500 tokens
            sumDigits: sum,
            onesDigit: sum % 10,
            lock: false,
          });
        }
      }

      // Sort triple digits in DESCENDING order by tokens (highest first)
      tripleDigitTable.sort((a, b) => b.tokens - a.tokens);

      // Lock top 80% (160 out of 200) in descending order
      tripleDigitTable.forEach((digit, index) => {
        digit.lock = index < 160; // Top 160 highest tokens are locked
      });

      // Store in database for persistence
      await SingleDigit.deleteMany({ roundId: round._id });
      await TripleDigit.deleteMany({ roundId: round._id });

      await SingleDigit.insertMany(
        singleDigitTable.map((r) => ({
          roundId: round._id,
          number: r.number,
          tokens: r.tokens,
          lock: r.lock,
        }))
      );

      await TripleDigit.insertMany(
        tripleDigitTable.map((r) => ({
          roundId: round._id,
          number: String(r.number).padStart(3, "0"),
          classType: r.classType,
          tokens: r.tokens,
          sumDigits: r.sumDigits,
          onesDigit: r.onesDigit,
          lock: r.lock,
        }))
      );

      const statistics = {
        totalBets: 0,
        totalBetAmount: 0,
        lockedSingleDigitEntries: singleDigitTable.filter((s) => s.lock).length,
        totalSingleDigitEntries: singleDigitTable.length,
        lockedTripleDigitEntries: tripleDigitTable.filter((t) => t.lock).length,
        totalTripleDigitEntries: tripleDigitTable.length,
      };

      return res.json({
        success: true,
        data: { singleDigitTable, tripleDigitTable, statistics },
      });
    }

    // Convert database records to frontend format
    const singleDigitTable = singleDigits.map((s) => ({
      number: s.number,
      tokens: s.tokens,
      lock: s.lock,
    }));

    const tripleDigitTable = tripleDigits.map((t) => ({
      number: parseInt(t.number),
      classType: t.classType,
      tokens: t.tokens,
      sumDigits: t.sumDigits,
      onesDigit: t.onesDigit,
      lock: t.lock,
    }));

    const statistics = {
      totalBets: 0,
      totalBetAmount: 0,
      lockedSingleDigitEntries: singleDigitTable.filter((s) => s.lock).length,
      totalSingleDigitEntries: singleDigitTable.length,
      lockedTripleDigitEntries: tripleDigitTable.filter((t) => t.lock).length,
      totalTripleDigitEntries: tripleDigitTable.length,
    };

    res.json({
      success: true,
      data: { singleDigitTable, tripleDigitTable, statistics },
    });
  } catch (error) {
    console.error("Error getting tables:", error);
    res.json({
      success: true,
      data: { singleDigitTable: [], tripleDigitTable: [], statistics: {} },
    });
  }
});

// Get profit numbers for analysis
exports.getProfitNumbers = asyncWrapper(async (req, res) => {
  try {
    const { roundId } = req.query;
    let round;

    if (roundId) {
      round = await Round.findById(roundId);
    } else {
      round = await getCurrentRound();
    }

    if (!round) {
      return res.json({
        success: false,
        message: "Round not found",
      });
    }

    // Get unlocked triple digits that could be profitable
    const unlockedTriples = await TripleDigit.find({
      roundId: round._id,
      lock: false,
    }).sort({ tokens: 1 }); // Sort by lowest tokens first (most profitable)

    const profitNumbers = unlockedTriples.slice(0, 10).map((t) => ({
      tripleDigit: t.number,
      tokens: t.tokens,
      sumDigits: t.sumDigits,
      singleDigitResult: t.onesDigit,
      profitability: "High", // Simple classification
    }));

    res.json({
      success: true,
      data: profitNumbers,
    });
  } catch (error) {
    console.error("Error getting profit numbers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profit numbers",
    });
  }
});

module.exports = exports;
