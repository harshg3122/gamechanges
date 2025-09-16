const axios = require("axios");

async function testAgentLogin() {
  try {
    console.log("🔍 Testing Agent Login...");

    // Test agent login with mobile number
    const response = await axios.post("http://localhost:5000/api/agent/login", {
      identifier: "2323232323",
      password: "2323232323",
    });

    console.log("✅ Agent Login Response:");
    console.log("Success:", response.data.success);
    console.log("Message:", response.data.message);
    console.log("Agent:", response.data.agent);
  } catch (error) {
    console.error("❌ Agent login failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testAgentLogin();
