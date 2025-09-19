/**
 * Number Generation Utility for Game System
 * Generates triple digit numbers and single digit numbers with proper token distribution
 */

/**
 * Generates 200 triple digit numbers with tokens
 * 160 will be locked in descending order (80%)
 * 40 will remain unlocked (20%)
 */
function generateTripleDigitNumbers() {
  const numbers = [];
  const usedNumbers = new Set();

  // Generate 200 unique triple digit numbers
  while (numbers.length < 200) {
    const num = Math.floor(Math.random() * 1000);
    const numStr = num.toString().padStart(3, "0");

    if (!usedNumbers.has(numStr)) {
      usedNumbers.add(numStr);

      // Calculate sum of digits
      const digits = numStr.split("").map((d) => parseInt(d, 10));
      const sumDigits = digits.reduce((sum, digit) => sum + digit, 0);
      const lastDigit = sumDigits % 10;

      // Generate random token amount between 500-1500
      const tokens = Math.floor(Math.random() * 1000) + 500;

      numbers.push({
        number: numStr,
        tokens: tokens,
        sumDigits: sumDigits,
        lastDigit: lastDigit,
        locked: false, // Will be set later based on token ranking
        classType: "A",
      });
    }
  }

  // Sort by tokens in descending order
  numbers.sort((a, b) => b.tokens - a.tokens);

  // Lock top 160 numbers (80%)
  for (let i = 0; i < 160; i++) {
    numbers[i].locked = true;
  }

  return numbers;
}

/**
 * Generates 10 single digit numbers (0-9) with random tokens
 * Random numbers will be locked
 */
function generateSingleDigitNumbers() {
  const numbers = [];

  // Generate all 10 single digits (0-9)
  for (let i = 0; i <= 9; i++) {
    // Generate random token amount between 500-1000
    const tokens = Math.floor(Math.random() * 500) + 500;

    numbers.push({
      number: i,
      tokens: tokens,
      locked: Math.random() < 0.5, // Randomly lock ~50% of numbers
    });
  }

  return numbers;
}

/**
 * Calculate the single digit result from a triple digit number
 * @param {string} tripleDigit - The triple digit number as string
 * @returns {object} Object containing sum and resulting single digit
 */
function calculateSingleDigitFromTriple(tripleDigit) {
  const digits = tripleDigit.split("").map((d) => parseInt(d, 10));
  const sum = digits.reduce((total, digit) => total + digit, 0);
  const singleDigit = sum % 10;

  return {
    sum: sum,
    singleDigit: singleDigit,
    lastDigit: singleDigit,
  };
}

/**
 * Get an unlocked triple digit number for auto result generation
 * @param {Array} tripleDigits - Array of triple digit objects
 * @param {Array} singleDigits - Array of single digit objects
 * @returns {string|null} Unlocked triple digit that results in unlocked single digit, or null
 */
function getValidUnlockedTripleDigit(tripleDigits, singleDigits) {
  // Get all unlocked triple digits
  const unlockedTriples = tripleDigits.filter((td) => !td.locked);

  // Create a map of single digit lock status for quick lookup
  const singleDigitLockMap = {};
  singleDigits.forEach((sd) => {
    singleDigitLockMap[sd.number] = sd.locked;
  });

  // Find a triple digit that results in an unlocked single digit
  for (const triple of unlockedTriples) {
    const result = calculateSingleDigitFromTriple(triple.number);

    // Check if the resulting single digit is not locked
    if (!singleDigitLockMap[result.singleDigit]) {
      return triple.number;
    }
  }

  return null;
}

/**
 * Validate if a triple digit selection is valid for result declaration
 * @param {string} tripleDigit - The selected triple digit
 * @param {Array} tripleDigits - Array of triple digit objects
 * @param {Array} singleDigits - Array of single digit objects
 * @returns {object} Validation result with success flag and message
 */
function validateTripleDigitSelection(tripleDigit, tripleDigits, singleDigits) {
  // Find the triple digit in the array
  const tripleDigitObj = tripleDigits.find((td) => td.number === tripleDigit);

  if (!tripleDigitObj) {
    return {
      success: false,
      message: "Invalid triple digit number",
    };
  }

  // Check if triple digit is locked
  if (tripleDigitObj.locked) {
    return {
      success: false,
      message: `Triple digit ${tripleDigit} is locked. Please choose another number.`,
    };
  }

  // Calculate resulting single digit
  const result = calculateSingleDigitFromTriple(tripleDigit);

  // Check if resulting single digit is locked
  const singleDigitObj = singleDigits.find(
    (sd) => sd.number === result.singleDigit
  );

  if (singleDigitObj && singleDigitObj.locked) {
    return {
      success: false,
      message: `The sum ${result.sum} results in digit ${result.singleDigit} which is locked. Please choose another triple digit number.`,
    };
  }

  return {
    success: true,
    message: "Valid selection",
    result: result,
  };
}

module.exports = {
  generateTripleDigitNumbers,
  generateSingleDigitNumbers,
  calculateSingleDigitFromTriple,
  getValidUnlockedTripleDigit,
  validateTripleDigitSelection,
};
