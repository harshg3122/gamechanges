require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/numbergame", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Agent Schema
const agentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    referralCode: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    commissionRate: { type: Number, default: 5 },
  },
  { timestamps: true }
);

const Agent = mongoose.model("Agent", agentSchema);

// Generate unique referral code
const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Admin Schema (simple for login)
const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
});
const Admin = mongoose.model("Admin", adminSchema);

// Create default admin if not exists
const createDefaultAdmin = async () => {
  const existingAdmin = await Admin.findOne({ username: "admin" });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await Admin.create({
      username: "admin",
      password: hashedPassword,
      email: "admin@game.com",
    });
    console.log("✅ Default admin created: admin/admin123");
  }
};

// Routes

// Admin login
app.post("/api/admin-panel/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: "Login successful",
      token: "dummy-token-for-demo",
      admin: { id: admin._id, username: admin.username, email: admin.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all agents
app.get("/api/admin-panel/agents", async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });

    // Add referral statistics (mock for now)
    const agentsWithStats = agents.map((agent) => ({
      ...agent.toObject(),
      referredUsers: 0, // Mock data
    }));

    res.json({
      success: true,
      data: {
        agents: agentsWithStats,
        pagination: {
          totalAgents: agents.length,
          currentPage: 1,
          totalPages: 1,
        },
      },
    });
  } catch (error) {
    console.error("Get agents error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new agent
app.post("/api/admin-panel/agents", async (req, res) => {
  try {
    const { fullName, mobile, password, referralCode } = req.body;

    console.log("📥 Received agent creation request:", {
      fullName,
      mobile,
      referralCode,
    });

    if (!fullName || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, mobile, and password are required",
      });
    }

    // Check if mobile already exists
    const existingAgent = await Agent.findOne({ mobile });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists",
      });
    }

    // Use provided referral code or generate one
    let finalReferralCode = referralCode;
    if (!finalReferralCode) {
      let attempts = 0;
      do {
        finalReferralCode = generateReferralCode();
        attempts++;
        if (attempts > 10) break; // Safety check
      } while (await Agent.findOne({ referralCode: finalReferralCode }));
    } else {
      // Check if provided referral code already exists
      const existingCode = await Agent.findOne({
        referralCode: finalReferralCode,
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: "Referral code already exists",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create agent
    const agent = new Agent({
      fullName,
      mobile,
      password: hashedPassword,
      referralCode: finalReferralCode,
      isActive: true,
      commissionRate: 5,
    });

    await agent.save();

    console.log("✅ Agent created successfully:", {
      id: agent._id,
      fullName: agent.fullName,
      referralCode: agent.referralCode,
    });

    // Return agent without password
    const agentResponse = agent.toObject();
    delete agentResponse.password;

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: { agent: agentResponse },
    });
  } catch (error) {
    console.error("Create agent error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Agent server is running" });
});

// Start server
const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Agent Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Agents API: http://localhost:${PORT}/api/admin-panel/agents`);

  await createDefaultAdmin();

  // Show current agent count
  const agentCount = await Agent.countDocuments();
  console.log(`📊 Current agents in database: ${agentCount}`);
});

module.exports = app;
