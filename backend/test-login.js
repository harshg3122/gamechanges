// Simple login test
const axios = require("axios");

console.log("Starting login test...");

async function testLogin() {
  try {
    console.log("Testing admin login...");
    console.log(
      "Making request to: http://localhost:5000/api/admin-panel/login"
    );

    const response = await axios.post(
      "http://localhost:5000/api/admin-panel/login",
      {
        username: "admin",
        password: "admin123",
      }
    );

    console.log("Response received!");

    console.log("✅ LOGIN SUCCESS!");
    console.log("Response:", response.data);

    if (response.data.token) {
      console.log(
        "✅ Token received:",
        response.data.token.substring(0, 20) + "..."
      );
    }
  } catch (error) {
    console.log("❌ LOGIN FAILED!");
    console.log("Error:", error.response?.data || error.message);
    console.log("Full error:", error);
  }
}

testLogin();
