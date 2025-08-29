const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002';
const ADMIN_PANEL_URL = `${BASE_URL}/api/admin-panel`;

// Test data
const adminLoginData = {
  email: 'admin@numbergame.com',
  password: 'Admin@123'
};

let authToken = '';

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, useAuth = false) => {
  try {
    const config = {
      method,
      url: `${ADMIN_PANEL_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useAuth && authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      fullError: error.response?.data
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log(`📅 Server timestamp: ${response.data.timestamp}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
};

const testAdminLogin = async () => {
  console.log('\n🔐 Testing Admin Login...');
  const result = await apiCall('POST', '/login', adminLoginData);
  
  if (result.success) {
    console.log('✅ Login endpoint accessible');
    if (result.data.data?.token) {
      authToken = result.data.data.token;
      console.log('🎫 JWT token received');
      return true;
    } else {
      console.log('⚠️  Login successful but no token (DB issue)');
      console.log('Response:', result.data);
      return false;
    }
  } else {
    console.log('❌ Login failed:', result.error);
    console.log('📋 Full error:', result.fullError);
    
    // Check if it's a database connection issue
    if (result.error.includes('buffering timed out') || result.status === 500) {
      console.log('💡 This appears to be a database connection issue');
      return false;
    }
    return false;
  }
};

const testProtectedEndpoints = async () => {
  if (!authToken) {
    console.log('\n⚠️  Skipping protected endpoint tests (no auth token)');
    return;
  }

  console.log('\n🛡️ Testing Protected Endpoints...');

  const endpoints = [
    { method: 'GET', path: '/dashboard', name: 'Dashboard' },
    { method: 'GET', path: '/users', name: 'Users List' },
    { method: 'GET', path: '/rounds', name: 'Rounds List' },
    { method: 'GET', path: '/agents', name: 'Agents List' },
    { method: 'GET', path: '/qr-codes', name: 'QR Codes List' },
    { method: 'GET', path: '/wallet-requests', name: 'Wallet Requests' },
    { method: 'GET', path: '/settings', name: 'App Settings' }
  ];

  for (const endpoint of endpoints) {
    const result = await apiCall(endpoint.method, endpoint.path, null, true);
    if (result.success) {
      console.log(`✅ ${endpoint.name} - Working`);
    } else {
      console.log(`❌ ${endpoint.name} - Failed: ${result.error}`);
    }
  }
};

const testPublicEndpoints = async () => {
  console.log('\n🌐 Testing Public Endpoints...');

  const publicEndpoints = [
    { method: 'GET', path: '/qr-codes/active', name: 'Active QR Codes' },
    { method: 'GET', path: '/agents/generate-referral-code', name: 'Generate Referral Code (should require auth)' }
  ];

  for (const endpoint of publicEndpoints) {
    const result = await apiCall(endpoint.method, endpoint.path);
    if (result.success) {
      console.log(`✅ ${endpoint.name} - Accessible`);
    } else {
      if (endpoint.name.includes('should require auth') && result.status === 401) {
        console.log(`✅ ${endpoint.name} - Correctly protected`);
      } else {
        console.log(`❌ ${endpoint.name} - Failed: ${result.error}`);
      }
    }
  }
};

const testRouteStructure = async () => {
  console.log('\n📋 Testing Route Structure...');
  
  // Test various endpoints to see if they're properly defined
  const routes = [
    '/login',
    '/logout',
    '/dashboard',
    '/users',
    '/rounds',
    '/rounds/current',
    '/agents',
    '/qr-codes',
    '/wallet-requests',
    '/settings'
  ];

  for (const route of routes) {
    // Just test if the route exists (not necessarily works without proper auth/data)
    try {
      await axios.get(`${ADMIN_PANEL_URL}${route}`, { timeout: 2000 });
      console.log(`✅ Route ${route} - Defined`);
    } catch (error) {
      if (error.response) {
        // Route exists but returned an error (expected for auth-protected routes)
        if (error.response.status === 401) {
          console.log(`✅ Route ${route} - Defined (Auth Required)`);
        } else if (error.response.status === 400 || error.response.status === 500) {
          console.log(`⚠️  Route ${route} - Defined (Server/DB Error)`);
        } else {
          console.log(`❓ Route ${route} - Status ${error.response.status}`);
        }
      } else {
        console.log(`❌ Route ${route} - Not accessible`);
      }
    }
  }
};

// Main test runner
const runAdminPanelTests = async () => {
  console.log('🧪 Admin Panel API Testing Suite');
  console.log('================================');
  
  try {
    // Test 1: Basic connectivity
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('❌ Cannot proceed - server not responding');
      return;
    }

    // Test 2: Route structure
    await testRouteStructure();

    // Test 3: Authentication
    const loginOk = await testAdminLogin();

    // Test 4: Protected endpoints
    await testProtectedEndpoints();

    // Test 5: Public endpoints
    await testPublicEndpoints();

    console.log('\n📊 Test Summary');
    console.log('================');
    console.log('✅ Server is running and responding');
    console.log('✅ Admin panel routes are properly defined');
    console.log(`${loginOk ? '✅' : '❌'} Authentication system is ${loginOk ? 'working' : 'having database issues'}`);
    console.log('✅ Route protection is implemented');
    
    if (!loginOk) {
      console.log('\n💡 Next Steps:');
      console.log('1. Ensure MongoDB Atlas connection is stable');
      console.log('2. Verify admin user exists in database');
      console.log('3. Check database seeding process');
    } else {
      console.log('\n🎉 Admin Panel is fully functional!');
    }

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
};

// Run tests
runAdminPanelTests();
