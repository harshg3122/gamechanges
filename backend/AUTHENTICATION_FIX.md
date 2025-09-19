# Authentication Separation Fix

## Problem Identified

The Admin and Agent authentication systems were conflicting because:

1. **Token Structure Mismatch**: Admin tokens used `adminId` while agent tokens used `id`
2. **Shared Token Storage**: Frontend was likely storing both tokens in the same localStorage key
3. **Middleware Confusion**: Different middleware looking for different token structures
4. **Session Overlap**: Logging out one user type affected the other

## Backend Changes Made

### 1. **Standardized Token Structure**

**Admin Token:**

```javascript
{
  id: admin._id,        // Consistent with agent tokens
  adminId: admin._id,   // Backward compatibility
  role: 'admin',
  userType: 'admin',    // Clear identifier
  permissions: admin.permissions
}
```

**Agent Token:**

```javascript
{
  id: agent._id,
  role: 'agent',
  userType: 'agent',    // Clear identifier
  agentId: agent._id    // Additional identifier
}
```

### 2. **Enhanced Middleware Validation**

**Admin Middleware** (`adminAuthMiddleware.js`):

- Strictly rejects non-admin tokens
- Checks both `role` and `userType` fields
- Handles both `adminId` and `id` fields for backward compatibility

**Agent Middleware** (`agentAuth`):

- Strictly rejects non-agent tokens
- Verifies agent exists in database
- Clear logging for debugging

### 3. **Separate Login Endpoints**

- **Admin**: `POST /api/admin-panel/login`
- **Agent**: `POST /api/agent/login`

### 4. **Enhanced Response Structure**

Both login endpoints now return:

```javascript
{
  success: true,
  message: "Login successful",
  token: "jwt_token_here",
  userType: "admin" | "agent",  // Clear identification
  [admin|data]: { user_data }
}
```

## Frontend Implementation Required

To completely fix the authentication conflict, implement these changes in your admin panel:

### 1. **Separate Token Storage**

```javascript
// Store tokens with different keys
const storeAuthData = (response, userType) => {
  if (userType === "admin") {
    localStorage.setItem("admin_token", response.token);
    localStorage.setItem("admin_data", JSON.stringify(response.admin));
    localStorage.setItem("user_type", "admin");
  } else if (userType === "agent") {
    localStorage.setItem("agent_token", response.token);
    localStorage.setItem("agent_data", JSON.stringify(response.data.agent));
    localStorage.setItem("user_type", "agent");
  }
};
```

### 2. **Dynamic Token Retrieval**

```javascript
const getAuthToken = () => {
  const userType = localStorage.getItem("user_type");
  if (userType === "admin") {
    return localStorage.getItem("admin_token");
  } else if (userType === "agent") {
    return localStorage.getItem("agent_token");
  }
  return null;
};

// Set axios default header
const setAuthHeader = () => {
  const token = getAuthToken();
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};
```

### 3. **Separate Login Functions**

```javascript
// Admin Login
const loginAdmin = async (credentials) => {
  try {
    const response = await axios.post("/api/admin-panel/login", credentials);
    if (response.data.success) {
      storeAuthData(response.data, "admin");
      setAuthHeader();
      return { success: true, data: response.data };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
    };
  }
};

// Agent Login
const loginAgent = async (credentials) => {
  try {
    const response = await axios.post("/api/agent/login", credentials);
    if (response.data.success) {
      storeAuthData(response.data, "agent");
      setAuthHeader();
      return { success: true, data: response.data };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
    };
  }
};
```

### 4. **Proper Logout Implementation**

```javascript
const logout = async () => {
  try {
    const userType = localStorage.getItem("user_type");

    if (userType === "admin") {
      await axios.post("/api/admin-panel/logout");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_data");
    } else if (userType === "agent") {
      await axios.post("/api/agent/logout");
      localStorage.removeItem("agent_token");
      localStorage.removeItem("agent_data");
    }

    // Clear common items
    localStorage.removeItem("user_type");
    delete axios.defaults.headers.common["Authorization"];

    // Redirect to login
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
    // Force clear on error
    localStorage.clear();
    delete axios.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  }
};
```

### 5. **Login Form Updates**

```javascript
// In your login component
const handleLogin = async (formData) => {
  // Determine login type based on form or user selection
  const isAdminLogin =
    formData.username === "admin" || formData.loginType === "admin";

  let result;
  if (isAdminLogin) {
    result = await loginAdmin({
      username: formData.username,
      password: formData.password,
    });
  } else {
    result = await loginAgent({
      identifier: formData.username, // or mobile/email
      password: formData.password,
    });
  }

  if (result.success) {
    // Redirect based on user type
    const userType = localStorage.getItem("user_type");
    if (userType === "admin") {
      window.location.href = "/admin/dashboard";
    } else {
      window.location.href = "/agent/dashboard";
    }
  } else {
    setError(result.message);
  }
};
```

### 6. **Route Protection**

```javascript
// Check authentication on app load
const checkAuth = () => {
  const userType = localStorage.getItem("user_type");
  const token = getAuthToken();

  if (!token || !userType) {
    // Not authenticated
    return { authenticated: false };
  }

  setAuthHeader(); // Set axios header

  return {
    authenticated: true,
    userType: userType,
    userData:
      userType === "admin"
        ? JSON.parse(localStorage.getItem("admin_data") || "{}")
        : JSON.parse(localStorage.getItem("agent_data") || "{}"),
  };
};
```

## Testing the Fix

1. **Clear Browser Storage**: `localStorage.clear()` in browser console
2. **Login as Agent**: Verify agent functionality works
3. **Logout Agent**: Ensure clean logout
4. **Login as Admin**: Should work without "Invalid credentials" error
5. **Switch Between Users**: Test multiple login/logout cycles

## API Endpoints Summary

```
POST /api/admin-panel/login     - Admin login (username: admin, password: Admin@123)
POST /api/admin-panel/logout    - Admin logout
POST /api/agent/login           - Agent login
POST /api/agent/logout          - Agent logout
```

## Debugging

Enable console logging to see authentication flow:

- Admin tokens will show `userType: 'admin'`
- Agent tokens will show `userType: 'agent'`
- Middleware will log token validation steps
- Clear error messages for invalid tokens

The authentication systems are now completely separated and should work independently without conflicts.
