const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const API_BASE = 'http://localhost:5000/api/admin-panel';
let authToken = '';

// Test data
const testAdmin = {
  email: '963sohamraut@gmail.com',
  password: 'admin123'
};

const testUser = {
  username: 'testuser123',
  email: 'testuser@example.com',
  mobileNumber: '1234567890',
  password: 'password123'
};

const testAgent = {
  name: 'Test Agent',
  email: 'agent@test.com',
  phoneNumber: '9876543210',
  referralCode: 'TESTAGENT',
  commissionRate: 10
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
const testAdminLogin = async () => {
  console.log('\n🔐 Testing Admin Login...');
  const result = await makeRequest('POST', '/login', testAdmin);
  
  if (result.success && result.data.data?.token) {
    authToken = result.data.data.token;
    console.log('✅ Admin login successful');
    console.log(`Token: ${authToken.substring(0, 20)}...`);
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
  return true;
};

const testDashboard = async () => {
  console.log('\n📊 Testing Dashboard...');
  const result = await makeRequest('GET', '/dashboard');
  
  if (result.success) {
    console.log('✅ Dashboard data retrieved');
    console.log('Stats:', result.data.data);
  } else {
    console.log('❌ Dashboard test failed:', result.error);
  }
};

const testUserManagement = async () => {
  console.log('\n👥 Testing User Management...');
  
  // Get all users
  let result = await makeRequest('GET', '/users');
  if (result.success) {
    console.log('✅ Get users successful');
    console.log(`Found ${result.data.data.users.length} users`);
  } else {
    console.log('❌ Get users failed:', result.error);
  }

  // Create user
  result = await makeRequest('POST', '/users', testUser);
  if (result.success) {
    console.log('✅ Create user successful');
    const userId = result.data.data.user._id;
    
    // Update user
    result = await makeRequest('PUT', `/users/${userId}`, {
      username: 'updateduser123'
    });
    
    if (result.success) {
      console.log('✅ Update user successful');
    } else {
      console.log('❌ Update user failed:', result.error);
    }
    
    // Toggle user status
    result = await makeRequest('PATCH', `/users/${userId}/toggle-status`);
    if (result.success) {
      console.log('✅ Toggle user status successful');
    } else {
      console.log('❌ Toggle user status failed:', result.error);
    }
    
  } else {
    console.log('❌ Create user failed:', result.error);
  }
};

const testRoundManagement = async () => {
  console.log('\n🎯 Testing Round Management...');
  
  // Initialize daily rounds
  let result = await makeRequest('POST', '/rounds/initialize-daily');
  if (result.success) {
    console.log('✅ Initialize daily rounds successful');
  } else {
    console.log('❌ Initialize daily rounds failed:', result.error);
  }

  // Get current round
  result = await makeRequest('GET', '/rounds/current');
  if (result.success) {
    console.log('✅ Get current round successful');
    const currentRound = result.data.data.round;
    
    if (currentRound) {
      console.log(`Current round: ${currentRound.roundNumber} (${currentRound.status})`);
      
      // Get round details
      result = await makeRequest('GET', `/rounds/${currentRound._id}`);
      if (result.success) {
        console.log('✅ Get round details successful');
      } else {
        console.log('❌ Get round details failed:', result.error);
      }
      
      // Get least bet numbers
      result = await makeRequest('GET', `/rounds/${currentRound._id}/least-bet-numbers`);
      if (result.success) {
        console.log('✅ Get least bet numbers successful');
        console.log('Least bet numbers:', result.data.data.leastBetNumbers);
      } else {
        console.log('❌ Get least bet numbers failed:', result.error);
      }
    }
  } else {
    console.log('❌ Get current round failed:', result.error);
  }

  // Get all rounds
  result = await makeRequest('GET', '/rounds');
  if (result.success) {
    console.log('✅ Get all rounds successful');
    console.log(`Found ${result.data.data.rounds.length} rounds`);
  } else {
    console.log('❌ Get all rounds failed:', result.error);
  }
};

const testAgentManagement = async () => {
  console.log('\n🤝 Testing Agent Management...');
  
  // Generate referral code
  let result = await makeRequest('GET', '/agents/generate-referral-code');
  if (result.success) {
    console.log('✅ Generate referral code successful');
    console.log('Generated code:', result.data.data.referralCode);
  } else {
    console.log('❌ Generate referral code failed:', result.error);
  }

  // Create agent
  result = await makeRequest('POST', '/agents', testAgent);
  if (result.success) {
    console.log('✅ Create agent successful');
    const agentId = result.data.data.agent._id;
    
    // Get agent details
    result = await makeRequest('GET', `/agents/${agentId}`);
    if (result.success) {
      console.log('✅ Get agent details successful');
      console.log('Agent stats:', result.data.data.statistics);
    } else {
      console.log('❌ Get agent details failed:', result.error);
    }
    
    // Update agent
    result = await makeRequest('PUT', `/agents/${agentId}`, {
      commissionRate: 15
    });
    if (result.success) {
      console.log('✅ Update agent successful');
    } else {
      console.log('❌ Update agent failed:', result.error);
    }
    
    // Toggle agent status
    result = await makeRequest('PATCH', `/agents/${agentId}/toggle-status`);
    if (result.success) {
      console.log('✅ Toggle agent status successful');
    } else {
      console.log('❌ Toggle agent status failed:', result.error);
    }
    
  } else {
    console.log('❌ Create agent failed:', result.error);
  }

  // Get all agents
  result = await makeRequest('GET', '/agents');
  if (result.success) {
    console.log('✅ Get all agents successful');
    console.log(`Found ${result.data.data.agents.length} agents`);
  } else {
    console.log('❌ Get all agents failed:', result.error);
  }
};

const testQRCodeManagement = async () => {
  console.log('\n📱 Testing QR Code Management...');
  
  // Get QR code statistics
  let result = await makeRequest('GET', '/qr-codes/statistics');
  if (result.success) {
    console.log('✅ Get QR code statistics successful');
    console.log('QR Stats:', result.data.data);
  } else {
    console.log('❌ Get QR code statistics failed:', result.error);
  }

  // Get all QR codes
  result = await makeRequest('GET', '/qr-codes');
  if (result.success) {
    console.log('✅ Get all QR codes successful');
    console.log(`Found ${result.data.data.qrCodes.length} QR codes`);
  } else {
    console.log('❌ Get all QR codes failed:', result.error);
  }

  // Get active QR codes (public endpoint)
  result = await makeRequest('GET', '/qr-codes/active');
  if (result.success) {
    console.log('✅ Get active QR codes successful');
    console.log(`Found ${result.data.data.qrCodes.length} active QR codes`);
  } else {
    console.log('❌ Get active QR codes failed:', result.error);
  }
};

const testWalletRequests = async () => {
  console.log('\n💰 Testing Wallet Requests...');
  
  // Get wallet requests
  const result = await makeRequest('GET', '/wallet-requests');
  if (result.success) {
    console.log('✅ Get wallet requests successful');
    console.log(`Found ${result.data.data.requests.length} wallet requests`);
  } else {
    console.log('❌ Get wallet requests failed:', result.error);
  }
};

const testSettings = async () => {
  console.log('\n⚙️ Testing Settings...');
  
  // Get app settings
  let result = await makeRequest('GET', '/settings');
  if (result.success) {
    console.log('✅ Get app settings successful');
    console.log('Settings:', result.data.data);
  } else {
    console.log('❌ Get app settings failed:', result.error);
  }

  // Update app settings
  result = await makeRequest('PUT', '/settings', {
    minBetAmount: 10,
    maxBetAmount: 10000,
    bettingEnabled: true
  });
  if (result.success) {
    console.log('✅ Update app settings successful');
  } else {
    console.log('❌ Update app settings failed:', result.error);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Admin Panel API Tests...');
  console.log('=====================================');

  try {
    // Authentication test (required first)
    const loginSuccess = await testAdminLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without valid authentication');
      return;
    }

    // Run all tests
    await testDashboard();
    await testUserManagement();
    await testRoundManagement();
    await testAgentManagement();
    await testQRCodeManagement();
    await testWalletRequests();
    await testSettings();

    console.log('\n🎉 All tests completed!');
    console.log('=====================================');

  } catch (error) {
    console.error('\n💥 Test runner error:', error.message);
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const testName = args[0];
  
  const testMap = {
    'login': testAdminLogin,
    'dashboard': testDashboard,
    'users': testUserManagement,
    'rounds': testRoundManagement,
    'agents': testAgentManagement,
    'qr': testQRCodeManagement,
    'wallet': testWalletRequests,
    'settings': testSettings
  };

  if (testMap[testName]) {
    console.log(`🎯 Running specific test: ${testName}`);
    testAdminLogin().then(success => {
      if (success) {
        testMap[testName]();
      }
    });
  } else {
    console.log('Available tests:', Object.keys(testMap).join(', '));
  }
} else {
  // Run all tests
  runTests();
}

module.exports = {
  runTests,
  testAdminLogin,
  testDashboard,
  testUserManagement,
  testRoundManagement,
  testAgentManagement,
  testQRCodeManagement,
  testWalletRequests,
  testSettings
};
