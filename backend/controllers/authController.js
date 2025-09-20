const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Agent = require("../models/Agent");
const Admin = require("../models/Admin");

const { JWT_SECRET, JWT_EXPIRES_IN = "8h", BCRYPT_ROUNDS = 10 } = process.env;

if (!JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not set in environment variables!");
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password required",
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = signToken({
      id: admin._id,
      role: "admin",
      username: admin.username,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Agent login
exports.agentLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be mobile, email, username
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password required",
      });
    }

    // Find agent by mobile, email, username, or identifier
    const agent = await Agent.findOne({
      $or: [
        { mobile: identifier },
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
        { identifier: identifier.toLowerCase() },
      ],
    });

    if (!agent) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password (could be hashed or plain mobile number)
    let isValidPassword = false;
    if (agent.password) {
      // Try bcrypt first
      try {
        isValidPassword = await bcrypt.compare(password, agent.password);
      } catch (bcryptErr) {
        // If bcrypt fails, try plain text comparison (for mobile numbers)
        isValidPassword = password === agent.password;
      }
    } else {
      // Fallback to mobile number as password
      isValidPassword = password === agent.mobile;
    }

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = signToken({
      id: agent._id,
      role: "agent",
      name: agent.name,
      mobile: agent.mobile,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: agent._id,
        name: agent.name,
        mobile: agent.mobile,
        email: agent.email,
        role: "agent",
      },
    });
  } catch (err) {
    console.error("Agent login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// User login
exports.userLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be mobile, email, username
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password required",
      });
    }

    // Find user by mobile, email, or username
    const user = await User.findOne({
      $or: [
        { mobileNumber: identifier },
        { email: identifier ? identifier.toLowerCase() : null },
        { username: identifier ? identifier.toLowerCase() : null },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = signToken({
      id: user._id,
      role: "user",
      username: user.username,
      mobile: user.mobileNumber,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        mobile: user.mobileNumber,
        email: user.email,
        role: "user",
        balance: user.balance,
      },
    });
  } catch (err) {
    console.error("User login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Hash password utility
exports.hashPassword = async (password) => {
  try {
    const rounds = parseInt(BCRYPT_ROUNDS, 10) || 10;
    return await bcrypt.hash(password, rounds);
  } catch (err) {
    console.error("Password hashing error:", err);
    throw new Error("Failed to hash password");
  }
};

// Verify token utility
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
};
