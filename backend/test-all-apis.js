const axios = require("axios");

const BASE_URL = "http://localhost:3001/api/admin-panel";

async function testAllAPIs() {
  console.log("🧪 Testing ALL API endpoints...\n");

  try {
    // Test 1: Health check
    console.log("1️⃣ Testing Health Check");
    const healthResponse = await axios.get("http://localhost:3001/health");
    console.log("✅ Health Check:", healthResponse.data.message);

    // Test 2: Get agents
    console.log("\n2️⃣ Testing GET /agents");
    const getResponse = await axios.get(`${BASE_URL}/agents`);
    console.log(
      "✅ GET /agents:",
      getResponse.data.success ? "SUCCESS" : "FAILED"
    );
    console.log("   Agents count:", getResponse.data.data?.agents?.length || 0);

    // Get first agent ID for testing
    const agents = getResponse.data.data?.agents || [];
    if (agents.length > 0) {
      const testAgentId = agents[0]._id;
      console.log("   Using agent ID for tests:", testAgentId);

      // Test 3: Update agent
      console.log("\n3️⃣ Testing PUT /agents/:id");
      try {
        const updateResponse = await axios.put(
          `${BASE_URL}/agents/${testAgentId}`,
          {
            fullName: "Updated Test Agent",
            mobile: agents[0].mobile,
            commissionRate: 10,
            isActive: true,
          }
        );
        console.log(
          "✅ PUT /agents/:id:",
          updateResponse.data.success ? "SUCCESS" : "FAILED"
        );
        console.log("   Message:", updateResponse.data.message);
      } catch (error) {
        console.log(
          "❌ PUT /agents/:id:",
          error.response?.status,
          error.message
        );
      }

      // Test 4: Change password
      console.log("\n4️⃣ Testing POST /agents/:id/change-password");
      try {
        const passwordResponse = await axios.post(
          `${BASE_URL}/agents/${testAgentId}/change-password`,
          {
            newPassword: "newpassword123",
          }
        );
        console.log(
          "✅ POST /agents/:id/change-password:",
          passwordResponse.data.success ? "SUCCESS" : "FAILED"
        );
        console.log("   Message:", passwordResponse.data.message);
      } catch (error) {
        console.log(
          "❌ POST /agents/:id/change-password:",
          error.response?.status,
          error.message
        );
      }

      // Test 5: Create a new agent for deletion test
      console.log("\n5️⃣ Testing POST /agents (for deletion test)");
      try {
        const createResponse = await axios.post(`${BASE_URL}/agents`, {
          fullName: "Delete Test Agent",
          mobile: "8888888888",
          password: "testpass123",
          referralCode: "DEL12345",
        });
        console.log(
          "✅ POST /agents:",
          createResponse.data.success ? "SUCCESS" : "FAILED"
        );
        const newAgentId = createResponse.data.data?.agent?._id;

        if (newAgentId) {
          // Test 6: Delete agent
          console.log("\n6️⃣ Testing DELETE /agents/:id");
          try {
            const deleteResponse = await axios.delete(
              `${BASE_URL}/agents/${newAgentId}`
            );
            console.log(
              "✅ DELETE /agents/:id:",
              deleteResponse.data.success ? "SUCCESS" : "FAILED"
            );
            console.log("   Message:", deleteResponse.data.message);
          } catch (error) {
            console.log(
              "❌ DELETE /agents/:id:",
              error.response?.status,
              error.message
            );
          }
        }
      } catch (error) {
        console.log("❌ POST /agents:", error.response?.status, error.message);
      }
    }

    console.log("\n🎉 All API tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.log("💡 Make sure the server is running on port 3001");
    }
  }
}

testAllAPIs();
