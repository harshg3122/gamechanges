// Comprehensive API testing script
const axios = require("axios");

const API_BASE = "http://localhost:5000";
let adminToken = "";
let agentToken = "";

// Test configuration
const testConfig = {
  admin: { username: "admin", password: "admin123" },
  agent: { identifier: "2323232323", password: "2323232323" }, // Jane Doe
  newAgent: {
    name: "Test Agent API",
    mobile: "9999999999",
    email: "test@agent.com",
  },
  newUser: {
    username: "testuser123",
    mobileNumber: "8888888888",
    password: "testpass123",
  },
};

// Utility function for API calls
async function apiCall(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log("\n🏥 Testing Health Check...");
  const result = await apiCall("GET", "/health");

  if (result.success) {
    console.log("✅ Health check passed");
    console.log(
      "   Database:",
      result.data.database.connected ? "🟢 Connected" : "🔴 Disconnected"
    );
    console.log("   Queue items:", result.data.queue.total);
  } else {
    console.log("❌ Health check failed:", result.error);
  }

  return result.success;
}

async function testAdminLogin() {
  console.log("\n🔐 Testing Admin Login...");
  const result = await apiCall(
    "POST",
    "/api/admin-panel/login",
    testConfig.admin
  );

  if (result.success && result.data.token) {
    adminToken = result.data.token;
    console.log("✅ Admin login successful");
    console.log("   Token length:", adminToken.length);
    console.log("   User:", result.data.user.username);
  } else {
    console.log("❌ Admin login failed:", result.error);
  }

  return result.success;
}

async function testAgentLogin() {
  console.log("\n🤖 Testing Agent Login...");
  const result = await apiCall("POST", "/api/agent/login", testConfig.agent);

  if (result.success && result.data.token) {
    agentToken = result.data.token;
    console.log("✅ Agent login successful");
    console.log("   Token length:", agentToken.length);
    console.log("   Agent:", result.data.user.name);
  } else {
    console.log("❌ Agent login failed:", result.error);
  }

  return result.success;
}

async function testProtectedRouteWithoutToken() {
  console.log("\n🚫 Testing Protected Route Without Token...");
  const result = await apiCall("GET", "/api/admin-panel/agents");

  if (!result.success && result.status === 401) {
    console.log("✅ Correctly rejected request without token");
  } else {
    console.log("❌ Should have rejected request without token");
  }

  return !result.success && result.status === 401;
}

async function testProtectedRouteWithToken() {
  console.log("\n🔒 Testing Protected Route With Admin Token...");
  const result = await apiCall(
    "GET",
    "/api/admin-panel/agents",
    null,
    adminToken
  );

  if (result.success) {
    console.log("✅ Protected route accessible with valid token");
    console.log("   Agents found:", result.data.data?.length || 0);
  } else {
    console.log("❌ Protected route failed with valid token:", result.error);
  }

  return result.success;
}

async function testCreateAgent() {
  console.log("\n👥 Testing Agent Creation...");
  const result = await apiCall(
    "POST",
    "/api/admin-panel/agents",
    testConfig.newAgent,
    adminToken
  );

  if (result.success) {
    console.log("✅ Agent created successfully");
    console.log("   Name:", result.data.data.name);
    console.log("   Mobile:", result.data.data.mobile);
    console.log("   Credentials:", result.data.credentials);
  } else {
    console.log("❌ Agent creation failed:", result.error);
  }

  return result.success;
}

async function testCreateUser() {
  console.log("\n👤 Testing User Creation...");
  const result = await apiCall(
    "POST",
    "/api/admin-panel/users",
    testConfig.newUser,
    adminToken
  );

  if (result.success) {
    console.log("✅ User created successfully");
    console.log("   Username:", result.data.data.username);
    console.log("   Mobile:", result.data.data.mobileNumber);
  } else {
    console.log("❌ User creation failed:", result.error);
  }

  return result.success;
}

async function testGetCurrentRound() {
  console.log("\n🎮 Testing Current Round...");
  const result = await apiCall("GET", "/api/game/current-round");

  if (result.success) {
    console.log("✅ Current round retrieved");
    console.log("   Time slot:", result.data.data.timeSlot);
    console.log("   Status:", result.data.data.status);
    console.log("   Round ID:", result.data.data._id);
  } else {
    console.log("❌ Current round failed:", result.error);
  }

  return result.success;
}

async function testGetLockedDigits() {
  console.log("\n🔢 Testing Locked Digits Info...");
  const result = await apiCall("GET", "/api/results/locked-digits");

  if (result.success) {
    console.log("✅ Locked digits retrieved");
    console.log("   Locked digits:", result.data.data.locked);
    console.log("   Unlocked digits:", result.data.data.unlocked);
    console.log("   Lock percentage:", result.data.data.lockPercent + "%");
  } else {
    console.log("❌ Locked digits failed:", result.error);
  }

  return result.success;
}

async function testResultDeclarationWithLockedDigits() {
  console.log("\n🚨 Testing Result Declaration with Locked Digits...");

  // Try to declare result with locked digits (9,8,7,6,5)
  const lockedTriple = "987"; // Contains locked digits
  const result = await apiCall(
    "POST",
    "/api/results/declare",
    { winning: lockedTriple },
    adminToken
  );

  if (!result.success && result.status === 400) {
    console.log("✅ Correctly rejected locked digits");
    console.log("   Error message:", result.error.error);
  } else {
    console.log("❌ Should have rejected locked digits");
  }

  return !result.success && result.status === 400;
}

async function testResultDeclarationWithAllowedDigits() {
  console.log("\n✅ Testing Result Declaration with Allowed Digits...");

  // Try to declare result with allowed digits (0,1,2,3,4)
  const allowedTriple = "123"; // Contains only unlocked digits
  const result = await apiCall(
    "POST",
    "/api/results/declare",
    { winning: allowedTriple },
    adminToken
  );

  if (result.success) {
    console.log("✅ Successfully declared result with allowed digits");
    console.log("   Triple digit:", result.data.result.tripleDigitNumber);
    console.log("   Single digit:", result.data.result.singleDigitResult);
    console.log("   Round status:", result.data.round.status);
  } else {
    console.log("❌ Failed to declare allowed result:", result.error);
  }

  return result.success;
}

async function testViewResult() {
  console.log("\n👁️  Testing View Result...");
  const result = await apiCall("GET", "/api/results/view");

  if (result.success) {
    console.log("✅ Result viewed successfully");
    if (result.data.result) {
      console.log("   Triple digit:", result.data.result.tripleDigitNumber);
      console.log("   Single digit:", result.data.result.singleDigitResult);
      console.log("   Auto-declared:", result.data.autoDeclared);
    } else {
      console.log("   No result declared yet");
    }
  } else {
    console.log("❌ View result failed:", result.error);
  }

  return result.success;
}

async function testAgentDashboard() {
  console.log("\n📊 Testing Agent Dashboard...");
  const result = await apiCall("GET", "/api/agent/dashboard", null, agentToken);

  if (result.success) {
    console.log("✅ Agent dashboard accessible");
    console.log("   Agent name:", result.data.data.agent.name);
    console.log("   User count:", result.data.data.userCount);
    console.log("   Referral code:", result.data.data.referralCode);
  } else {
    console.log("❌ Agent dashboard failed:", result.error);
  }

  return result.success;
}

async function testResultTables() {
  console.log("\n📋 Testing Result Tables...");
  const result = await apiCall("GET", "/api/results/tables");

  if (result.success) {
    console.log("✅ Result tables generated");
    console.log("   Single digits:", result.data.data.singleDigitTable.length);
    console.log("   Triple digits:", result.data.data.tripleDigitTable.length);
    console.log(
      "   Locked triples:",
      result.data.data.statistics.lockedTripleDigitEntries
    );
  } else {
    console.log("❌ Result tables failed:", result.error);
  }

  return result.success;
}

// Main test runner
async function runAllTests() {
  console.log("🧪 Starting Production API Tests");
  console.log("==================================");

  const tests = [
    { name: "Health Check", fn: testHealthCheck },
    { name: "Admin Login", fn: testAdminLogin },
    { name: "Agent Login", fn: testAgentLogin },
    {
      name: "Protected Route Without Token",
      fn: testProtectedRouteWithoutToken,
    },
    { name: "Protected Route With Token", fn: testProtectedRouteWithToken },
    { name: "Create Agent", fn: testCreateAgent },
    { name: "Create User", fn: testCreateUser },
    { name: "Get Current Round", fn: testGetCurrentRound },
    { name: "Get Locked Digits", fn: testGetLockedDigits },
    {
      name: "Result Declaration (Locked)",
      fn: testResultDeclarationWithLockedDigits,
    },
    {
      name: "Result Declaration (Allowed)",
      fn: testResultDeclarationWithAllowedDigits,
    },
    { name: "View Result", fn: testViewResult },
    { name: "Agent Dashboard", fn: testAgentDashboard },
    { name: "Result Tables", fn: testResultTables },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ name: test.name, success });
    } catch (error) {
      console.log(`❌ Test '${test.name}' threw error:`, error.message);
      results.push({ name: test.name, success: false });
    }
  }

  // Summary
  console.log("\n📊 Test Summary");
  console.log("================");

  const passed = results.filter((r) => r.success).length;
  const total = results.length;

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    console.log(`${status} ${result.name}`);
  });

  console.log(
    `\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(
      (passed / total) * 100
    )}%)`
  );

  if (passed === total) {
    console.log("🎉 All tests passed! Production server is ready.");
  } else {
    console.log("⚠️  Some tests failed. Check the logs above.");
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
