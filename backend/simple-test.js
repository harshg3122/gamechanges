const axios = require("axios");

async function testServer() {
  try {
    console.log("🔍 Testing server health...");
    const response = await axios.get("http://localhost:5000/health");
    console.log("✅ Server is healthy:", response.data);
  } catch (error) {
    console.error("❌ Server health check failed:", error.message);
  }

  try {
    console.log("\n🔍 Testing agents endpoint...");
    const response = await axios.get(
      "http://localhost:5000/api/admin-panel/agents"
    );
    console.log("✅ Agents fetch successful:", response.data);
  } catch (error) {
    console.error("❌ Agents fetch failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testServer();
