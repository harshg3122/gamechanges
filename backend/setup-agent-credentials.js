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

async function setupAgentCredentials() {
  try {
    console.log("🔍 Setting up agent credentials...");

    // Get all agents
    const agents = await Agent.find();
    console.log(`Found ${agents.length} agents in database`);

    for (const agent of agents) {
      console.log(`\n📝 Setting up credentials for: ${agent.fullName}`);
      console.log(`   Mobile: ${agent.mobile}`);
      console.log(`   Email: ${agent.email || "N/A"}`);
      console.log(`   Referral Code: ${agent.referralCode}`);

      // Set a simple password for each agent (mobile number as password)
      const simplePassword = agent.mobile;
      const hashedPassword = await bcrypt.hash(simplePassword, 12);

      // Update agent with new password
      await Agent.findByIdAndUpdate(agent._id, {
        password: hashedPassword,
      });

      console.log(`   ✅ Password set to: ${simplePassword}`);
    }

    console.log("\n🎉 All agent credentials set up successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("===================");

    for (const agent of agents) {
      console.log(`Agent: ${agent.fullName}`);
      console.log(`  Mobile: ${agent.mobile}`);
      console.log(`  Password: ${agent.mobile}`);
      console.log(`  Email: ${agent.email || "N/A"}`);
      console.log(`  Referral Code: ${agent.referralCode}`);
      console.log("---");
    }
  } catch (error) {
    console.error("❌ Error setting up agent credentials:", error);
  } finally {
    mongoose.connection.close();
  }
}

setupAgentCredentials();
