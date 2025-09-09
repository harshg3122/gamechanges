// Utility functions for number locking mechanism
const SingleDigit = require("../models/SingleDigit");
const TripleDigit = require("../models/TripleDigit");
const LockedNumber = require("../models/LockedNumber");
const Round = require("../models/Round");

/**
 * Updates the locking status of single and triple digit numbers
 * Locks 50% of single digits (5 out of 10) and 50% of triple digits (50 out of 100 possible)
 * @param {String} date - Current date in YYYY-MM-DD format
 * @param {String} timeSlot - Current time slot
 */
async function updateLockingMechanism(date, timeSlot) {
  try {
    console.log(`Updating locking mechanism for ${date}, ${timeSlot}`);

    // Get random 5 single digits to lock (50% of 10)
    const lockedSingleDigits = getRandomNumbers(0, 9, 5);
    console.log("Locking single digits:", lockedSingleDigits);

    // Get random 50 triple digits to lock (50% of 100 possible locked numbers)
    const lockedTripleDigits = getRandomNumbers(0, 999, 50);
    console.log(
      "Locking triple digits:",
      lockedTripleDigits.slice(0, 10) + "... (50 total)"
    );

    // Update single digits lock status
    for (let i = 0; i <= 9; i++) {
      const digit = i.toString();
      const shouldLock = lockedSingleDigits.includes(i);

      // Find or create single digit record
      let singleDigit = await SingleDigit.findOne({ date, timeSlot, digit });
      if (!singleDigit) {
        singleDigit = new SingleDigit({
          date,
          timeSlot,
          digit,
          locked: shouldLock,
        });
      } else {
        singleDigit.locked = shouldLock;
      }

      await singleDigit.save();
    }

    // Update triple digits lock status
    // We'll only lock 50 specific triple digits out of 1000 possible
    // First, reset all triple digits to unlocked
    await TripleDigit.updateMany({ date, timeSlot }, { locked: false });

    // Then lock the selected 50 triple digits
    for (const num of lockedTripleDigits) {
      // Format as 3-digit string with leading zeros
      const number = num.toString().padStart(3, "0");

      // Find or create triple digit record
      let tripleDigit = await TripleDigit.findOne({ date, timeSlot, number });
      if (!tripleDigit) {
        tripleDigit = new TripleDigit({
          date,
          timeSlot,
          number,
          locked: true,
        });
      } else {
        tripleDigit.locked = true;
      }

      await tripleDigit.save();
    }

    console.log("Locking mechanism updated successfully");
    return {
      lockedSingleDigits,
      lockedTripleDigits: lockedTripleDigits.map((num) =>
        num.toString().padStart(3, "0")
      ),
    };
  } catch (error) {
    console.error("Error updating locking mechanism:", error);
    throw error;
  }
}

/**
 * Generates an array of random unique numbers within a range
 * @param {Number} min - Minimum value (inclusive)
 * @param {Number} max - Maximum value (inclusive)
 * @param {Number} count - Number of random numbers to generate
 * @returns {Array} Array of random unique numbers
 */
function getRandomNumbers(min, max, count) {
  const numbers = [];

  // Ensure we don't try to get more unique numbers than are available in the range
  const availableCount = max - min + 1;
  count = Math.min(count, availableCount);

  while (numbers.length < count) {
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(randomNum)) {
      numbers.push(randomNum);
    }
  }

  return numbers;
}

/**
 * Updates the locking mechanism for a specific round
 * Locks 5 single digits (0-9) and 50 triple digits (000-999) randomly
 * @param {ObjectId} roundId - The ID of the round to update locking mechanism for
 * @returns {Object} Object containing arrays of locked single and triple digits
 */
async function updateLockingMechanismByRoundId(roundId) {
  try {
    // Check if locking mechanism is already initialized for this round
    const existingLocks = await LockedNumber.countDocuments({ roundId });
    if (existingLocks > 0) {
      console.log(
        `Locking mechanism already initialized with ${existingLocks} locked numbers for round ${roundId}`
      );
      return await getLockedNumbers(roundId);
    }

    // Lock 5 single digits (0-9) - 50% of 10
    const singleDigits = Array.from({ length: 10 }, (_, i) => i);
    const shuffledSingleDigits = singleDigits.sort(() => Math.random() - 0.5);
    const lockedSingleDigits = shuffledSingleDigits.slice(0, 5);

    // Lock 500 triple digits (000-999) - 50% of 1000
    const tripleDigits = Array.from({ length: 1000 }, (_, i) =>
      i.toString().padStart(3, "0")
    );
    const shuffledTripleDigits = tripleDigits.sort(() => Math.random() - 0.5);
    const lockedTripleDigits = shuffledTripleDigits.slice(0, 500);

    // Create locked numbers in database
    const lockedSinglePromises = lockedSingleDigits.map((digit) =>
      LockedNumber.create({
        roundId,
        numberType: "single",
        number: digit.toString(),
      })
    );

    const lockedTriplePromises = lockedTripleDigits.map((digit) =>
      LockedNumber.create({
        roundId,
        numberType: "triple",
        number: digit,
      })
    );

    await Promise.all([...lockedSinglePromises, ...lockedTriplePromises]);

    console.log(
      `Locked ${lockedSingleDigits.length} single digits and ${lockedTripleDigits.length} triple digits for round ${roundId}`
    );
    return {
      lockedSingleDigits: lockedSingleDigits.map((d) => d.toString()),
      lockedTripleDigits: lockedTripleDigits,
    };
  } catch (error) {
    console.error("Error updating locking mechanism by round ID:", error);
    throw error;
  }
}

/**
 * Gets the locked numbers for a specific round
 * @param {ObjectId} roundId - The ID of the round to get locked numbers for
 * @returns {Object} Object containing arrays of locked single and triple digits
 */
async function getLockedNumbers(roundId) {
  try {
    const lockedSingleDigits = await LockedNumber.find({
      roundId,
      numberType: "single",
    }).lean();
    const lockedTripleDigits = await LockedNumber.find({
      roundId,
      numberType: "triple",
    }).lean();

    return {
      lockedSingleDigits: lockedSingleDigits.map((item) => item.number),
      lockedTripleDigits: lockedTripleDigits.map((item) => item.number),
    };
  } catch (error) {
    console.error("Error getting locked numbers:", error);
    throw error;
  }
}

/**
 * Checks if a number is locked for a specific round
 * @param {ObjectId} roundId - The ID of the round to check
 * @param {String} numberType - The type of number ('single' or 'triple')
 * @param {String} number - The number to check
 * @returns {Boolean} True if the number is locked, false otherwise
 */
async function isNumberLocked(roundId, numberType, number) {
  try {
    const lockedNumber = await LockedNumber.findOne({
      roundId,
      numberType,
      number,
    });
    return !!lockedNumber;
  } catch (error) {
    console.error("Error checking if number is locked:", error);
    throw error;
  }
}

/**
 * Gets an unlocked triple digit for result calculation
 * @param {ObjectId} roundId - The ID of the round to get an unlocked triple digit for
 * @returns {String} An unlocked triple digit
 */
async function getUnlockedTripleDigit(roundId) {
  try {
    // Get all locked triple digits for the round
    const lockedNumbers = await LockedNumber.find({
      roundId,
      numberType: "triple",
    });
    const lockedTripleDigits = lockedNumbers.map((ln) => ln.number);

    // Generate a list of all possible triple digits
    const allTripleDigits = Array.from({ length: 1000 }, (_, i) =>
      i.toString().padStart(3, "0")
    );

    // Filter out locked triple digits
    const unlockedTripleDigits = allTripleDigits.filter(
      (digit) => !lockedTripleDigits.includes(digit)
    );

    if (unlockedTripleDigits.length === 0) {
      throw new Error("No unlocked triple digits found");
    }

    // Select a random unlocked triple digit
    const randomIndex = Math.floor(Math.random() * unlockedTripleDigits.length);
    return unlockedTripleDigits[randomIndex];
  } catch (error) {
    console.error("Error getting unlocked triple digit:", error);
    throw error;
  }
}

module.exports = {
  updateLockingMechanism,
  updateLockingMechanismByRoundId,
  getRandomNumbers,
  getLockedNumbers,
  isNumberLocked,
  getUnlockedTripleDigit,
};
