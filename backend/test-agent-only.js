const axios = require("axios");

async function testAgentCreation() {
  try {
    console.log("🔍 Testing agent creation...");

    const response = await axios.post(
      "http://localhost:5000/api/admin-panel/agents",
      {
        fullName: "Test Agent Harsh",
        mobile: "1234567890",
        email: "harsh@gmail.com",
        password: "testpass123",
      }
    );

    console.log("✅ Agent creation successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Agent creation failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testAgentCreation();
