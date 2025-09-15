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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Minimal server is running" });
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
app.listen(PORT, async () => {
  console.log(`🚀 Minimal Server running on port ${PORT}`);
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
