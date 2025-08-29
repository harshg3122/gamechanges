/**
 * Validate 3-digit number format
 * @param {string} number - 3-digit number string
 * @returns {boolean} Is valid 3-digit number
 */
const isValid3DigitNumber = (number) => {
  return /^\d{3}$/.test(number) && number.length === 3;
};

/**
 * Check if number belongs to Class A (all same digits)
 * @param {string} number - 3-digit number
 * @returns {boolean} Is Class A number
 */
const isClassA = (number) => {
  if (!isValid3DigitNumber(number)) return false;
  // All three digits are the same
  return number[0] === number[1] && number[1] === number[2];
};

/**
 * Check if number belongs to Class B (exactly two digits are the same)
 * @param {string} number - 3-digit number
 * @returns {boolean} Is Class B number
 */
const isClassB = (number) => {
  if (!isValid3DigitNumber(number)) return false;
  // Exactly two digits are the same (but not all three)
  const d1 = number[0], d2 = number[1], d3 = number[2];
  return (d1 === d2 && d1 !== d3) || 
         (d1 === d3 && d1 !== d2) || 
         (d2 === d3 && d2 !== d1);
};

/**
 * Check if number belongs to Class C (all different digits)
 * @param {string} number - 3-digit number
 * @returns {boolean} Is Class C number
 */
const isClassC = (number) => {
  if (!isValid3DigitNumber(number)) return false;
  // All three digits are different
  const d1 = number[0], d2 = number[1], d3 = number[2];
  return d1 !== d2 && d2 !== d3 && d1 !== d3;
};

/**
 * Determine the class of a number
 * @param {string} number - 3-digit number
 * @returns {string|null} 'A', 'B', 'C', or null if invalid
 */
const determineNumberClass = (number) => {
  if (isClassA(number)) return 'A';
  if (isClassB(number)) return 'B';
  if (isClassC(number)) return 'C';
  return null;
};

/**
 * Generate all valid numbers for a specific class
 * @param {string} classType - 'A', 'B', or 'C'
 * @returns {string[]} Array of valid numbers
 */
const generateValidNumbers = (classType) => {
  switch (classType) {
    case 'A':
      return ['111', '222', '333', '444', '555', '666', '777', '888', '999'];
    case 'B':
      return [
        '112', '113', '114', '115', '116', '117', '118', '119',
        '223', '224', '225', '226', '227', '228', '229',
        '334', '335', '336', '337', '338', '339',
        '445', '446', '447', '448', '449',
        '556', '557', '558', '559',
        '667', '668', '669',
        '778', '779',
        '889'
      ];
    case 'C':
      return [
        '123', '124', '125', '126', '127', '128', '129',
        '134', '135', '136', '137', '138', '139',
        '145', '146', '147', '148', '149',
        '156', '157', '158', '159',
        '167', '168', '169',
        '178', '179', '189',
        '234', '235', '236', '237', '238', '239',
        '245', '246', '247', '248', '249',
        '256', '257', '258', '259',
        '267', '268', '269',
        '278', '279', '289',
        '345', '346', '347', '348', '349',
        '356', '357', '358', '359',
        '367', '368', '369',
        '378', '379', '389',
        '456', '457', '458', '459',
        '467', '468', '469',
        '478', '479', '489',
        '567', '568', '569',
        '578', '579', '589',
        '678', '679', '689',
        '789'
      ];
    case 'D':
      // Class D: single digits 1-9
      return ['1','2','3','4','5','6','7','8','9'];
    default:
      return [];
  }
};

/**
 * Calculate winning amount based on class and bet
 * @param {string} classType - 'A', 'B', or 'C'
 * @param {number} betAmount - Amount bet
 * @returns {number} Winning amount
 */
const calculateWinningAmount = (classType, betAmount) => {
  const multipliers = {
    'A': 100,
    'B': 10,
    'C': 5,
    'D': 5 // Same as Class C
  };
  return betAmount * (multipliers[classType] || 1);
};

/**
 * Generate random number for specific class (for admin use)
 * @param {string} classType - 'A', 'B', or 'C'
 * @returns {string} Random valid number for the class
 */
const generateRandomNumberForClass = (classType) => {
  const validNumbers = generateValidNumbers(classType);
  const randomIndex = Math.floor(Math.random() * validNumbers.length);
  return validNumbers[randomIndex];
};

/**
 * Validate mobile number format (Indian mobile numbers)
 * @param {string} mobile - Mobile number
 * @returns {boolean} Is valid mobile number
 */
const isValidMobile = (mobile) => {
  // Indian mobile number: 10 digits starting with 6,7,8,9
  return /^[6-9]\d{9}$/.test(mobile);
};

/**
 * Validate username format
 * @param {string} username - Username
 * @returns {boolean} Is valid username
 */
const isValidUsername = (username) => {
  // Username: 3-20 characters, alphanumeric and underscore only
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

module.exports = {
  isValid3DigitNumber,
  isClassA,
  isClassB,
  isClassC,
  determineNumberClass,
  generateValidNumbers,
  calculateWinningAmount,
  generateRandomNumberForClass,
  isValidMobile,
  isValidUsername
};
