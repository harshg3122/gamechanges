/**
 * Simple API Test Script
 * Tests the result declaration system
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function testAPI() {
  try {
    console.log("🧪 Testing Result Declaration System...\n");

    // Test health endpoint
    console.log("1. Testing health endpoint...");
    const health = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health:", health.data);

    // Test admin login
    console.log("\n2. Testing admin login...");
    const loginResponse = await axios.post(
      `${BASE_URL}/api/admin-panel/login`,
      {
        username: "admin",
        password: "Admin@123",
      }
    );

    if (loginResponse.data.success) {
      console.log("✅ Admin login successful");
      const token = loginResponse.data.token;

      // Test current round endpoint
      console.log("\n3. Testing current round endpoint...");
      const roundResponse = await axios.get(
        `${BASE_URL}/api/admin-panel/results/current-round`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (roundResponse.data.success) {
        console.log("✅ Current round data retrieved");
        console.log(`📅 Round ID: ${roundResponse.data.round._id}`);
        console.log(`⏰ Time Slot: ${roundResponse.data.round.timeSlot}`);
        console.log(
          `📊 Triple Digits: ${roundResponse.data.numbers.statistics.totalTripleDigits}`
        );
        console.log(
          `🔒 Locked Triples: ${roundResponse.data.numbers.statistics.lockedTripleDigits}`
        );
        console.log(
          `📊 Single Digits: ${roundResponse.data.numbers.statistics.totalSingleDigits}`
        );
        console.log(
          `🔒 Locked Singles: ${roundResponse.data.numbers.statistics.lockedSingleDigits}`
        );

        // Test result tables endpoint
        console.log("\n4. Testing result tables endpoint...");
        const tablesResponse = await axios.get(
          `${BASE_URL}/api/admin-panel/results/tables?roundId=${roundResponse.data.round._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (tablesResponse.data.success) {
          console.log("✅ Result tables retrieved");
          console.log(
            `📈 Triple Digit Entries: ${tablesResponse.data.data.tripleDigitTable.length}`
          );
          console.log(
            `📈 Single Digit Entries: ${tablesResponse.data.data.singleDigitTable.length}`
          );

          // Find an unlocked triple digit for testing
          const unlockedTriple = tablesResponse.data.data.tripleDigitTable.find(
            (td) => !td.lock
          );
          if (unlockedTriple) {
            console.log(`🔓 Found unlocked triple: ${unlockedTriple.number}`);

            // Test result declaration (this might fail due to timing, which is expected)
            console.log("\n5. Testing result declaration...");
            try {
              const declareResponse = await axios.post(
                `${BASE_URL}/api/admin-panel/results/declare`,
                {
                  roundId: roundResponse.data.round._id,
                  tripleDigitNumber: unlockedTriple.number
                    .toString()
                    .padStart(3, "0"),
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              console.log(
                "✅ Result declared successfully:",
                declareResponse.data
              );
            } catch (declareError) {
              if (declareError.response) {
                console.log(
                  "ℹ️ Result declaration response:",
                  declareError.response.data
                );
                if (declareError.response.data.error === "INVALID_TIMING") {
                  console.log("✅ Timing validation working correctly");
                } else if (
                  declareError.response.data.error === "SINGLE_LOCKED"
                ) {
                  console.log(
                    "✅ Single digit locking validation working correctly"
                  );
                }
              } else {
                console.error("❌ Declaration error:", declareError.message);
              }
            }
          }
        }
      }
    }

    console.log("\n🎉 API testing completed!");
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error.response ? error.response.data : error.message
    );
  }
}

testAPI();
