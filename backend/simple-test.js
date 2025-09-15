const axios = require("axios");

async function testServer() {
  try {
    console.log("Testing server...");
    const response = await axios.get("http://localhost:3001/health");
    console.log("✅ Server is running:", response.data);
  } catch (error) {
    console.log("❌ Server not responding:", error.message);
  }
}

testServer();
