const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    getGameNumbers,
    placeBet,
    getUserBets,
    getCurrentRound,
    getResults,
    getResultForTimeSlot
} = require('../controllers/gameController');
const { getResultHistory } = require('../controllers/resultController');

/**
 * @route   GET /api/game/numbers
 * @desc    Get available numbers for all game classes
 * @access  Public
 */
router.get('/numbers', getGameNumbers);

/**
 * @route   GET /api/game/numbers/:gameClass
 * @desc    Get available numbers for a specific game class
 * @access  Public
 */
router.get('/numbers/:gameClass', async(req, res) => {
    try {
        const { gameClass } = req.params;

        // Import GAME_NUMBERS constant
        const GAME_NUMBERS = {
            A: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            B: [
                '0', '127', '136', '145', '190', '235', '280', '370', '479', '460', '569', '389', '578',
                '1', '128', '137', '146', '236', '245', '290', '380', '470', '489', '560', '678', '579',
                '2', '129', '138', '147', '156', '237', '246', '345', '390', '480', '570', '589', '679',
                '3', '120', '139', '148', '157', '238', '247', '256', '346', '490', '580', '175', '256',
                '4', '130', '149', '158', '167', '239', '248', '257', '347', '356', '590', '680', '789',
                '5', '140', '159', '168', '230', '249', '258', '267', '348', '357', '456', '690', '780',
                '6', '123', '150', '169', '178', '240', '259', '268', '349', '358', '457', '367', '790',
                '7', '124', '160', '179', '250', '269', '278', '340', '359', '368', '458', '467', '890',
                '8', '125', '134', '170', '189', '260', '279', '350', '369', '378', '459', '567', '468',
                '9', '135', '180', '234', '270', '289', '360', '379', '450', '469', '478', '568', '679',
            ],
            C: [
                '0', '550', '668', '244', '299', '226', '334', '488', '667', '118',
                '1', '100', '119', '155', '227', '335', '344', '399', '588', '669',
                '2', '200', '110', '228', '255', '336', '449', '660', '688', '778',
                '3', '300', '166', '229', '337', '355', '445', '599', '779', '788',
                '4', '400', '112', '220', '266', '338', '446', '455', '699', '770',
                '5', '500', '113', '122', '177', '339', '366', '447', '799', '889',
                '6', '600', '114', '277', '330', '448', '466', '556', '880', '899',
                '7', '700', '115', '133', '188', '223', '377', '449', '557', '566',
                '8', '800', '116', '224', '233', '288', '440', '477', '558', '990',
                '9', '900', '117', '144', '199', '225', '388', '559', '577', '667',
            ],
            D: ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'],
        };

        if (!GAME_NUMBERS[gameClass]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid game class'
            });
        }

        res.json({
            success: true,
            data: {
                gameClass: gameClass,
                numbers: GAME_NUMBERS[gameClass]
            },
            message: `Numbers for class ${gameClass} fetched successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching game numbers'
        });
    }
});

/**
 * @route   POST /api/game/bet
 * @desc    Place a bet
 * @access  Private (User)
 */
router.post('/bet', authMiddleware, placeBet);

// Get result for a specific round or timeSlot
router.get('/result', getResultForTimeSlot);

/**
 * @route   GET /api/game/bets
 * @desc    Get current user's bets
 * @access  Private (User)
 */
router.get('/bets', authMiddleware, getUserBets);

/**
 * @route   GET /api/game/my-bets
 * @desc    Get current user's bets (alternative endpoint)
 * @access  Private (User)
 */
router.get('/my-bets', authMiddleware, getUserBets);

/**
 * @route   GET /api/game/current-round
 * @desc    Get current round information
 * @access  Public
 */
router.get('/current-round', getCurrentRound);

/**
 * @route   GET /api/game/results
 * @desc    Get game results
 * @access  Public
 */
router.get('/results', getResultHistory);

module.exports = router;