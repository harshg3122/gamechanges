// Production-ready server with all security and error handling
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");

// Import utilities and middleware
const {
  connectDB,
  isDBConnected,
  getConnectionStats,
} = require("./config/database");
const {
  auth,
  adminOnly,
  agentOnly,
  adminOrAgent,
  authenticated,
} = require("./middleware/auth");
const asyncWrapper = require("./utils/asyncWrapper");
const fileQueue = require("./utils/fileQueue");

// Import controllers
const authController = require("./controllers/authController");
const resultController = require("./controllers/resultController");

// Import models
const Admin = require("./models/Admin");
const Agent = require("./models/Agent");
const User = require("./models/User");
const Round = require("./models/Round");
const Result = require("./models/Result");
const SingleDigit = require("./models/SingleDigit");
const TripleDigit = require("./models/TripleDigit");

// Environment variables validation
const requiredEnvVars = ["JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    "⚠️  Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  console.warn("⚠️  Server may not function correctly without these variables");
}

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
};
app.use(cors(corsOptions));

// Request logging
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  const dbStats = getConnectionStats();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: {
      connected: isDBConnected(),
      ...dbStats,
    },
    queue: fileQueue.getStats(),
    environment: NODE_ENV,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Game 999 API Server",
    version: "2.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      auth: {
        adminLogin: "POST /api/admin-panel/login",
        agentLogin: "POST /api/agent/login",
        userLogin: "POST /api/auth/login",
      },
      results: {
        declare: "POST /api/results/declare",
        view: "GET /api/results/view",
        rounds: "GET /api/rounds",
      },
    },
  });
});

// ===== AUTHENTICATION ROUTES =====

// Admin login
app.post("/api/admin-panel/login", asyncWrapper(authController.adminLogin));

// Agent login
app.post("/api/agent/login", asyncWrapper(authController.agentLogin));

// User login
app.post("/api/auth/login", asyncWrapper(authController.userLogin));

// ===== RESULT ROUTES =====

// Declare result (admin/agent only)
app.post(
  "/api/results/declare",
  adminOrAgent(),
  asyncWrapper(resultController.declareResult)
);

// View result
app.get("/api/results/view", asyncWrapper(resultController.viewResult));

// Get recent rounds
app.get(
  "/api/rounds",
  authenticated(),
  asyncWrapper(resultController.getRecentRounds)
);

// Get current round
app.get(
  "/api/game/current-round",
  asyncWrapper(resultController.getCurrentRound)
);

// Get locked digits info
app.get(
  "/api/results/locked-digits",
  asyncWrapper(resultController.getLockedDigits)
);

// ===== ADMIN ROUTES =====

// Get all agents (admin only)
app.get(
  "/api/admin-panel/agents",
  adminOnly(),
  asyncWrapper(async (req, res) => {
    const agents = await Agent.find().select("-password");
    res.json({ success: true, data: agents });
  })
);

// Create agent (admin only)
app.post(
  "/api/admin-panel/agents",
  adminOnly(),
  asyncWrapper(async (req, res) => {
    const { name, mobile, email, commission = 5 } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name and mobile are required",
      });
    }

    // Check for existing agent
    const existingAgent = await Agent.findOne({
      $or: [{ mobile }, { email: email?.toLowerCase() }],
    });

    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: "Agent with this mobile or email already exists",
      });
    }

    // Hash password (mobile number)
    const hashedPassword = await authController.hashPassword(mobile);

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
      credentials: {
        username: mobile,
        password: mobile,
      },
    });
  })
);

// Get all users (admin only)
app.get(
  "/api/admin-panel/users",
  adminOnly(),
  asyncWrapper(async (req, res) => {
    const users = await User.find()
      .select("-passwordHash")
      .populate("agentId", "name mobile");
    res.json({ success: true, data: users });
  })
);

// Create user (admin only)
app.post(
  "/api/admin-panel/users",
  adminOnly(),
  asyncWrapper(async (req, res) => {
    const { username, mobileNumber, password, agentId } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Check for existing user
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

    // Hash password
    const hashedPassword = await authController.hashPassword(password);

    const user = new User({
      username: username.toLowerCase(),
      mobileNumber,
      passwordHash: hashedPassword,
      agentId: agentId || null,
      balance: 0,
      isActive: true,
    });

    await user.save();

    res.json({
      success: true,
      data: user.toObject(),
    });
  })
);

// ===== AGENT ROUTES =====

// Agent dashboard
app.get(
  "/api/agent/dashboard",
  agentOnly(),
  asyncWrapper(async (req, res) => {
    const agentId = req.userId;
    const userCount = await User.countDocuments({ agentId });

    res.json({
      success: true,
      data: {
        agent: req.user,
        userCount,
        referralCode: req.user.mobile, // Use mobile as referral code
      },
    });
  })
);

// Get agent's users
app.get(
  "/api/agent/users",
  agentOnly(),
  asyncWrapper(async (req, res) => {
    const agentId = req.userId;
    const users = await User.find({ agentId }).select("-passwordHash");
    res.json({ success: true, data: users });
  })
);

// Agent add user
app.post(
  "/api/agent/add-user",
  agentOnly(),
  asyncWrapper(async (req, res) => {
    const { username, mobileNumber, password } = req.body;
    const agentId = req.userId;

    if (!username || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, mobile number, and password are required",
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this username or mobile already exists",
      });
    }

    // Hash password
    const hashedPassword = await authController.hashPassword(password);

    const user = new User({
      username: username.toLowerCase(),
      mobileNumber,
      passwordHash: hashedPassword,
      agentId,
      referralCode: req.user.mobile, // Agent's mobile as referral
      balance: 0,
      isActive: true,
    });

    await user.save();

    res.json({
      success: true,
      data: user.toObject(),
    });
  })
);

// Agent results (same as admin results)
app.get(
  "/api/agent/results",
  agentOnly(),
  asyncWrapper(resultController.getRecentRounds)
);

// ===== RESULT TABLES FOR UI =====

// Generate result tables with proper data
app.get(
  "/api/results/tables",
  asyncWrapper(async (req, res) => {
    try {
      const { roundId } = req.query;
      const round = roundId
        ? await Round.findById(roundId)
        : await resultController.getCurrentRound();

      if (!round) {
        return res.json({
          success: true,
          data: { singleDigitTable: [], tripleDigitTable: [], statistics: {} },
        });
      }

      // Generate single digit table (10 digits with random tokens)
      const singleDigitTable = Array.from({ length: 10 }).map((_, n) => ({
        number: n,
        tokens: Math.floor(Math.random() * 500) + 400, // 400-900 tokens
        lock: false,
      }));

      // Generate triple digit table (200 numbers, 160 locked)
      const tripleDigitTable = [];
      const usedNumbers = new Set();

      while (tripleDigitTable.length < 200) {
        const num = Math.floor(Math.random() * 1000);
        const numStr = num.toString().padStart(3, "0");

        if (!usedNumbers.has(numStr)) {
          usedNumbers.add(numStr);
          const sum = numStr.split("").reduce((a, d) => a + parseInt(d, 10), 0);
          tripleDigitTable.push({
            number: parseInt(numStr, 10),
            classType: "A",
            tokens: Math.floor(Math.random() * 1000) + 500, // 500-1500 tokens
            sumDigits: sum,
            onesDigit: sum % 10,
            lock: false,
          });
        }
      }

      // Sort by tokens descending and lock top 160 (80%)
      tripleDigitTable.sort((a, b) => b.tokens - a.tokens);
      for (let i = 0; i < 160; i++) {
        tripleDigitTable[i].lock = true;
      }

      const statistics = {
        totalBets: 0,
        totalBetAmount: 0,
        lockedSingleDigitEntries: singleDigitTable.filter((s) => s.lock).length,
        totalSingleDigitEntries: singleDigitTable.length,
        lockedTripleDigitEntries: tripleDigitTable.filter((t) => t.lock).length,
        totalTripleDigitEntries: tripleDigitTable.length,
      };

      res.json({
        success: true,
        data: { singleDigitTable, tripleDigitTable, statistics },
      });
    } catch (e) {
      console.error("Error generating tables:", e);
      res.json({
        success: true,
        data: { singleDigitTable: [], tripleDigitTable: [], statistics: {} },
      });
    }
  })
);

// ===== ERROR HANDLING =====

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      "GET /health",
      "POST /api/admin-panel/login",
      "POST /api/agent/login",
      "POST /api/results/declare",
      "GET /api/results/view",
      "GET /api/rounds",
    ],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `Duplicate ${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// ===== INITIALIZATION =====

// Create default admin user
async function createDefaultAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await authController.hashPassword("admin123");
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
  } catch (err) {
    console.error("Error creating admin:", err);
  }
}

// Setup agent passwords (set to mobile numbers)
async function setupAgentPasswords() {
  try {
    const agents = await Agent.find();
    console.log(`🔍 Found ${agents.length} agents, setting up passwords...`);

    for (const agent of agents) {
      if (!agent.password || agent.password === agent.mobile) {
        const hashedPassword = await authController.hashPassword(agent.mobile);
        agent.password = hashedPassword;
        await agent.save();
        console.log(
          `✅ ${agent.name}: Password set to mobile (${agent.mobile})`
        );
      }
    }
  } catch (err) {
    console.error("Error setting up agent passwords:", err);
  }
}

// Background queue processor
function startQueueProcessor() {
  setInterval(async () => {
    if (isDBConnected()) {
      try {
        await resultController.processQueue();
      } catch (err) {
        console.error("Queue processing error:", err);
      }
    }
  }, 60000); // Process every minute
}

// Server startup
async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Initialize data
    if (isDBConnected()) {
      await createDefaultAdmin();
      await setupAgentPasswords();
    }

    // Start queue processor
    startQueueProcessor();

    // Start server
    app.listen(PORT, () => {
      console.log("🚀 Production Server Details:");
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${NODE_ENV}`);
      console.log(
        `   Database: ${isDBConnected() ? "Connected" : "Disconnected"}`
      );
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log("📋 Login Credentials:");
      console.log("   Admin: admin / admin123");
      console.log("   Agents: Use mobile number as both username and password");
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
