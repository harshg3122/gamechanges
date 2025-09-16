const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/numbergame", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

const Agent = mongoose.model("Agent", agentSchema);

async function setupAgentPasswords() {
  try {
    console.log("🔍 Setting up agent passwords...");

    const agents = await Agent.find();
    console.log(`Found ${agents.length} agents`);

    for (const agent of agents) {
      // Set mobile number as password for easy testing
      const newPassword = agent.mobile;
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await Agent.findByIdAndUpdate(agent._id, {
        password: hashedPassword,
      });

      console.log(
        `✅ ${agent.fullName}: Password set to mobile number (${agent.mobile})`
      );
    }

    console.log("\n🎉 All agent passwords updated!");
    console.log("\n📋 Login Credentials:");
    console.log("===================");
    console.log("Admin: admin / admin123");
    console.log("Agents: Use mobile number as both username and password");

    for (const agent of agents) {
      console.log(`${agent.fullName}: ${agent.mobile} / ${agent.mobile}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

setupAgentPasswords();
