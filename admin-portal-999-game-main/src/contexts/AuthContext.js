import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, agentAPI } from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simple authentication check - no complex expiry logic
  const checkAuth = () => {
    const token = localStorage.getItem("admin_token");
    const userData = localStorage.getItem("admin_user");

    console.log(
      "🔍 Simple auth check - Token:",
      !!token,
      "UserData:",
      !!userData
    );

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);

        // Only check if token data exists for expiry, but be lenient
        const tokenData = localStorage.getItem("admin_token_data");
        if (tokenData) {
          try {
            const parsed = JSON.parse(tokenData);
            const isExpired = Date.now() > parsed.timestamp + parsed.expiresIn;

            if (isExpired) {
              console.log("🕐 Token expired after 1 month, clearing auth");
              localStorage.removeItem("admin_token");
              localStorage.removeItem("admin_user");
              localStorage.removeItem("admin_token_data");
              setUser(null);
              return false;
            }
          } catch (e) {
            // If token data is corrupted, just keep the auth
            console.log("Token data corrupted, but keeping auth");
          }
        }

        setUser(parsedUser);
        return true;
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        // Don't clear storage, just reset user state
        setUser(null);
        return false;
      }
    } else {
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    console.log("🚀 AuthProvider initializing...");
    checkAuth();
    setLoading(false);

    // Only listen for storage changes, no interval checking
    const handleStorageChange = (e) => {
      if (e.key === "admin_token" || e.key === "admin_user") {
        console.log(
          "📦 Storage changed:",
          e.key,
          e.newValue ? "SET" : "REMOVED"
        );
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = async (credentials) => {
    try {
      console.log("🚀 Login attempt:", credentials);

      // First try admin login (only if username is "admin")
      if (credentials.username === "admin") {
        try {
          const response = await authAPI.adminLogin(credentials);
          console.log("✅ Admin API Response:", response.data);

          if (response.data && response.data.success) {
            const { token, admin: userData } = response.data;

            // Set token with 1 month expiry - simple and straightforward
            const tokenData = {
              token: token,
              timestamp: Date.now(),
              expiresIn: 30 * 24 * 60 * 60 * 1000, // 1 month (30 days) in milliseconds
            };

            localStorage.setItem("admin_token", token);
            localStorage.setItem("admin_token_data", JSON.stringify(tokenData));
            localStorage.setItem(
              "admin_user",
              JSON.stringify({ ...userData, role: "admin" })
            );

            setUser({ ...userData, role: "admin" });
            console.log("✅ Admin login successful, token valid for 1 month");
            return { success: true };
          }
        } catch (adminError) {
          console.log(
            "❌ Admin login failed:",
            adminError.response?.data?.message
          );
        }
      }

      // Try agent login for all other cases
      try {
        console.log("🔄 Trying agent login...");
        // Convert username to identifier for agent login
        const agentCredentials = {
          identifier: credentials.username,
          password: credentials.password,
        };
        const response = await agentAPI.login(agentCredentials);
        console.log("✅ Agent API Response:", response.data);

        if (response.data && response.data.success) {
          const { token, agent: userData } = response.data;

          // Set token with 1 month expiry
          const tokenData = {
            token: token,
            timestamp: Date.now(),
            expiresIn: 30 * 24 * 60 * 60 * 1000, // 1 month (30 days) in milliseconds
          };

          localStorage.setItem("admin_token", token);
          localStorage.setItem("admin_token_data", JSON.stringify(tokenData));
          localStorage.setItem(
            "admin_user",
            JSON.stringify({ ...userData, role: "agent" })
          );

          setUser({ ...userData, role: "agent" });
          console.log("✅ Agent login successful, token valid for 1 month");
          return { success: true };
        }
      } catch (agentError) {
        console.log(
          "❌ Agent login failed:",
          agentError.response?.data?.message
        );
      }

      return {
        success: false,
        error: "Invalid credentials",
      };
    } catch (error) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Invalid credentials",
      };
    }
  };

  const logout = () => {
    console.log("🚪 Logging out...");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_token_data");
    localStorage.removeItem("admin_user");
    setUser(null);
  };

  // Force login function for debugging
  const forceLogin = (token, userData) => {
    console.log("🔧 Force login with:", { token: !!token, user: !!userData });

    const tokenData = {
      token: token,
      timestamp: Date.now(),
      expiresIn: 24 * 60 * 60 * 1000, // 24 hours
    };

    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_token_data", JSON.stringify(tokenData));
    localStorage.setItem("admin_user", JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    forceLogin,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
