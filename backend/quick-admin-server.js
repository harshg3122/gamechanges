const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/numbergame", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, default: "admin" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.model("Admin", adminSchema);

// Agent Schema
const agentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
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
  referralCode: { type: String, required: true, unique: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true },
  commissionRate: { type: Number, default: 5, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now },
});

agentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

const Agent = mongoose.model("Agent", agentSchema);

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    mobileNumber: {
      type: String,
      required: function () {
        return this.mobileNumber && this.mobileNumber.trim() !== "";
      },
      validate: {
        validator: function (v) {
          return !v || v.trim() === "" || /^\d{10}$/.test(v);
        },
        message: "Please enter a valid 10-digit mobile number",
      },
      default: undefined,
    },
    email: {
      type: String,
      required: false,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      trim: true,
      lowercase: true,
    },
    referral: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: false,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    wallet: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
    },
    walletBalance: {
      type: Number,
      default: function () {
        return this.wallet || 0;
      },
      min: [0, "Wallet balance cannot be negative"],
    },
    role: {
      type: String,
      default: "user",
      enum: ["user"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    totalWinnings: {
      type: Number,
      default: 0,
    },
    totalLosses: {
      type: Number,
      default: 0,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (this.isModified("passwordHash")) {
    try {
      const saltRounds = 12;
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    } catch (error) {
      return next(error);
    }
  }

  if (this.isModified("wallet")) {
    this.walletBalance = this.wallet;
  } else if (this.isModified("walletBalance")) {
    this.wallet = this.walletBalance;
  }

  next();
});

const User = mongoose.model("User", userSchema);

// Generate referral code function
function generateReferralCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create admin if doesn't exist
async function createAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 12);
      const admin = new Admin({
        username: "admin",
        email: "admin@game.com",
        passwordHash: hashedPassword,
        fullName: "System Administrator",
        role: "admin",
      });
      await admin.save();
      console.log("✅ Admin user created: admin/admin123");
    } else {
      console.log("✅ Admin user exists");
    }
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
}

// Setup agent passwords
async function setupAgentPasswords() {
  try {
    const agents = await Agent.find();
    console.log(`🔍 Found ${agents.length} agents, setting up passwords...`);

    for (const agent of agents) {
      // Set mobile number as password for easy testing
      const newPassword = agent.mobile;
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await Agent.findByIdAndUpdate(agent._id, {
        password: hashedPassword,
      });

      console.log(
        `✅ ${agent.fullName}: Password set to mobile (${agent.mobile})`
      );
    }

    console.log("\n📋 Login Credentials:");
    console.log("Admin: admin / admin123");
    console.log("Agents: Use mobile number as both username and password");
    for (const agent of agents) {
      console.log(`${agent.fullName}: ${agent.mobile} / ${agent.mobile}`);
    }
  } catch (error) {
    console.error("❌ Error setting up agent passwords:", error);
  }
}

// Admin login endpoint
app.post("/api/admin-panel/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("🔐 Admin login attempt:", username);

    const admin = await Admin.findOne({
      $or: [{ username: username }, { email: username }],
    });

    if (!admin) {
      console.log("❌ Admin not found");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { adminId: admin._id, role: "admin" },
      process.env.JWT_SECRET || "game999secret",
      { expiresIn: "24h" }
    );

    console.log("✅ Admin login successful");

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Agent login endpoint
app.post("/api/agent/login", async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be mobile, email, or fullName

    console.log("🔐 Agent login attempt:", identifier);

    const agent = await Agent.findOne({
      $or: [
        { mobile: identifier },
        { email: identifier },
        { fullName: identifier },
      ],
      isActive: true,
    });

    if (!agent) {
      console.log("❌ Agent not found or inactive");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or agent inactive",
      });
    }

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { agentId: agent._id, role: "agent" },
      process.env.JWT_SECRET || "game999secret",
      { expiresIn: "24h" }
    );

    console.log("✅ Agent login successful:", agent.fullName);

    res.json({
      success: true,
      message: "Login successful",
      token,
      agent: {
        _id: agent._id,
        fullName: agent.fullName,
        mobile: agent.mobile,
        email: agent.email,
        referralCode: agent.referralCode,
        role: "agent",
      },
    });
  } catch (error) {
    console.error("❌ Agent login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
    });
  }
});

// Get all agents endpoint
app.get("/api/admin-panel/agents", async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    console.error("❌ Error fetching agents:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching agents",
    });
  }
});

// Agent dashboard endpoint
app.get("/api/agent/dashboard", async (req, res) => {
  try {
    // For now, return basic dashboard data
    // In a real app, you'd verify the agent token here
    res.json({
      success: true,
      data: {
        message: "Agent dashboard data",
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalCommission: 0,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching agent dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard",
    });
  }
});

// Get agent's users endpoint
app.get("/api/agent/users", async (req, res) => {
  try {
    // For now, return all users - in real app, filter by agentId
    const users = await User.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("❌ Error fetching agent users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
});

// Add user by agent endpoint
app.post("/api/agent/add-user", async (req, res) => {
  try {
    const { fullName, mobile, password } = req.body;

    console.log("🔄 Agent adding user:", { fullName, mobile });

    // Check if mobile already exists
    const existingUser = await User.findOne({ mobileNumber: mobile });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists",
      });
    }

    const user = new User({
      username: `u${mobile}`,
      mobileNumber: mobile,
      passwordHash: password || "defaultpass123",
      wallet: 0,
      isActive: true,
      // In real app, you'd get agentId from the token
      agentId: null,
      referral: "",
    });

    await user.save();

    console.log("✅ User added by agent:", user.username);

    res.status(201).json({
      success: true,
      message: "User added successfully",
      data: user,
    });
  } catch (error) {
    console.error("❌ Error adding user:", error);
    res.status(500).json({
      success: false,
      message: "Error adding user",
    });
  }
});

// Get results for agent
app.get("/api/agent/results", async (req, res) => {
  try {
    // For now, return empty results - you can implement this based on your results schema
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("❌ Error fetching results:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching results",
    });
  }
});

// Create new agent endpoint
app.post("/api/admin-panel/agents", async (req, res) => {
  try {
    const { fullName, mobile, email, password } = req.body;

    console.log("🔄 Creating agent:", { fullName, mobile, email });

    // Check if mobile/email already exists
    const existingAgent = await Agent.findOne({
      $or: [{ mobile }, ...(email ? [{ email }] : [])],
    });
    if (existingAgent) {
      console.log("❌ Agent already exists");
      return res.status(400).json({
        success: false,
        message: "Mobile or Email already exists",
      });
    }

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = generateReferralCode();
      const existingAgentWithReferral = await Agent.findOne({ referralCode });
      if (!existingAgentWithReferral) {
        isUnique = true;
      }
    }

    const agent = new Agent({
      fullName,
      mobile,
      email: email || undefined,
      password: password || "defaultpass123",
      referralCode,
    });

    await agent.save();

    console.log("✅ Agent created successfully:", agent.fullName);

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: { agent },
    });
  } catch (error) {
    console.error("❌ Create agent error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating agent",
    });
  }
});

// Update agent endpoint
app.put("/api/admin-panel/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, mobile, email } = req.body;

    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { fullName, mobile, email },
      { new: true, runValidators: true }
    );

    if (!updatedAgent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    res.json({
      success: true,
      message: "Agent updated successfully",
      data: updatedAgent,
    });
  } catch (error) {
    console.error("❌ Update agent error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating agent",
    });
  }
});

// Delete agent endpoint
app.delete("/api/admin-panel/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAgent = await Agent.findByIdAndDelete(id);

    if (!deletedAgent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    res.json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete agent error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting agent",
    });
  }
});

// Change agent password endpoint
app.post("/api/admin-panel/agents/:id/change-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedAgent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
    });
  }
});

// Toggle agent status endpoint
app.patch("/api/admin-panel/agents/:id/toggle-status", async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    agent.isActive = !agent.isActive;
    await agent.save();

    res.json({
      success: true,
      message: `Agent ${
        agent.isActive ? "activated" : "deactivated"
      } successfully`,
      data: agent,
    });
  } catch (error) {
    console.error("❌ Toggle status error:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling agent status",
    });
  }
});

// User Management Endpoints

// Get all users endpoint
app.get("/api/admin-panel/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: {
        users: users,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
});

// Create new user endpoint
app.post("/api/admin-panel/users", async (req, res) => {
  try {
    const { username, email, mobileNumber, password, agentId } = req.body;

    console.log("🔄 Creating user:", {
      username,
      email,
      mobileNumber,
      agentId,
    });

    // Clean up mobile number
    const cleanMobileNumber =
      mobileNumber && mobileNumber.trim() !== ""
        ? mobileNumber.trim()
        : undefined;

    // Check if username/mobile/email already exists
    const existingUser = await User.findOne({
      $or: [
        { username },
        ...(cleanMobileNumber ? [{ mobileNumber: cleanMobileNumber }] : []),
        ...(email ? [{ email }] : []),
      ],
    });

    if (existingUser) {
      console.log("❌ User already exists");
      return res.status(400).json({
        success: false,
        message: "Username, mobile number, or email already exists",
      });
    }

    // If agentId is provided, get the agent's referral code
    let referralCode = "";
    if (agentId) {
      const agent = await Agent.findById(agentId);
      if (agent) {
        referralCode = agent.referralCode;
        console.log(
          "✅ User will be linked to agent:",
          agent.fullName,
          "with referral code:",
          referralCode
        );
      } else {
        console.log("⚠️ Agent not found for ID:", agentId);
      }
    }

    const user = new User({
      username,
      email: email || undefined,
      mobileNumber: cleanMobileNumber,
      passwordHash: password || "defaultpass123",
      wallet: 0,
      isActive: true,
      ...(agentId && { agentId }), // Link to agent if provided
      ...(referralCode && { referral: referralCode }), // Set referral code
    });

    await user.save();

    // If user is linked to an agent, add user to agent's users array
    if (agentId) {
      await Agent.findByIdAndUpdate(agentId, {
        $push: { users: user._id },
      });
      console.log("✅ User added to agent's users list");
    }

    console.log("✅ User created successfully:", user.username);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user },
    });
  } catch (error) {
    console.error("❌ Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
});

// Update user endpoint
app.put("/api/admin-panel/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, mobileNumber } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email, mobileNumber },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("❌ Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
});

// Delete user endpoint
app.delete("/api/admin-panel/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
});

// Toggle user status endpoint
app.patch("/api/admin-panel/users/:id/toggle-status", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      data: user,
    });
  } catch (error) {
    console.error("❌ Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling user status",
    });
  }
});

// Get user details endpoint
app.get("/api/admin-panel/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Get user details error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user details",
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Quick Admin Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);

  try {
    await createAdmin();
    await setupAgentPasswords();
  } catch (error) {
    console.error("❌ Error during startup:", error);
  }
});
