const axios = require("axios");

const BASE_URL = "http://localhost:3001/api/admin-panel";

async function testAPIs() {
  try {
    console.log("🧪 Testing API endpoints...\n");

    // Test 1: Get agents
    console.log("1️⃣ Testing GET /agents");
    try {
      const getResponse = await axios.get(`${BASE_URL}/agents`);
      console.log(
        "✅ GET /agents:",
        getResponse.data.success ? "SUCCESS" : "FAILED"
      );
      console.log(
        "   Agents count:",
        getResponse.data.data?.agents?.length || 0
      );
    } catch (error) {
      console.log("❌ GET /agents:", error.response?.status, error.message);
    }

    // Test 2: Create agent
    console.log("\n2️⃣ Testing POST /agents");
    try {
      const createResponse = await axios.post(`${BASE_URL}/agents`, {
        fullName: "Test API Agent",
        mobile: "9999999999",
        password: "testpass123",
        referralCode: "TEST1234",
      });
      console.log(
        "✅ POST /agents:",
        createResponse.data.success ? "SUCCESS" : "FAILED"
      );
      const agentId = createResponse.data.data?.agent?._id;
      console.log("   Created agent ID:", agentId);

      if (agentId) {
        // Test 3: Update agent
        console.log("\n3️⃣ Testing PUT /agents/:id");
        try {
          const updateResponse = await axios.put(
            `${BASE_URL}/agents/${agentId}`,
            {
              fullName: "Updated Test Agent",
              mobile: "9999999999",
              commissionRate: 10,
              isActive: true,
            }
          );
          console.log(
            "✅ PUT /agents/:id:",
            updateResponse.data.success ? "SUCCESS" : "FAILED"
          );
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
            `${BASE_URL}/agents/${agentId}/change-password`,
            {
              newPassword: "newpassword123",
            }
          );
          console.log(
            "✅ POST /agents/:id/change-password:",
            passwordResponse.data.success ? "SUCCESS" : "FAILED"
          );
        } catch (error) {
          console.log(
            "❌ POST /agents/:id/change-password:",
            error.response?.status,
            error.message
          );
        }

        // Test 5: Delete agent
        console.log("\n5️⃣ Testing DELETE /agents/:id");
        try {
          const deleteResponse = await axios.delete(
            `${BASE_URL}/agents/${agentId}`
          );
          console.log(
            "✅ DELETE /agents/:id:",
            deleteResponse.data.success ? "SUCCESS" : "FAILED"
          );
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

    console.log("\n🎉 API testing completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAPIs();
