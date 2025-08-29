const express = require('express');
const router = express.Router();
const {
    getProfitNumbers,
    declareResult,
    viewResult,
    getTables
} = require('../controllers/resultController');

// GET /api/results/profit-numbers?roundId=...
router.get('/profit-numbers', getProfitNumbers);

// POST /api/results/declare
router.post('/declare', declareResult);

// GET /api/results/view?roundId=...
router.get('/view', viewResult);

// GET /api/results/tables?roundId=...
router.get('/tables', getTables);

module.exports = router;