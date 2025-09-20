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
  const { winning, roundId } = req.body;

  if (!winning) {
    return res.status(400).json({
      success: false,
      error: "Winning number required",
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
    });
  }

  // Validate winning number
  const digits = tripleToDigits(winning);
  const locked = getLockedDigits();

  // Check for locked digits
  const lockedDigitsFound = digits.filter((d) => locked.has(d));
  if (lockedDigitsFound.length > 0) {
    return res.status(400).json({
      success: false,
      error: `One or more digits are locked (${lockedDigitsFound.join(
        ", "
      )}). Choose another number.`,
    });
  }

  // Calculate single digit result
  const sum = digits.reduce((a, b) => a + b, 0);
  const singleDigitResult = sum % 10;

  // Create result object
  const resultData = {
    roundId: round._id,
    timeSlot: round.timeSlot,
    tripleDigitNumber: String(winning).padStart(3, "0"),
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

// Get current round endpoint
exports.getCurrentRound = asyncWrapper(async (req, res) => {
  const round = await getCurrentRound();
  return res.json({
    success: true,
    data: round,
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

module.exports = exports;
