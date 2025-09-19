const Agent = require("../models/Agent");
const User = require("../models/User");
const Bet = require("../models/Bet");
const Transaction = require("../models/Transaction");
const Result = require("../models/Result");
const { validationResult } = require("express-validator");

// Agent Login
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "game999secret";

exports.loginAgent = async (req, res) => {
  try {
    console.log("Agent login attempt:", req.body);

    // Accept mobile, email, identifier, or username from the body
    const identifier =
      req.body.mobile ||
      req.body.identifier ||
      req.body.username ||
      req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }

    const agent = await Agent.findOne({
      $or: [
        { mobile: identifier },
        { email: (identifier || "").toLowerCase() },
      ],
    });

    if (!agent) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid mobile or password" });
    }

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid mobile or password" });
    }

    // Generate JWT token with clear agent identification
    const token = jwt.sign(
      {
        id: agent._id,
        role: "agent",
        userType: "agent", // Clear identifier
        agentId: agent._id, // Additional identifier
      },
      JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );

    console.log(`Agent login successful for: ${agent.mobile}`);

    res.json({
      success: true,
      message: "Login successful",
      userType: "agent",
      data: {
        token,
        agent: {
          id: agent._id,
          mobile: agent.mobile,
          email: agent.email,
          fullName: agent.fullName,
          referralCode: agent.referralCode,
        },
      },
    });
  } catch (error) {
    console.error("Agent login error:", error);
    res.status(500).json({ success: false, message: "Error logging in" });
  }
};

// Agent Logout
exports.logoutAgent = async (req, res) => {
  try {
    console.log("Agent logout requested");

    // In a stateless JWT system, logout is mainly handled on the frontend
    // by removing the token. But we can add server-side logic if needed.

    res.json({
      success: true,
      message: "Logged out successfully",
      userType: "agent",
    });
  } catch (error) {
    console.error("Agent logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
    });
  }
};

// Agent Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const agentId = req.user.id;
    const userCount = await User.countDocuments({ agentId });
    const betCount = await Bet.countDocuments({
      userId: { $in: await User.find({ agentId }).distinct("_id") },
    });
    const totalAmount = await Bet.aggregate([
      {
        $match: {
          userId: { $in: await User.find({ agentId }).distinct("_id") },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    res.json({
      success: true,
      message: "Agent dashboard data",
      data: {
        userCount,
        betCount,
        totalAmount: totalAmount[0] ? totalAmount[0].total : 0,
      },
    });
  } catch (error) {
    console.error("Agent dashboard error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching dashboard" });
  }
};

// Add User (by Agent)
exports.addUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: errors.array(),
      });
    }
    const { fullName, mobile, password, referralCode } = req.body;
    const existing = await User.findOne({ mobile });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile already registered" });
    }
    const hash = await bcrypt.hash(password, 10);
    const agentId = req.user.id;
    // Create a username from mobile if not provided
    const username = `u${mobile}`;
    const user = new User({
      username,
      mobileNumber: mobile,
      passwordHash: hash,
      referral: referralCode,
      agentId,
      balance: 0,
      isActive: true,
    });
    await user.save();
    await Agent.findByIdAndUpdate(agentId, { $push: { users: user._id } });
    res
      .status(201)
      .json({ success: true, message: "User added successfully", data: user });
  } catch (error) {
    console.error("Add user error:", error);
    res.status(500).json({ success: false, message: "Error adding user" });
  }
};

// View Users (linked to Agent)
exports.getUsers = async (req, res) => {
  try {
    const agentId = req.user.id;
    const users = await User.find({ agentId });
    res.json({ success: true, message: "Users retrieved", data: users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

// View Bets (by userId)
exports.getBets = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId required" });
    }
    const bets = await Bet.find({ userId });
    res.json({ success: true, message: "Bets retrieved", data: bets });
  } catch (error) {
    console.error("Get bets error:", error);
    res.status(500).json({ success: false, message: "Error fetching bets" });
  }
};

// View Transactions (by userId)
exports.getTransactions = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId required" });
    }
    const transactions = await Transaction.find({ userId });
    res.json({
      success: true,
      message: "Transactions retrieved",
      data: transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching transactions" });
  }
};

// View Results (by userId)
exports.getResults = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId required" });
    }
    const bets = await Bet.find({ userId });
    const results = await Promise.all(
      bets.map(async (bet) => {
        const round = await Result.findOne({ roundNumber: bet.roundNumber });
        return {
          roundNumber: bet.roundNumber,
          numbers: bet.numbers,
          resultNumber: round ? round.resultNumber : null,
          status: bet.status,
          createdAt: bet.createdAt,
        };
      })
    );
    res.json({ success: true, message: "Results retrieved", data: results });
  } catch (error) {
    console.error("Get results error:", error);
    res.status(500).json({ success: false, message: "Error fetching results" });
  }
};
