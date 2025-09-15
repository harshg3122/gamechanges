const mongoose = require("mongoose");
const Agent = require("./backend/models/Agent");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/numbergame", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Generate referral code
const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

async function testAgentCreation() {
  try {
    console.log("🧪 Testing Agent Creation...");

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = generateReferralCode();
      const existingAgent = await Agent.findOne({ referralCode });
      if (!existingAgent) {
        isUnique = true;
      }
    }

    // Create test agent
    const agent = new Agent({
      fullName: "Test Agent",
      mobile: "1234567890",
      password: "testpass123",
      referralCode,
      isActive: true,
      commissionRate: 5,
    });

    await agent.save();

    console.log("✅ Agent created successfully!");
    console.log("📋 Agent Details:");
    console.log(`   ID: ${agent._id}`);
    console.log(`   Name: ${agent.fullName}`);
    console.log(`   Mobile: ${agent.mobile}`);
    console.log(`   Referral Code: ${agent.referralCode}`);
    console.log(`   Status: ${agent.isActive ? "Active" : "Inactive"}`);
    console.log(`   Commission: ${agent.commissionRate}%`);

    // Verify in database
    const savedAgent = await Agent.findById(agent._id);
    if (savedAgent) {
      console.log("✅ Agent successfully stored in MongoDB!");
    }

    // Count total agents
    const totalAgents = await Agent.countDocuments();
    console.log(`📊 Total agents in database: ${totalAgents}`);
  } catch (error) {
    console.error("❌ Error creating agent:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

testAgentCreation();
