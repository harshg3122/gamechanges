const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { agentAuth } = require('../middleware/authMiddleware');

router.post('/login', agentController.loginAgent);
router.get('/dashboard', agentAuth, agentController.getDashboard);
router.post('/add-user', agentAuth, agentController.addUser);
router.get('/users', agentAuth, agentController.getUsers);
router.get('/bets', agentAuth, agentController.getBets);
router.get('/transactions', agentAuth, agentController.getTransactions);
router.get('/results', agentAuth, agentController.getResults);

module.exports = router;
