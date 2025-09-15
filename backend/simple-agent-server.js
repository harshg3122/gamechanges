const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3001;

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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Simple Agent server is running" });
});

// Get all agents
app.get("/api/admin-panel/agents", async (req, res) => {
  try {
    console.log("📥 GET /api/admin-panel/agents");
    const agents = await Agent.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        agents: agents,
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

    console.log("📥 POST /api/admin-panel/agents", {
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
        if (attempts > 10) break;
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

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Simple Agent Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Agents API: http://localhost:${PORT}/api/admin-panel/agents`);

  // Show current agent count
  try {
    const agentCount = await Agent.countDocuments();
    console.log(`📊 Current agents in database: ${agentCount}`);
  } catch (error) {
    console.log("⚠️ Could not count agents:", error.message);
  }
});

module.exports = app;
