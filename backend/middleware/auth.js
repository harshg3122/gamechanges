const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Agent = require("../models/Agent");
const Admin = require("../models/Admin");

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not set in environment variables!");
}

// Main authentication middleware with role-based access
function auth(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const header = req.headers.authorization;
      if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: "No token provided",
        });
      }

      const token = header.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          error: "No token provided",
        });
      }

      // Verify JWT token
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (jwtErr) {
        console.error("JWT verification failed:", jwtErr.message);
        return res.status(401).json({
          success: false,
          error: "Invalid token",
        });
      }

      if (!payload || !payload.id || !payload.role) {
        return res.status(401).json({
          success: false,
          error: "Invalid token payload",
        });
      }

      // Load user based on role
      let user = null;
      try {
        switch (payload.role) {
          case "admin":
            user = await Admin.findById(payload.id).select("-password");
            break;
          case "agent":
            user = await Agent.findById(payload.id).select("-password");
            break;
          case "user":
            user = await User.findById(payload.id).select("-passwordHash");
            break;
          default:
            return res.status(401).json({
              success: false,
              error: "Invalid user role",
            });
        }
      } catch (dbErr) {
        console.error("Database error in auth middleware:", dbErr);
        return res.status(500).json({
          success: false,
          error: "Database error during authentication",
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "User not found",
        });
      }

      // Attach user and role to request
      req.user = user;
      req.userRole = payload.role;
      req.userId = payload.id;

      // Check role-based access
      if (requiredRoles.length > 0 && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions",
        });
      }

      next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      return res.status(500).json({
        success: false,
        error: "Authentication failed",
      });
    }
  };
}

// Admin-only middleware
function adminOnly() {
  return auth(["admin"]);
}

// Agent-only middleware
function agentOnly() {
  return auth(["agent"]);
}

// Admin or Agent middleware
function adminOrAgent() {
  return auth(["admin", "agent"]);
}

// Any authenticated user
function authenticated() {
  return auth();
}

// Optional authentication (doesn't fail if no token)
function optionalAuth() {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith("Bearer ")) {
        return next(); // Continue without user
      }

      const token = header.split(" ")[1];
      if (!token) {
        return next(); // Continue without user
      }

      const payload = jwt.verify(token, JWT_SECRET);
      if (payload && payload.id && payload.role) {
        let user = null;
        switch (payload.role) {
          case "admin":
            user = await Admin.findById(payload.id).select("-password");
            break;
          case "agent":
            user = await Agent.findById(payload.id).select("-password");
            break;
          case "user":
            user = await User.findById(payload.id).select("-passwordHash");
            break;
        }

        if (user) {
          req.user = user;
          req.userRole = payload.role;
          req.userId = payload.id;
        }
      }
    } catch (err) {
      // Silently continue without user on any error
      console.log("Optional auth failed (continuing):", err.message);
    }
    next();
  };
}

module.exports = {
  auth,
  adminOnly,
  agentOnly,
  adminOrAgent,
  authenticated,
  optionalAuth,
};
