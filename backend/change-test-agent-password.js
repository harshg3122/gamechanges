const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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

async function changeTestAgentPassword() {
  try {
    console.log('🔄 Changing Test Agent password to "test123"...');

    // Find the Test Agent
    const testAgent = await Agent.findOne({ fullName: "Test Agent" });

    if (!testAgent) {
      console.log("❌ Test Agent not found");
      return;
    }

    console.log("📋 Found Test Agent:", {
      id: testAgent._id,
      fullName: testAgent.fullName,
      mobile: testAgent.mobile,
      referralCode: testAgent.referralCode,
    });

    // Hash the new password
    const newPassword = "test123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    testAgent.password = hashedPassword;
    await testAgent.save();

    console.log("✅ Test Agent password changed successfully!");
    console.log("🔑 New password: test123");
    console.log("📱 Mobile: 1234567890");
    console.log("🔗 Referral Code:", testAgent.referralCode);
  } catch (error) {
    console.error("❌ Error changing password:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

changeTestAgentPassword();
