import axios from "axios";

// Base API configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      // Remove any existing "Bearer " prefix before adding
      const cleanToken = token.replace(/^Bearer\s+/i, "");
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling - keep it simple
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle connection errors (no response from server)
    if (!error.response) {
      console.log("🔍 Connection Error:", error.message);
      return Promise.reject(
        new Error(
          "Cannot connect to server. Please check if the backend is running."
        )
      );
    }

    console.log("🔍 API Error:", error.response.status, error.response.data);

    // Don't remove tokens automatically - let admin handle login
    // Only log the error for debugging
    if (error.response.status === 401) {
      console.log("🔐 API returned 401, but keeping token for user decision");
    }

    return Promise.reject(error);
  }
);

// Auth API calls - Updated with correct backend endpoints
export const authAPI = {
  adminLogin: (credentials) => api.post("/admin-panel/login", credentials), // Fixed endpoint
  logout: () => api.post("/admin-panel/logout", {}),
  verify: () => api.get("/admin-panel/verify"),
  refresh: () => api.post("/admin-panel/refresh", {}),
};

// Admin API calls - Updated with correct endpoints
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get("/admin-panel/dashboard"),

  // Users Management - Using the correct admin-panel endpoints
  getUsers: (params) => api.get("/admin-panel/users", { params }),
  getUserDetails: (id) => api.get(`/admin-panel/users/${id}`),
  createUser: (data) => api.post("/admin-panel/users", data),
  updateUser: (id, data) => api.put(`/admin-panel/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin-panel/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/admin-panel/users/${id}/toggle-status`),

  // Wallet Management
  manageWallet: (data) => api.post("/wallet/manage", data), // FIXED

  // Results
  setResults: (data) => api.post("/results/set", data), // FIXED
  getResults: (params) => api.get("/results", { params }), // FIXED
  getRoundWinners: (roundId) => api.get(`/results/${roundId}/winners`), // FIXED

  // Admin Management - Using the correct admin-panel endpoints
  getAdmins: (params) => api.get("/admin-panel/admins", { params }),
  createAdmin: (data) => api.post("/admin-panel/admins", data),
  updateAdmin: (id, data) => api.put(`/admin-panel/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/admin-panel/admins/${id}`),
  changeAdminPassword: (data) => api.post("/admin-panel/change-password", data),

  // Agent Management - Using agent endpoints
  getAgents: (params) => api.get("/admin-panel/agents", { params }),
  createAgent: (data) => api.post("/admin-panel/agents", data),
  updateAgent: (id, data) => api.put(`/admin-panel/agents/${id}`, data),
  deleteAgent: (id) => api.delete(`/admin-panel/agents/${id}`),
  changeAgentPassword: (data) =>
    api.post("/admin-panel/agents/change-password", data),

  // Reports and Analytics
  getReports: (params) => api.get("/admin-panel/reports", { params }), // FIXED
  generateReport: (data) => api.post("/admin-panel/reports/generate", data), // FIXED
  generateQuickReport: (period) =>
    api.post("/admin-panel/reports/quick", { period }), // FIXED

  // Notifications
  getNotifications: (params) =>
    api.get("/admin-panel/notifications", { params }), // FIXED
  sendNotification: (data) => api.post("/admin-panel/notifications/send", data), // FIXED
  deleteNotification: (id) => api.delete(`/admin-panel/notifications/${id}`), // FIXED

  // Settings
  getSettings: () => api.get("/admin-panel/settings"), // FIXED
  updateSettings: (data) => api.put("/admin-panel/settings", data), // FIXED

  // QR Code Management
  getQrCodes: (params) => api.get("/admin-panel/qr-codes", { params }),
  createQrCode: (formData) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    return api.post("/admin-panel/qr-codes", formData, config);
  },
  updateQrCode: (id, formData) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    return api.put(`/admin-panel/qr-codes/${id}`, formData, config);
  },
  toggleQrCodeStatus: (id) =>
    api.patch(`/admin-panel/qr-codes/${id}/toggle-status`),
  deleteQrCode: (id) => api.delete(`/admin-panel/qr-codes/${id}`),
  getQrCodeStatistics: () => api.get("/admin-panel/qr-codes/statistics"),
  getActiveQrCodes: () => api.get("/admin-panel/qr-codes/active"),
};

// Game API calls (for admin)
export const gameAPI = {
  getCurrentRound: () => api.get("/game/current-round"),
  getGameInfo: () => api.get("/game/info"),
  getRecentResults: () => api.get("/game/results/recent"),
  getNumbers: (classType) => api.get(`/game/numbers/${classType}`),

  // Results specific endpoints
  getResultTables: (roundId) => api.get(`/results/tables?roundId=${roundId}`),
  getCurrentRoundResults: () => api.get("/game/current-round"),
  getResultsStatistics: (roundId) =>
    api.get(`/results/statistics?roundId=${roundId}`),
  // Result declaration endpoints
  setGameResult: (data) => api.post("/results/set-game-result", data),
  updateGameResult: (data) => api.put("/results/update-game-result", data),
};

// User API calls (for admin to manage users)
export const userAPI = {
  getUserProfile: (id) => api.get(`/user/profile/${id}`),
  getUserSelections: (id) => api.get(`/user/selections/${id}`),
  getUserTransactions: (id) => api.get(`/user/wallet/transactions/${id}`),
  getUserResults: (id) => api.get(`/user/results/${id}`),
  getUserStats: (id) => api.get(`/user/stats/${id}`),
};

export default api;

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const getResultTables = async (roundId) => {
  try {
    const res = await axios.get(
      `${API_BASE}/results/tables?roundId=${roundId}`
    );
    return res.data;
  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
      throw new Error(error.response.data?.message || "API request failed");
    } else {
      console.error("API Error:", error);
      throw new Error("API request failed");
    }
  }
};
