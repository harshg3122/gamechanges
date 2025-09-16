const axios = require("axios");

async function testAgentLogin() {
  try {
    console.log("🔍 Testing Agent Login API...");

    // Test with different identifiers
    const testCases = [
      { identifier: "2323232323", password: "2323232323" }, // Mobile as password
      { identifier: "Jane Doe", password: "2323232323" }, // Full name
      { identifier: "admin", password: "admin123" }, // Admin (should fail)
    ];

    for (const testCase of testCases) {
      console.log(
        `\n🧪 Testing: ${testCase.identifier} / ${testCase.password}`
      );

      try {
        const response = await axios.post(
          "http://localhost:5000/api/agent/login",
          testCase
        );
        console.log("✅ Success:", response.data.message);
        console.log("   Agent:", response.data.agent?.fullName);
        console.log("   Role:", response.data.agent?.role);
      } catch (error) {
        console.log(
          "❌ Failed:",
          error.response?.data?.message || error.message
        );
      }
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testAgentLogin();
