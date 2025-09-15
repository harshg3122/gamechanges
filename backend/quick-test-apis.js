const axios = require("axios");

async function testAPIs() {
  const baseURL = "http://localhost:5000/api/admin-panel";

  try {
    console.log("🔍 Testing Health Check...");
    const health = await axios.get("http://localhost:5000/health");
    console.log("✅ Health:", health.data);
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    return;
  }

  try {
    console.log("\n🔍 Testing Get Users...");
    const users = await axios.get(`${baseURL}/users`);
    console.log("✅ Users fetched:", users.data.data.users.length, "users");
  } catch (error) {
    console.error(
      "❌ Get users failed:",
      error.response?.data || error.message
    );
  }

  try {
    console.log("\n🔍 Testing Get Agents...");
    const agents = await axios.get(`${baseURL}/agents`);
    console.log("✅ Agents fetched:", agents.data.data.length, "agents");
  } catch (error) {
    console.error(
      "❌ Get agents failed:",
      error.response?.data || error.message
    );
  }

  try {
    console.log("\n🔍 Testing Create User (no mobile)...");
    const userResponse = await axios.post(`${baseURL}/users`, {
      username: "testuser" + Date.now(),
      email: "test@example.com",
      mobileNumber: "", // Empty mobile number
      password: "test123",
    });
    console.log("✅ User created:", userResponse.data.message);
  } catch (error) {
    console.error(
      "❌ Create user failed:",
      error.response?.data || error.message
    );
  }

  try {
    console.log("\n🔍 Testing Create Agent...");
    const agentResponse = await axios.post(`${baseURL}/agents`, {
      fullName: "Test Agent " + Date.now(),
      mobile:
        "98" +
        Math.floor(Math.random() * 100000000)
          .toString()
          .padStart(8, "0"),
      email: `agent${Date.now()}@test.com`,
      password: "agent123",
    });
    console.log("✅ Agent created:", agentResponse.data.message);
    console.log("Referral Code:", agentResponse.data.data.agent.referralCode);
  } catch (error) {
    console.error(
      "❌ Create agent failed:",
      error.response?.data || error.message
    );
  }
}

testAPIs();
