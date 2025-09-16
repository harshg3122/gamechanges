const axios = require("axios");

async function testAgentFetch() {
  try {
    console.log("🔍 Testing Agent Fetch API...");

    const response = await axios.get(
      "http://localhost:5000/api/admin-panel/agents"
    );

    console.log("✅ Agent API Response:");
    console.log("Status:", response.status);
    console.log("Success:", response.data.success);
    console.log("Data structure:", Object.keys(response.data));

    if (response.data.data) {
      console.log("Number of agents:", response.data.data.length);
      console.log("First agent:", response.data.data[0]);
    } else {
      console.log("No data field in response");
    }
  } catch (error) {
    console.error("❌ Agent fetch failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testAgentFetch();
