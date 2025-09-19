const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header with multiple formats support
    let token = req.header("Authorization");

    if (!token) {
      console.log("No Authorization header provided");
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
      });
    }

    // Handle different token formats
    if (token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
    } else if (token.startsWith("bearer ")) {
      token = token.replace("bearer ", "");
    }

    // Additional validation
    if (!token || token === "null" || token === "undefined") {
      console.log("Invalid token format:", token);
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // Development shortcut: allow simple dev tokens to ease local testing
    // Accept tokens like "dev-token-*" when not in production
    if (
      process.env.NODE_ENV !== "production" &&
      token.startsWith("dev-token")
    ) {
      console.log("Development token detected, bypassing JWT verification");
      req.admin = {
        adminId: "dev-admin",
        email: "dev@local.test",
        role: "admin",
      };
      return next();
    }

    console.log("Verifying admin token:", token.substring(0, 20) + "...");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "d641e6d38645f5e7ec7f87ea79260e22e03fee81eac6f18a44d257d1101fe33cac8063339592efd43dc585937f3d7883c5f539987fb834928207e9a4c25660bb"
    );

    console.log("Decoded token:", decoded);

    // Reject if this is not an admin token
    if (decoded.role !== "admin" && decoded.userType !== "admin") {
      console.log("Token is not for admin, role:", decoded.role);
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin access required.",
      });
    }

    // Verify admin exists and is active - handle both adminId and id fields
    const adminId = decoded.adminId || decoded.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      console.log("Admin not found for ID:", adminId);
      return res.status(401).json({
        success: false,
        message: "Invalid token. Admin not found",
      });
    }

    if (!admin.isActive) {
      console.log("Admin account deactivated:", admin.email);
      return res.status(401).json({
        success: false,
        message: "Admin account is deactivated",
      });
    }

    // Add admin info to request
    req.admin = {
      adminId: admin._id,
      email: admin.email,
      role: admin.role || "admin",
    };

    console.log("Admin authenticated:", admin.email);
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", {
      name: error.name,
      message: error.message,
      token: req.header("Authorization")?.substring(0, 30) + "...",
    });

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token format or signature",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

module.exports = adminAuthMiddleware;
