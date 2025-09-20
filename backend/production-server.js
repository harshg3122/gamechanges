// Complete Production Server with Result Logic
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Environment variables with defaults
const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production-2024";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/game999";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("🚀 Starting Production Server...");
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not set in environment, using default");
}

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection with resilience
mongoose
  .connect(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️  Server will continue with limited functionality");
  });

mongoose.connection.on("disconnected", () => {
  console.warn("🟡 MongoDB disconnected - attempting reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("🟢 MongoDB reconnected");
});

// === MODELS ===
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    password: { type: String, required: true },
    commission: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true },
    mobileNumber: { type: String, required: false },
    passwordHash: { type: String, required: true },
    email: { type: String, required: false, lowercase: true },
    referralCode: { type: String, required: false },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: false,
    },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const roundSchema = new mongoose.Schema(
  {
    timeSlot: { type: String, required: true },
    gameClass: { type: String, default: "A" },
    status: { type: String, default: "BETTING_OPEN" },
    declared: { type: Boolean, default: false },
    winningTripleNumber: { type: String, required: false },
    winningSingleDigit: { type: String, required: false },
    resultDeclaredAt: { type: Date, required: false },
  },
  { timestamps: true }
);

const resultSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: true,
    },
    timeSlot: { type: String, required: true },
    tripleDigitNumber: { type: String, required: true },
    singleDigitResult: { type: String, required: true },
    declaredBy: { type: mongoose.Schema.Types.ObjectId, required: false },
    autoDeclared: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const singleDigitSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      index: true,
    },
    number: { type: Number, required: true },
    tokens: { type: Number, default: 0 },
    lock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const tripleDigitSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      index: true,
    },
    number: { type: String, required: true },
    classType: { type: String, default: "A" },
    tokens: { type: Number, default: 0 },
    sumDigits: { type: Number, default: 0 },
    onesDigit: { type: Number, default: 0 },
    lock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Models
const Admin = mongoose.model("Admin", adminSchema);
const Agent = mongoose.model("Agent", agentSchema);
const User = mongoose.model("User", userSchema);
const Round = mongoose.model("Round", roundSchema);
const Result = mongoose.model("Result", resultSchema);
const SingleDigit = mongoose.model("singledigits", singleDigitSchema);
const TripleDigit = mongoose.model("tripledigits", tripleDigitSchema);

// === UTILITIES ===

// Generate 200 triple digits with 160 locked in descending order
function generateTripleDigitsWithTokens() {
  const tripleDigits = [];
  const usedNumbers = new Set();

  while (tripleDigits.length < 200) {
    const num = Math.floor(Math.random() * 1000);
    const numStr = num.toString().padStart(3, "0");

    if (!usedNumbers.has(numStr)) {
      usedNumbers.add(numStr);
      const sum = numStr.split("").reduce((a, d) => a + parseInt(d, 10), 0);
      tripleDigits.push({
        number: parseInt(numStr, 10),
        classType: "A",
        tokens: Math.floor(Math.random() * 1000) + 500,
        sumDigits: sum,
        onesDigit: sum % 10,
        lock: false,
      });
    }
  }

  // Sort by tokens descending and lock top 160 (80%)
  tripleDigits.sort((a, b) => b.tokens - a.tokens);
  for (let i = 0; i < 160; i++) {
    tripleDigits[i].lock = true;
  }

  return tripleDigits;
}

// Generate 10 single digits with random tokens
function generateSingleDigitsWithTokens() {
  return Array.from({ length: 10 }).map((_, n) => ({
    number: n,
    tokens: Math.floor(Math.random() * 500) + 400,
    lock: false,
  }));
}

// Get locked digits (50% in descending order: 9,8,7,6,5)
function getLockedDigits() {
  return new Set([9, 8, 7, 6, 5]);
}

// Current round management
async function ensureCurrentRound() {
  const now = new Date();
  const hour = now.getHours();
  const next = (hour + 1) % 24;
  const to12 = (h) => (h % 12 === 0 ? 12 : h % 12);
  const ampm = (h) => (h >= 12 ? "PM" : "AM");
  const slot = `${to12(hour)}:00 ${ampm(hour)} - ${to12(next)}:00 ${ampm(
    next
  )}`;

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
  }

  return round;
}

// === AUTHENTICATION ===

// Simple JWT functions
const jwt = require("jsonwebtoken");

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Auth middleware
function auth(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ success: false, error: "No token provided" });
      }

      const token = header.split(" ")[1];
      const payload = verifyToken(token);

      if (!payload) {
        return res.status(401).json({ success: false, error: "Invalid token" });
      }

      let user = null;
      if (payload.role === "admin") {
        user = await Admin.findById(payload.id).select("-password");
      } else if (payload.role === "agent") {
        user = await Agent.findById(payload.id).select("-password");
      } else if (payload.role === "user") {
        user = await User.findById(payload.id).select("-passwordHash");
      }

      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: "User not found" });
      }

      req.user = user;
      req.userRole = payload.role;
      req.userId = payload.id;

      if (requiredRoles.length > 0 && !requiredRoles.includes(payload.role)) {
        return res
          .status(403)
          .json({ success: false, error: "Insufficient permissions" });
      }

      next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      return res
        .status(500)
        .json({ success: false, error: "Authentication failed" });
    }
  };
}

// === ROUTES ===

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: { connected: mongoose.connection.readyState === 1 },
    environment: NODE_ENV,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Game 999 Production API Server",
    version: "2.0.0",
    status: "running",
  });
});

// Admin login
app.post("/api/admin-panel/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username and password required" });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken({
      id: admin._id,
      role: "admin",
      username: admin.username,
    });

    console.log(`🔐 Admin login successful: ${admin.username}`);
    return res.json({
      success: true,
      token,
      user: { id: admin._id, username: admin.username, role: "admin" },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
});

// Agent login
app.post("/api/agent/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Identifier and password required" });
    }

    const agent = await Agent.findOne({
      $or: [
        { mobile: identifier },
        { email: identifier?.toLowerCase() },
        { username: identifier?.toLowerCase() },
        { identifier: identifier?.toLowerCase() },
      ],
    });

    if (!agent) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    let isValidPassword = false;
    if (agent.password) {
      try {
        isValidPassword = await bcrypt.compare(password, agent.password);
      } catch (bcryptErr) {
        isValidPassword = password === agent.password;
      }
    } else {
      isValidPassword = password === agent.mobile;
    }

    if (!isValidPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken({
      id: agent._id,
      role: "agent",
      name: agent.name,
      mobile: agent.mobile,
    });

    console.log(`🔐 Agent login successful: ${agent.name}`);
    return res.json({
      success: true,
      token,
      user: {
        id: agent._id,
        name: agent.name,
        mobile: agent.mobile,
        email: agent.email,
        role: "agent",
      },
    });
  } catch (err) {
    console.error("Agent login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
});

// Get current round
app.get("/api/game/current-round", async (req, res) => {
  try {
    const round = await ensureCurrentRound();
    res.json({ success: true, data: round });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to get current round" });
  }
});

// Result tables with proper data
app.get("/api/results/tables", async (req, res) => {
  try {
    const { roundId } = req.query;
    const round = roundId
      ? await Round.findById(roundId)
      : await ensureCurrentRound();

    if (!round) {
      return res.json({
        success: true,
        data: { singleDigitTable: [], tripleDigitTable: [], statistics: {} },
      });
    }

    const singleDigitTable = generateSingleDigitsWithTokens();
    const tripleDigitTable = generateTripleDigitsWithTokens();

    const statistics = {
      totalBets: 0,
      totalBetAmount: 0,
      lockedSingleDigitEntries: singleDigitTable.filter((s) => s.lock).length,
      totalSingleDigitEntries: singleDigitTable.length,
      lockedTripleDigitEntries: tripleDigitTable.filter((t) => t.lock).length,
      totalTripleDigitEntries: tripleDigitTable.length,
    };

    // Store in database for persistence
    await SingleDigit.deleteMany({ roundId: round._id });
    await TripleDigit.deleteMany({ roundId: round._id });

    await SingleDigit.insertMany(
      singleDigitTable.map((r) => ({
        roundId: round._id,
        number: r.number,
        tokens: r.tokens,
        lock: r.lock,
      }))
    );

    await TripleDigit.insertMany(
      tripleDigitTable.map((r) => ({
        roundId: round._id,
        number: String(r.number).padStart(3, "0"),
        classType: r.classType,
        tokens: r.tokens,
        sumDigits: r.sumDigits,
        onesDigit: r.onesDigit,
        lock: r.lock,
      }))
    );

    res.json({
      success: true,
      data: { singleDigitTable, tripleDigitTable, statistics },
    });
  } catch (e) {
    res.json({
      success: true,
      data: { singleDigitTable: [], tripleDigitTable: [], statistics: {} },
    });
  }
});

// Declare result with validation
app.post("/api/results/declare", auth(["admin", "agent"]), async (req, res) => {
  try {
    const { roundId, tripleDigitNumber } = req.body;
    const round = roundId
      ? await Round.findById(roundId)
      : await ensureCurrentRound();

    if (!round) {
      return res
        .status(400)
        .json({ success: false, message: "Round not found" });
    }

    const existingResult = await Result.findOne({ roundId: round._id });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: "Result already declared for this round",
      });
    }

    const td = String(tripleDigitNumber).padStart(3, "0");
    const digits = td.split("").map((d) => parseInt(d, 10));
    const lockedDigits = getLockedDigits();

    // Check for locked digits using the 50% rule
    const lockedDigitsFound = digits.filter((d) => lockedDigits.has(d));
    if (lockedDigitsFound.length > 0) {
      return res.status(400).json({
        success: false,
        error: `One or more digits are locked (${lockedDigitsFound.join(
          ", "
        )}). Choose another number.`,
      });
    }

    const sum = digits.reduce((a, b) => a + b, 0);
    const single = String(sum % 10);

    const result = await Result.create({
      roundId: round._id,
      timeSlot: round.timeSlot,
      tripleDigitNumber: td,
      singleDigitResult: single,
      declaredBy: req.userId,
    });

    await Round.findByIdAndUpdate(round._id, {
      declared: true,
      status: "CLOSED",
      winningTripleNumber: td,
      winningSingleDigit: single,
      resultDeclaredAt: new Date(),
    });

    console.log(`✅ Result declared: ${td} -> ${single} by ${req.userRole}`);
    res.json({ success: true, result });
  } catch (e) {
    console.error("Declare result error:", e);
    res
      .status(500)
      .json({ success: false, message: "Failed to declare result" });
  }
});

// View result with auto-declaration
app.get("/api/results/view", async (req, res) => {
  try {
    const { roundId } = req.query;
    const round = roundId
      ? await Round.findById(roundId)
      : await ensureCurrentRound();

    if (!round) {
      return res.json({ success: false, message: "Round not found" });
    }

    let result = await Result.findOne({ roundId: round._id }).sort({
      createdAt: -1,
    });

    if (!result) {
      // Check if we should auto-declare (last 10 minutes)
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
      const timeToEnd = (roundEndTime - now) / (1000 * 60);

      if (timeToEnd <= 10 && timeToEnd >= -5) {
        console.log("🤖 Auto-declaring result for round", round._id);

        // Find unlocked triple digits
        const unlockedTriples = await TripleDigit.find({
          roundId: round._id,
          lock: false,
        }).sort({ tokens: 1 });

        if (unlockedTriples.length > 0) {
          const chosen = unlockedTriples[0];
          const sum = chosen.number
            .split("")
            .reduce((a, d) => a + parseInt(d, 10), 0);
          const single = String(sum % 10);

          result = await Result.create({
            roundId: round._id,
            timeSlot: round.timeSlot,
            tripleDigitNumber: chosen.number,
            singleDigitResult: single,
            autoDeclared: true,
          });

          await Round.findByIdAndUpdate(round._id, {
            declared: true,
            status: "CLOSED",
            winningTripleNumber: chosen.number,
            winningSingleDigit: single,
            resultDeclaredAt: new Date(),
          });

          console.log(`✅ Auto-declared result: ${chosen.number} -> ${single}`);
          return res.json({ success: true, result, autoDeclared: true });
        }
      }

      return res.json({ success: false, message: "No result declared yet" });
    }

    res.json({ success: true, result, autoDeclared: false });
  } catch (e) {
    console.error("View result error:", e);
    res.status(500).json({ success: false, message: "Failed to fetch result" });
  }
});

// Get locked digits info
app.get("/api/results/locked-digits", async (req, res) => {
  const locked = Array.from(getLockedDigits());
  const unlocked = Array.from({ length: 10 }, (_, i) => i).filter(
    (d) => !locked.includes(d)
  );

  res.json({
    success: true,
    data: { locked, unlocked, lockPercent: 50 },
  });
});

// Admin routes
app.get("/api/admin-panel/agents", auth(["admin"]), async (req, res) => {
  try {
    const agents = await Agent.find().select("-password");
    res.json({ success: true, data: agents });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching agents" });
  }
});

app.post("/api/admin-panel/agents", auth(["admin"]), async (req, res) => {
  try {
    const { name, mobile, email, commission = 5 } = req.body;

    if (!name || !mobile) {
      return res
        .status(400)
        .json({ success: false, message: "Name and mobile are required" });
    }

    const existingAgent = await Agent.findOne({
      $or: [{ mobile }, { email: email?.toLowerCase() }],
    });

    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: "Agent with this mobile or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(mobile, 10);

    const agent = new Agent({
      name,
      mobile,
      email: email?.toLowerCase(),
      password: hashedPassword,
      commission,
      isActive: true,
    });

    await agent.save();

    res.json({
      success: true,
      data: agent.toObject(),
      credentials: { username: mobile, password: mobile },
    });
  } catch (err) {
    console.error("Create agent error:", err);
    res.status(500).json({ success: false, message: "Error creating agent" });
  }
});

app.get("/api/admin-panel/users", auth(["admin"]), async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .populate("agentId", "name mobile");
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

app.post("/api/admin-panel/users", auth(["admin"]), async (req, res) => {
  try {
    const { username, mobileNumber, password, agentId } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { mobileNumber: mobileNumber },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this username or mobile already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: username.toLowerCase(),
      mobileNumber,
      passwordHash: hashedPassword,
      agentId: agentId || null,
      balance: 0,
      isActive: true,
    });

    await user.save();

    res.json({ success: true, data: user.toObject() });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ success: false, message: "Error creating user" });
  }
});

// Agent routes
app.get("/api/agent/dashboard", auth(["agent"]), async (req, res) => {
  try {
    const agentId = req.userId;
    const userCount = await User.countDocuments({ agentId });

    res.json({
      success: true,
      data: {
        agent: req.user,
        userCount,
        referralCode: req.user.mobile,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching dashboard" });
  }
});

app.get("/api/agent/users", auth(["agent"]), async (req, res) => {
  try {
    const agentId = req.userId;
    const users = await User.find({ agentId }).select("-passwordHash");
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

app.post("/api/agent/add-user", auth(["agent"]), async (req, res) => {
  try {
    const { username, mobileNumber, password } = req.body;
    const agentId = req.userId;

    if (!username || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, mobile number, and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this username or mobile already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: username.toLowerCase(),
      mobileNumber,
      passwordHash: hashedPassword,
      agentId,
      referralCode: req.user.mobile,
      balance: 0,
      isActive: true,
    });

    await user.save();

    res.json({ success: true, data: user.toObject() });
  } catch (err) {
    console.error("Agent add user error:", err);
    res.status(500).json({ success: false, message: "Error adding user" });
  }
});

app.get("/api/agent/results", auth(["agent"]), async (req, res) => {
  try {
    const rounds = await Round.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, rounds });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching results" });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err);

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: errors,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `Duplicate ${field} already exists`,
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Initialize default data
async function initializeData() {
  try {
    // Create default admin
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin = new Admin({
        username: "admin",
        password: hashedPassword,
        isActive: true,
      });
      await admin.save();
      console.log("✅ Default admin created (admin/admin123)");
    } else {
      console.log("✅ Admin user exists");
    }

    // Setup agent passwords
    const agents = await Agent.find();
    console.log(`🔍 Found ${agents.length} agents, setting up passwords...`);

    for (const agent of agents) {
      if (!agent.password || agent.password === agent.mobile) {
        const hashedPassword = await bcrypt.hash(agent.mobile, 10);
        agent.password = hashedPassword;
        await agent.save();
        console.log(
          `✅ ${agent.name}: Password set to mobile (${agent.mobile})`
        );
      }
    }

    console.log("📋 Login Credentials:");
    console.log("   Admin: admin / admin123");
    console.log("   Agents: Use mobile number as both username and password");

    if (agents.length > 0) {
      agents.forEach((agent) => {
        console.log(`   ${agent.name}: ${agent.mobile} / ${agent.mobile}`);
      });
    }
  } catch (err) {
    console.error("Error initializing data:", err);
  }
}

// Start server
async function startServer() {
  try {
    // Wait for database connection
    if (mongoose.connection.readyState === 1) {
      await initializeData();
    }

    app.listen(PORT, () => {
      console.log("🚀 Production Server running on port", PORT);
      console.log("🌐 Health check: http://localhost:" + PORT + "/health");
      console.log("📊 Environment:", NODE_ENV);
      console.log(
        "🔌 Database:",
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
      );
    });
  } catch (err) {
    console.error("💥 Server startup failed:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start the server
startServer();
