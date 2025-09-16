const mongoose = require("mongoose");

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

async function checkAgents() {
  try {
    console.log("🔍 Checking agents in database...");

    const agents = await Agent.find();
    console.log(`\nFound ${agents.length} agents:`);

    agents.forEach((agent, index) => {
      console.log(`\n${index + 1}. ${agent.fullName}`);
      console.log(`   Mobile: ${agent.mobile}`);
      console.log(`   Email: ${agent.email || "N/A"}`);
      console.log(`   Referral Code: ${agent.referralCode}`);
      console.log(`   Active: ${agent.isActive}`);
      console.log(`   Password Hash: ${agent.password.substring(0, 20)}...`);
    });
  } catch (error) {
    console.error("❌ Error checking agents:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkAgents();
