const Result = require('../models/Result');
const Bet = require('../models/Bet');
const SingleDigit = require('../models/SingleDigit');
const TripleDigit = require('../models/TripleDigit');
const Round = require('../models/Round');

// Helper: calculate single digit from triple digit
function getSingleDigit(triple) {
    const sum = triple.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
    return (sum % 10).toString();
}

// Helper: check if single digit is locked
async function isSingleDigitLocked(date, timeSlot, digit) {
    const record = await SingleDigit.findOne({ date, timeSlot, digit });
    return record && record.locked;
}

// GET /api/results/profit-numbers?roundId=...
const getProfitNumbers = async(req, res) => {
    try {
        const { roundId } = req.query;
        if (!roundId) return res.status(400).json({ success: false, message: 'Missing roundId' });
        const round = await Round.findById(roundId);
        if (!round) return res.status(404).json({ success: false, message: 'Round not found' });
        const date = round.gameDate ? round.gameDate.toISOString().slice(0, 10) : null;
        const timeSlot = round.timeSlot;

        // Get all bets for this round, class A (single digit)
        const bets = await Bet.find({ roundId, gameClass: 'A' });
        const numberStats = {};
        for (const bet of bets) {
            const num = bet.selectedNumber;
            if (!numberStats[num]) numberStats[num] = { tokens: 0 };
            numberStats[num].tokens += bet.betAmount;
        }
        // For each single digit, check lock status
        const profitNumbers = await Promise.all(
            Object.entries(numberStats).map(async([number, stat]) => {
                const locked = await isSingleDigitLocked(date, timeSlot, number);
                return {
                    number,
                    tokens: stat.tokens,
                    locked
                };
            })
        );
        res.status(200).json({ success: true, profitNumbers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/results/declare
const declareResult = async(req, res) => {
    try {
        const { roundId, tripleDigitNumber } = req.body;
        if (!roundId || !tripleDigitNumber) {
            return res.status(400).json({ success: false, message: 'Missing roundId or tripleDigitNumber' });
        }
        const round = await Round.findById(roundId);
        if (!round) return res.status(404).json({ success: false, message: 'Round not found' });
        const date = round.gameDate ? round.gameDate.toISOString().slice(0, 10) : null;
        const timeSlot = round.timeSlot;

        let triple = tripleDigitNumber;
        let singleDigit = getSingleDigit(triple);
        let checkedTriples = [triple];

        // If locked, try next triple digit in table
        let locked = await isSingleDigitLocked(date, timeSlot, singleDigit);
        if (locked) {
            const triples = await TripleDigit.find({ roundId });
            for (let t of triples) {
                if (checkedTriples.includes(t.number)) continue;
                let sd = getSingleDigit(t.number);
                if (!(await isSingleDigitLocked(date, timeSlot, sd))) {
                    triple = t.number;
                    singleDigit = sd;
                    break;
                }
            }
        }

        // Save result
        const result = new Result({
            roundId,
            date,
            timeSlot,
            tripleDigitNumber: triple,
            singleDigitResult: singleDigit
        });
        await result.save();

        res.status(201).json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/results/view?roundId=...
const viewResult = async(req, res) => {
    try {
        const { roundId } = req.query;
        if (!roundId) return res.status(400).json({ success: false, message: 'Missing roundId' });
        let result = await Result.findOne({ roundId });
        if (result) {
            return res.status(200).json({ success: true, result });
        }

        // No result yet, check if we are in the last 2 minutes of the slot
        const round = await Round.findById(roundId);
        if (!round) return res.status(404).json({ success: false, message: 'Round not found' });
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
                if (ampm === 'PM' && hour !== 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;
                slotEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
                // If slotEnd is in the past (e.g., after midnight), add a day
                if (slotEnd < now && (now.getHours() - hour) > 2) slotEnd.setDate(slotEnd.getDate() + 1);
            }
        }
        if (!slotEnd) {
            return res.status(400).json({ success: false, message: 'Invalid timeSlot format' });
        }
        const diffToEnd = (slotEnd - now) / 60000; // minutes until slot end
        if (diffToEnd <= 2 && diffToEnd >= 0) {
            // Auto-declare result in last 2 minutes
            const date = round.gameDate ? round.gameDate.toISOString().slice(0, 10) : null;
            let triple = null;
            let singleDigit = null;
            const triples = await TripleDigit.find({ date, timeSlot });
            for (let t of triples) {
                const sd = getSingleDigit(t.number);
                const locked = await isSingleDigitLocked(date, timeSlot, sd);
                if (!locked) {
                    triple = t.number;
                    singleDigit = sd;
                    break;
                }
            }
            // If all locked or none found, fallback to first triple
            if (!triple && triples.length > 0) {
                triple = triples[0].number;
                singleDigit = getSingleDigit(triple);
            }
            if (triple && singleDigit) {
                result = new Result({
                    roundId,
                    date,
                    timeSlot,
                    tripleDigitNumber: triple,
                    singleDigitResult: singleDigit
                });
                await result.save();
                return res.status(200).json({ success: true, result, autoDeclared: true });
            } else {
                return res.status(404).json({ success: false, message: 'No triple digit numbers found to declare result.' });
            }
        } else {
            // Not in last 2 minutes
            return res.status(200).json({ success: false, message: 'Result not declared yet. Auto-declare will happen in the last 2 minutes of the slot.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/results/tables?roundId=...
const getTables = async(req, res) => {
    try {
        const { roundId } = req.query;
        if (!roundId) {
            return res.status(400).json({ success: false, message: 'Missing roundId' });
        }
        // Fetch round to get date and timeSlot
        const round = await Round.findById(roundId);
        if (!round) {
            return res.status(404).json({ success: false, message: 'Round not found' });
        }
        const date = round.gameDate ? round.gameDate.toISOString().slice(0, 10) : null;
        const timeSlot = round.timeSlot;
        const singleDigits = await SingleDigit.find({ date, timeSlot });
        const tripleDigits = await TripleDigit.find({ date, timeSlot });
        res.json({
            success: true,
            tables: {
                singleDigitTable: singleDigits,
                tripleDigitTable: tripleDigits
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/game/results (history)
const getResultHistory = async(req, res) => {
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
    getResultHistory
};