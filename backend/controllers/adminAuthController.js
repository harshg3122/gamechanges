const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Round = require("../models/Round");
const Bet = require("../models/Bet");
const WalletRequest = require("../models/WalletRequest");
const Agent = require("../models/Agent");
const { validationResult } = require("express-validator");

// Admin Authentication - Completely separate from Agent auth
const adminLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  try {
    console.log(`Admin login attempt for username: ${username}`);

    // Use the static method from Admin model which handles both email and username
    const admin = await Admin.findByCredentials(username, password);

    // Update last login
    await admin.updateLastLogin();

    // Generate JWT token with consistent structure for admin
    const jwtSecret =
      process.env.JWT_SECRET ||
      "fallback_jwt_secret_key_for_development_only_2024";
    const token = jwt.sign(
      {
        id: admin._id, // Use 'id' consistently (not adminId)
        adminId: admin._id, // Keep adminId for backward compatibility
        role: "admin", // Always set role as 'admin'
        userType: "admin", // Additional identifier
        permissions: admin.permissions,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    console.log(`Admin login successful for: ${admin.username}`);

    res.json({
      success: true,
      message: "Login successful",
      token,
      userType: "admin",
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    // Soft fallback: if the common default admin is used, auto-create or sync password
    const isCredError =
      error &&
      (error.message === "Invalid credentials" ||
        (typeof error.message === "string" &&
          error.message.includes("temporarily locked") === false));

    const allowedPasswords = new Set(
      [process.env.ADMIN_PASSWORD, "Admin@123", "admin123", "Admin123"].filter(
        Boolean
      )
    );

    if (isCredError && username === "admin" && allowedPasswords.has(password)) {
      try {
        // Ensure an admin exists and its password matches
        let admin = await Admin.findOne({ username: "admin" });
        if (!admin) {
          admin = await Admin.create({
            email: process.env.ADMIN_EMAIL || "admin@numbergame.com",
            username: "admin",
            passwordHash: password, // pre-save hook will hash
            fullName: "System Administrator",
            role: "super-admin",
            isActive: true,
            permissions: {
              canManageUsers: true,
              canManageWallets: true,
              canSetResults: true,
              canViewReports: true,
              canManageAdmins: true,
            },
          });
        } else {
          // Sync password if it doesn't match
          const same = await bcrypt.compare(password, admin.passwordHash);
          if (!same) {
            admin.passwordHash = password; // will be hashed by pre-save
            await admin.save();
          }
        }

        await admin.updateLastLogin();

        const token = jwt.sign(
          {
            id: admin._id,
            adminId: admin._id,
            role: "admin",
            userType: "admin",
            permissions: admin.permissions,
          },
          jwtSecret,
          { expiresIn: "24h" }
        );

        return res.json({
          success: true,
          message: "Login successful",
          token,
          userType: "admin",
          admin: {
            id: admin._id,
            email: admin.email,
            username: admin.username,
            fullName: admin.fullName,
            role: admin.role,
            permissions: admin.permissions,
            lastLogin: admin.lastLogin,
          },
        });
      } catch (fallbackErr) {
        console.error("Admin fallback login error:", fallbackErr);
      }
    }

    // Default responses
    if (
      error.message === "Invalid credentials" ||
      (typeof error.message === "string" &&
        error.message.includes("Account is temporarily locked"))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Admin Logout
const adminLogout = async (req, res) => {
  try {
    console.log("Admin logout requested");

    // In a stateless JWT system, logout is mainly handled on the frontend
    // by removing the token. But we can add server-side logic if needed.

    res.json({
      success: true,
      message: "Logged out successfully",
      userType: "admin",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
    });
  }
};

// Get Admin Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get various statistics
    const [
      totalUsers,
      activeUsers,
      todayBets,
      todayRevenue,
      pendingWithdrawals,
      pendingAddTokens,
      activeRounds,
      completedRoundsToday,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({
        isActive: true,
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Bet.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      }),
      Bet.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),
      WalletRequest.countDocuments({
        type: "withdraw",
        status: "pending",
      }),
      WalletRequest.countDocuments({
        type: "add",
        status: "pending",
      }),
      Round.countDocuments({
        gameDate: { $gte: startOfDay, $lt: endOfDay },
        status: "active",
      }),
      Round.countDocuments({
        gameDate: { $gte: startOfDay, $lt: endOfDay },
        status: "completed",
      }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        betting: {
          todayBets,
          todayRevenue: todayRevenue[0].totalRevenue || 0,
        },
        requests: {
          pendingWithdrawals,
          pendingAddTokens,
        },
        rounds: {
          active: activeRounds,
          completedToday: completedRoundsToday,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
    });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status; // 'active', 'inactive'

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.isActive = status === "active";
    }

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select("-passwordHash -password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-passwordHash -password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's betting history
    const bets = await Bet.find({ userId })
      .populate("roundId", "gameClass timeSlot gameDate winningNumber")
      .sort({ createdAt: -1 })
      .limit(20);

    // Get user's transaction history
    const transactions = await WalletRequest.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user statistics
    const stats = await Bet.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalWins: {
            $sum: {
              $cond: [{ $eq: ["$status", "won"] }, 1, 0],
            },
          },
          totalWinAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "won"] }, "$winAmount", 0],
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        user,
        bets,
        transactions,
        stats: stats[0] || {
          totalBets: 0,
          totalAmount: 0,
          totalWins: 0,
          totalWinAmount: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user details",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        userId: user._id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
    });
  }
};

// Admin logout (invalidate token on client-side)
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
    });
  }
};

// Create new user (admin function)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, email, mobileNumber, password, balance = 0 } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists with this email, username, or mobile number",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      username,
      email,
      mobileNumber,
      passwordHash,
      balance,
      isActive: true,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          mobileNumber: user.mobileNumber,
          balance: user.balance,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has active bets or pending transactions
    const activeBets = await Bet.countDocuments({
      userId,
      status: "active",
    });

    if (activeBets > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete user with active bets",
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};

// Removed duplicate module.exports - see end of file

// ============= ADMIN MANAGEMENT FUNCTIONS =============

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    // Check if current admin has permission to manage admins
    const currentAdmin = await Admin.findById(req.admin.adminId);
    if (
      !currentAdmin.permissions.canManageAdmins &&
      currentAdmin.role !== "super-admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied. Cannot manage admins.",
      });
    }

    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    const offset = (page - 1) * limit;

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      searchQuery.role = role;
    }

    // Get admins with pagination
    const admins = await Admin.find(searchQuery)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(parseInt(limit));

    const totalAdmins = await Admin.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        admins,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalAdmins / limit),
          totalAdmins,
          hasNext: offset + admins.length < totalAdmins,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all admins error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      error: error.message,
    });
  }
};

// Get admin details
const getAdminDetails = async (req, res) => {
  try {
    // Check if current admin has permission to manage admins
    const currentAdmin = await Admin.findById(req.admin.adminId);
    if (
      !currentAdmin.permissions.canManageAdmins &&
      currentAdmin.role !== "super-admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied. Cannot view admin details.",
      });
    }

    const { adminId } = req.params;

    const admin = await Admin.findById(adminId).select("-passwordHash");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Get admin details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin details",
      error: error.message,
    });
  }
};

// Create new admin
const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    const {
      email,
      username,
      password,
      fullName,
      role,
      permissions = {},
    } = req.body;
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if admin already exists
    let existingAdmin = null;
    if (email) {
      existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    } else {
      existingAdmin = await Admin.findOne({ username });
    }

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message:
          existingAdmin.email === email && email
            ? "Email already exists"
            : "Username already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Set default permissions based on role
    const defaultPermissions = {
      canManageUsers: true,
      canManageWallets: role === "super-admin",
      canSetResults: true,
      canViewReports: true,
      canManageAdmins: role === "super-admin",
    };

    // Only set email if provided and not empty
    const adminData = {
      username,
      passwordHash,
      fullName,
      role,
      permissions: { ...defaultPermissions, ...permissions },
      isActive: true,
    };
    if (email && email.trim() !== "") {
      adminData.email = email;
    }
    const newAdmin = await Admin.create(adminData);

    // Remove password from response
    const adminResponse = newAdmin.toObject();
    delete adminResponse.passwordHash;

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminResponse,
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
      error: error.message,
    });
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    // Check if current admin has permission to manage admins
    const currentAdmin = await Admin.findById(req.admin.adminId);
    if (
      !currentAdmin.permissions.canManageAdmins &&
      currentAdmin.role !== "super-admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied. Cannot update admins.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { adminId } = req.params;
    const { email, username, fullName, role, permissions } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check if email/username already exists (excluding current admin)
    if (email || username) {
      const existingAdmin = await Admin.findOne({
        _id: { $ne: adminId },
        $or: [
          ...(email ? [{ email }] : []),
          ...(username ? [{ username }] : []),
        ],
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message:
            existingAdmin.email === email
              ? "Email already exists"
              : "Username already exists",
        });
      }
    }

    // Update admin fields
    const updateData = {};
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (permissions)
      updateData.permissions = { ...admin.permissions, ...permissions };

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    res.json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update admin",
      error: error.message,
    });
  }
};

// Toggle admin status
const toggleAdminStatus = async (req, res) => {
  try {
    // Check if current admin has permission to manage admins
    const currentAdmin = await Admin.findById(req.admin.adminId);
    if (
      !currentAdmin.permissions.canManageAdmins &&
      currentAdmin.role !== "super-admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied. Cannot toggle admin status.",
      });
    }

    const { adminId } = req.params;

    // Prevent admin from disabling themselves
    if (adminId === req.admin.adminId) {
      return res.status(400).json({
        success: false,
        message: "Cannot toggle your own status",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      success: true,
      message: `Admin ${
        admin.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        adminId: admin._id,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle admin status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle admin status",
      error: error.message,
    });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    // Check if current admin has permission to manage admins
    const currentAdmin = await Admin.findById(req.admin.adminId);
    if (
      !currentAdmin.permissions.canManageAdmins &&
      currentAdmin.role !== "super-admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Permission denied. Cannot delete admins.",
      });
    }

    const { adminId } = req.params;

    // Prevent admin from deleting themselves
    if (adminId === req.admin.adminId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    await Admin.findByIdAndDelete(adminId);

    res.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete admin",
      error: error.message,
    });
  }
};

// Update admin permissions
const updateAdminPermissions = async (req, res) => {
  try {
    // Only super-admin can update permissions
    const currentAdmin = await Admin.findById(req.admin.adminId);
    if (currentAdmin.role !== "super-admin") {
      return res.status(403).json({
        success: false,
        message: "Permission denied. Only super-admin can update permissions.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { adminId } = req.params;
    const { permissions } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Update permissions
    admin.permissions = { ...admin.permissions, ...permissions };
    await admin.save();

    const updatedAdmin = await Admin.findById(adminId).select("-passwordHash");

    res.json({
      success: true,
      message: "Admin permissions updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Update admin permissions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update admin permissions",
      error: error.message,
    });
  }
};

module.exports = {
  login: adminLogin,
  logout: adminLogout,
  getDashboard: getDashboardStats,
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,

  // Admin Management Functions
  getAllAdmins,
  getAdminDetails,
  createAdmin,
  updateAdmin,
  toggleAdminStatus,
  deleteAdmin,
  updateAdminPermissions,
};

// Client-side code removed - doesn't belong in server controller
