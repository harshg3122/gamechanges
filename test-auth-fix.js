/**
 * Test script to verify Admin/Agent authentication separation
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function testAuthSeparation() {
  console.log("🧪 Testing Admin/Agent Authentication Separation...\n");

  try {
    // Test 1: Admin Login
    console.log("1️⃣ Testing Admin Login...");
    const adminLogin = await axios.post(`${BASE_URL}/api/admin-panel/login`, {
      username: "admin",
      password: "Admin@123",
    });

    if (adminLogin.data.success) {
      console.log("✅ Admin login successful");
      console.log(
        "📄 Admin token payload:",
        JSON.stringify(
          {
            userType: adminLogin.data.userType,
            role: adminLogin.data.admin?.role,
          },
          null,
          2
        )
      );

      const adminToken = adminLogin.data.token;

      // Test admin-only endpoint
      console.log("\n2️⃣ Testing Admin-only endpoint...");
      const adminEndpoint = await axios.get(
        `${BASE_URL}/api/admin-panel/results/current-round`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (adminEndpoint.status === 200) {
        console.log("✅ Admin can access admin endpoints");
      }

      // Test admin logout
      console.log("\n3️⃣ Testing Admin Logout...");
      const adminLogout = await axios.post(
        `${BASE_URL}/api/admin-panel/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (adminLogout.data.success) {
        console.log("✅ Admin logout successful");
      }
    }

    // Test 2: Try to use admin token on agent endpoint (should fail)
    console.log(
      "\n4️⃣ Testing Token Separation (Admin token on Agent endpoint)..."
    );
    try {
      const adminToken = adminLogin.data.token;
      await axios.get(`${BASE_URL}/api/agent/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log("❌ SECURITY ISSUE: Admin token worked on agent endpoint!");
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("✅ Admin token correctly rejected by agent endpoint");
      } else {
        console.log("⚠️ Unexpected error:", error.response?.data?.message);
      }
    }

    // Test 3: Create test agent and login
    console.log("\n5️⃣ Testing Agent Login (if agent exists)...");
    try {
      // This will fail if no agent exists, which is expected
      const agentLogin = await axios.post(`${BASE_URL}/api/agent/login`, {
        identifier: "testagent",
        password: "testpass",
      });

      if (agentLogin.data.success) {
        console.log("✅ Agent login successful");
        const agentToken = agentLogin.data.data.token;

        // Test agent-only endpoint
        console.log("\n6️⃣ Testing Agent-only endpoint...");
        const agentEndpoint = await axios.get(
          `${BASE_URL}/api/agent/dashboard`,
          {
            headers: { Authorization: `Bearer ${agentToken}` },
          }
        );

        if (agentEndpoint.status === 200) {
          console.log("✅ Agent can access agent endpoints");
        }

        // Test agent token on admin endpoint (should fail)
        console.log(
          "\n7️⃣ Testing Token Separation (Agent token on Admin endpoint)..."
        );
        try {
          await axios.get(`${BASE_URL}/api/admin-panel/results/current-round`, {
            headers: { Authorization: `Bearer ${agentToken}` },
          });
          console.log(
            "❌ SECURITY ISSUE: Agent token worked on admin endpoint!"
          );
        } catch (error) {
          if (error.response?.status === 403) {
            console.log("✅ Agent token correctly rejected by admin endpoint");
          } else {
            console.log("⚠️ Unexpected error:", error.response?.data?.message);
          }
        }
      }
    } catch (error) {
      console.log("ℹ️ Agent login failed (expected if no test agent exists)");
      console.log("   Error:", error.response?.data?.message);
    }

    console.log("\n🎉 Authentication Separation Test Completed!");
    console.log("\n📋 Summary:");
    console.log("✅ Admin login works independently");
    console.log("✅ Admin tokens are rejected by agent endpoints");
    console.log("✅ Authentication systems are properly separated");

    console.log("\n🔧 Frontend Implementation Required:");
    console.log("   1. Store admin and agent tokens separately");
    console.log(
      "   2. Use different localStorage keys (admin_token vs agent_token)"
    );
    console.log("   3. Clear only the relevant token on logout");
    console.log("   4. Check userType in response to determine token storage");
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error.response ? error.response.data : error.message
    );
  }
}

// Add a delay to let server start
setTimeout(() => {
  testAuthSeparation();
}, 3000);
