const express = require('express');
const router = express.Router();
const Round = require('../models/Round');
const Result = require('../models/Result');

// Game numbers for each class
const GAME_NUMBERS = {
  A: [
    '0', '127', '136', '145', '190', '235', '280', '370', '479', '460', '569', '389', '578',
    '1', '128', '137', '146', '236', '245', '290', '380', '470', '489', '560', '678', '579',
    '2', '129', '138', '147', '156', '237', '246', '345', '390', '480', '570', '589', '679',
    '3', '120', '139', '148', '157', '238', '247', '256', '346', '490', '580', '175', '256',
    '4', '130', '149', '158', '167', '239', '248', '257', '347', '356', '590', '680', '789'
  ],
  B: [
    '00', '19', '28', '37', '46', '55', '64', '73', '82', '91',
    '11', '20', '39', '48', '57', '66', '75', '84', '93', '22'
  ],
  C: [
    '000', '119', '128', '137', '146', '155', '236', '245', '290', '389',
    '479', '488', '560', '578', '678', '789'
  ],
  D: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
};

// Function to get random winning number
function getRandomWinningNumber() {
  const classes = ['A', 'B', 'C', 'D'];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  const numbers = GAME_NUMBERS[randomClass];
  const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
  return { gameClass: randomClass, winningNumber: randomNumber };
}

// Function to create time slot for today
function createTimeSlot(hour) {
  const today = new Date();
  today.setHours(hour, 0, 0, 0);
  return today;
}

// Generate test results for past time slots
router.post('/generate-test-results', async (req, res) => {
  try {
    const currentHour = new Date().getHours();
    const timeSlots = [];
    
    // Add past time slots (11 AM onwards until current hour)
    for (let hour = 11; hour < currentHour && hour < 24; hour++) {
      timeSlots.push(hour);
    }

    const results = [];

    for (const hour of timeSlots) {
      try {
        const timeSlotDate = createTimeSlot(hour);
        const { gameClass, winningNumber } = getRandomWinningNumber();

        // Check if round already exists for this time slot
        let existingRound = await Round.findOne({
          timeSlot: timeSlotDate
        });

        let round;
        if (!existingRound) {
          // Create a new round
          round = new Round({
            gameClass: 'A', // Default game class
            timeSlot: timeSlotDate,
            status: 'completed',
            resultDeclaredAt: timeSlotDate
          });
          await round.save();
        } else {
          round = existingRound;
        }

        // Check if result already exists
        const existingResult = await Result.findOne({ roundId: round._id });
        
        if (!existingResult) {
          // Create result
          const result = new Result({
            roundId: round._id,
            winningNumber: winningNumber,
            gameClass: gameClass,
            createdAt: timeSlotDate,
            resultDate: timeSlotDate
          });

          await result.save();
          results.push({
            hour: hour,
            timeSlot: `${hour}:00`,
            gameClass: gameClass,
            winningNumber: winningNumber,
            status: 'created'
          });
        } else {
          results.push({
            hour: hour,
            timeSlot: `${hour}:00`,
            gameClass: existingResult.gameClass,
            winningNumber: existingResult.winningNumber,
            status: 'existing'
          });
        }

      } catch (error) {
        results.push({
          hour: hour,
          timeSlot: `${hour}:00`,
          error: error.message,
          status: 'error'
        });
      }
    }

    res.json({
      success: true,
      message: `Generated results for ${timeSlots.length} time slots`,
      currentHour: currentHour,
      results: results
    });

  } catch (error) {
    console.error('Error generating test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test results',
      error: error.message
    });
  }
});

module.exports = router;
