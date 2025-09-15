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
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/numbergame", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Working server is running" });
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
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      finalReferralCode = result;
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

// Update agent
app.put("/api/admin-panel/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, mobile, commissionRate, isActive } = req.body;

    console.log("📥 PUT /api/admin-panel/agents/:id", { id, fullName, mobile });

    if (!fullName || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Full name and mobile are required",
      });
    }

    const agent = await Agent.findByIdAndUpdate(
      id,
      {
        fullName,
        mobile,
        commissionRate: commissionRate || 5,
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    console.log("✅ Agent updated successfully:", {
      id: agent._id,
      fullName: agent.fullName,
    });

    res.json({
      success: true,
      message: "Agent updated successfully",
      data: { agent },
    });
  } catch (error) {
    console.error("Update agent error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete agent
app.delete("/api/admin-panel/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("📥 DELETE /api/admin-panel/agents/:id", { id });

    const agent = await Agent.findByIdAndDelete(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    console.log("✅ Agent deleted successfully:", {
      id: agent._id,
      fullName: agent.fullName,
    });

    res.json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("Delete agent error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change agent password
app.post("/api/admin-panel/agents/:id/change-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log("📥 POST /api/admin-panel/agents/:id/change-password", { id });

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    agent.password = hashedPassword;
    await agent.save();

    console.log("✅ Agent password changed successfully:", {
      id: agent._id,
      fullName: agent.fullName,
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Working Server running on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(
      `👥 Agents API: http://localhost:${PORT}/api/admin-panel/agents`
    );

    // Show current agent count
    Agent.countDocuments()
      .then((count) => {
        console.log(`📊 Current agents in database: ${count}`);
      })
      .catch((err) => {
        console.log("⚠️ Could not count agents:", err.message);
      });
  });
};

startServer().catch(console.error);

module.exports = app;
