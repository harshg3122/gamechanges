const express = require("express");
const { body, param } = require("express-validator");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const router = express.Router();

// Import controllers
const adminAuthController = require("../controllers/adminAuthController");
const adminRoundController = require("../controllers/adminRoundController");
const adminAgentController = require("../controllers/adminAgentController");
const adminQRController = require("../controllers/adminQRController");
const adminWalletController = require("../controllers/adminWalletController");
const resultController = require("../controllers/resultController");
const adminResultController = require("../controllers/adminResultController");

// ============= AUTHENTICATION ROUTES =============

// Admin login
router.post(
  "/login",
  [
    body("username").isLength({ min: 1 }).withMessage("Username is required"),
    body("password").isLength({ min: 1 }).withMessage("Password is required"),
  ],
  adminAuthController.login
);

// Admin logout
router.post("/logout", adminAuthMiddleware, adminAuthController.logout);

// Dashboard statistics
router.get("/dashboard", adminAuthMiddleware, adminAuthController.getDashboard);

// ============= USER MANAGEMENT ROUTES =============

// Get all users
router.get("/users", adminAuthMiddleware, adminAuthController.getAllUsers);

// Create user
router.post(
  "/users",
  adminAuthMiddleware,
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("mobileNumber")
      .isMobilePhone()
      .withMessage("Valid mobile number is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  adminAuthController.createUser
);

// Get user details
router.get(
  "/users/:userId",
  adminAuthMiddleware,
  [param("userId").isMongoId().withMessage("Valid user ID is required")],
  adminAuthController.getUserDetails
);

// Update user
router.put(
  "/users/:userId",
  adminAuthMiddleware,
  [
    param("userId").isMongoId().withMessage("Valid user ID is required"),
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("mobileNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Valid mobile number is required"),
  ],
  adminAuthController.updateUser
);

// Toggle user status
router.patch(
  "/users/:userId/toggle-status",
  adminAuthMiddleware,
  [param("userId").isMongoId().withMessage("Valid user ID is required")],
  adminAuthController.toggleUserStatus
);

// Delete user
router.delete(
  "/users/:userId",
  adminAuthMiddleware,
  [param("userId").isMongoId().withMessage("Valid user ID is required")],
  adminAuthController.deleteUser
);

// Delete user
router.delete(
  "/users/:userId",
  adminAuthMiddleware,
  [param("userId").isMongoId().withMessage("Valid user ID is required")],
  adminAuthController.deleteUser
);

// ============= ADMIN MANAGEMENT ROUTES =============

// Get all admins
router.get("/admins", adminAuthMiddleware, adminAuthController.getAllAdmins);

// Get admin details
router.get(
  "/admins/:adminId",
  adminAuthMiddleware,
  [param("adminId").isMongoId().withMessage("Valid admin ID is required")],
  adminAuthController.getAdminDetails
);

// Create new admin
router.post(
  "/admins",
  adminAuthMiddleware,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("fullName")
      .isLength({ min: 2, max: 50 })
      .withMessage("Full name must be 2-50 characters"),
    body("role")
      .isIn(["admin", "super-admin"])
      .withMessage("Role must be admin or super-admin"),
  ],
  adminAuthController.createAdmin
);

// Update admin
router.put(
  "/admins/:adminId",
  adminAuthMiddleware,
  [
    param("adminId").isMongoId().withMessage("Valid admin ID is required"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters"),
    body("fullName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Full name must be 2-50 characters"),
    body("role")
      .optional()
      .isIn(["admin", "super-admin"])
      .withMessage("Role must be admin or super-admin"),
  ],
  adminAuthController.updateAdmin
);

// Toggle admin status
router.patch(
  "/admins/:adminId/toggle-status",
  adminAuthMiddleware,
  [param("adminId").isMongoId().withMessage("Valid admin ID is required")],
  adminAuthController.toggleAdminStatus
);

// Delete admin
router.delete(
  "/admins/:adminId",
  adminAuthMiddleware,
  [param("adminId").isMongoId().withMessage("Valid admin ID is required")],
  adminAuthController.deleteAdmin
);

// Update admin permissions
router.patch(
  "/admins/:adminId/permissions",
  adminAuthMiddleware,
  [
    param("adminId").isMongoId().withMessage("Valid admin ID is required"),
    body("permissions").isObject().withMessage("Permissions must be an object"),
  ],
  adminAuthController.updateAdminPermissions
);

// ============= ROUND MANAGEMENT ROUTES =============

// Get all rounds
router.get("/rounds", adminAuthMiddleware, adminRoundController.getAllRounds);

// Get current round
router.get(
  "/rounds/current",
  adminAuthMiddleware,
  adminRoundController.getCurrentRound
);

// Create round
router.post(
  "/rounds",
  adminAuthMiddleware,
  [
    body("roundNumber")
      .isInt({ min: 1, max: 13 })
      .withMessage("Round number must be between 1 and 13"),
    body("date").optional().isISO8601().withMessage("Valid date is required"),
  ],
  adminRoundController.createRound
);

// Get round details
router.get(
  "/rounds/:roundId",
  adminAuthMiddleware,
  [param("roundId").isMongoId().withMessage("Valid round ID is required")],
  adminRoundController.getRoundDetails
);

// Declare result
router.post(
  "/rounds/:roundId/result",
  adminAuthMiddleware,
  [
    param("roundId").isMongoId().withMessage("Valid round ID is required"),
    body("resultNumber")
      .isInt({ min: 0, max: 9 })
      .withMessage("Result number must be between 0 and 9"),
  ],
  adminRoundController.declareResult
);

// Get least bet numbers for round
router.get(
  "/rounds/:roundId/least-bet-numbers",
  adminAuthMiddleware,
  [param("roundId").isMongoId().withMessage("Valid round ID is required")],
  adminRoundController.getLeastBetNumbers
);

// Initialize daily rounds
router.post(
  "/rounds/initialize-daily",
  adminAuthMiddleware,
  [body("date").optional().isISO8601().withMessage("Valid date is required")],
  adminRoundController.initializeDailyRounds
);

// ============= RESULT DECLARATION ROUTES =============

// Get current round with numbers for admin panel
router.get(
  "/results/current-round",
  adminAuthMiddleware,
  adminResultController.getCurrentRoundForAdmin
);

// Get result tables for a round (triple digit and single digit numbers)
router.get("/results/tables", adminAuthMiddleware, resultController.getTables);

// Get profit analysis for admin decision making
router.get(
  "/results/profit-analysis",
  adminAuthMiddleware,
  adminResultController.getProfitAnalysis
);

router.get(
  "/results/profit-numbers",
  adminAuthMiddleware,
  resultController.getProfitNumbers
);

// Declare result by admin (comprehensive validation with proper error messages)
router.post(
  "/results/declare",
  adminAuthMiddleware,
  [
    body("roundId").isMongoId().withMessage("Valid round ID is required"),
    body("tripleDigitNumber")
      .matches(/^\d{3}$/)
      .withMessage("Triple digit number must be exactly 3 digits"),
  ],
  adminResultController.declareResultByAdmin
);

// Get result status for a round
router.get(
  "/results/status",
  adminAuthMiddleware,
  adminResultController.getResultStatus
);

// View result for a round (includes auto-declaration if needed)
router.get("/results/view", adminAuthMiddleware, resultController.viewResult);

// Get result history with pagination
router.get(
  "/results/history",
  adminAuthMiddleware,
  resultController.getResultHistory
);

// ============= AGENT MANAGEMENT ROUTES =============

// Get all agents
router.get("/agents", adminAuthMiddleware, adminAgentController.getAllAgents);

// Generate referral code (must come before /:agentId route)
router.get(
  "/agents/generate-referral-code",
  adminAuthMiddleware,
  adminAgentController.generateReferralCode
);

// Create agent - ADD adminAuthMiddleware
router.post(
  "/agents",
  adminAuthMiddleware,
  [
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("mobile")
      .isMobilePhone()
      .withMessage("Valid mobile number is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    // Remove or make referralCode optional since it's auto-generated
    // body('referralCode').optional().isAlphanumeric().isLength({ min: 4, max: 20 }).withMessage('Referral code must be 4-20 alphanumeric characters')
  ],
  adminAgentController.createAgent
);

// Get agent details
router.get(
  "/agents/:agentId",
  adminAuthMiddleware,
  [param("agentId").isMongoId().withMessage("Valid agent ID is required")],
  adminAgentController.getAgentDetails
);

// Update agent
router.put(
  "/agents/:agentId",
  adminAuthMiddleware,
  [
    param("agentId").isMongoId().withMessage("Valid agent ID is required"),
    body("fullName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be 2-50 characters"),
    body("mobile")
      .optional()
      .isMobilePhone()
      .withMessage("Valid phone number is required"),
  ],
  adminAgentController.updateAgent
);

// Toggle agent status
router.patch(
  "/agents/:agentId/toggle-status",
  adminAuthMiddleware,
  [param("agentId").isMongoId().withMessage("Valid agent ID is required")],
  adminAgentController.toggleAgentStatus
);

// Delete agent
router.delete(
  "/agents/:agentId",
  adminAuthMiddleware,
  [param("agentId").isMongoId().withMessage("Valid agent ID is required")],
  adminAgentController.deleteAgent
);

// Toggle agent status
router.patch(
  "/agents/:agentId/toggle-status",
  adminAuthMiddleware,
  [param("agentId").isMongoId().withMessage("Valid agent ID is required")],
  adminAgentController.toggleAgentStatus
);

// Delete agent
router.delete(
  "/agents/:agentId",
  adminAuthMiddleware,
  [param("agentId").isMongoId().withMessage("Valid agent ID is required")],
  adminAgentController.deleteAgent
);

// Generate referral code
router.get(
  "/agents/generate-referral-code",
  adminAuthMiddleware,
  adminAgentController.generateReferralCode
);

// ============= QR CODE MANAGEMENT ROUTES =============

// Get all QR codes
router.get("/qr-codes", adminAuthMiddleware, adminQRController.getAllQRCodes);

// Create QR code
router.post(
  "/qr-codes",
  adminAuthMiddleware,
  adminQRController.upload.single("qrImage"),
  [
    body("paymentMethod")
      .isIn(["UPI", "PHONEPE", "PAYTM", "GPAY"])
      .withMessage("Invalid payment method"),
    body("upiId")
      .isLength({ min: 3, max: 100 })
      .withMessage("UPI ID must be 3-100 characters"),
    body("description")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Description must not exceed 200 characters"),
  ],
  adminQRController.createQRCode
);

// Update QR code
router.put(
  "/qr-codes/:qrCodeId",
  adminAuthMiddleware,
  adminQRController.upload.single("qrImage"),
  [
    param("qrCodeId").isMongoId().withMessage("Valid QR code ID is required"),
    body("paymentMethod")
      .optional()
      .isIn(["UPI", "PHONEPE", "PAYTM", "GPAY"])
      .withMessage("Invalid payment method"),
    body("upiId")
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage("UPI ID must be 3-100 characters"),
  ],
  adminQRController.updateQRCode
);

// Toggle QR code status
router.patch(
  "/qr-codes/:qrCodeId/toggle-status",
  adminAuthMiddleware,
  [param("qrCodeId").isMongoId().withMessage("Valid QR code ID is required")],
  adminQRController.toggleQRCodeStatus
);

// Set primary QR code
router.patch(
  "/qr-codes/:qrCodeId/set-primary",
  adminAuthMiddleware,
  [param("qrCodeId").isMongoId().withMessage("Valid QR code ID is required")],
  adminQRController.setPrimaryQRCode
);

// Delete QR code
router.delete(
  "/qr-codes/:qrCodeId",
  adminAuthMiddleware,
  [param("qrCodeId").isMongoId().withMessage("Valid QR code ID is required")],
  adminQRController.deleteQRCode
);

// Get QR code statistics
router.get(
  "/qr-codes/statistics",
  adminAuthMiddleware,
  adminQRController.getQRCodeStats
);

// Get active QR codes (public route for app)
router.get("/qr-codes/active", adminQRController.getActiveQRCodes);

// ============= WALLET REQUEST MANAGEMENT ROUTES =============

// Get wallet requests
router.get(
  "/wallet-requests",
  adminAuthMiddleware,
  adminWalletController.getWalletRequests
);

// Process wallet request
router.patch(
  "/wallet-requests/:requestId",
  adminAuthMiddleware,
  [
    param("requestId").isMongoId().withMessage("Valid request ID is required"),
    body("action")
      .isIn(["approve", "reject"])
      .withMessage("Action must be approve or reject"),
    body("adminNotes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Admin notes must not exceed 500 characters"),
  ],
  adminWalletController.processWalletRequest
);

// ============= SETTINGS ROUTES =============

// Get app settings
router.get(
  "/settings",
  adminAuthMiddleware,
  adminWalletController.getAppSettings
);

// Update app settings
router.put(
  "/settings",
  adminAuthMiddleware,
  [
    body("minBetAmount")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Minimum bet amount must be at least 1"),
    body("maxBetAmount")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Maximum bet amount must be at least 1"),
    body("bettingEnabled")
      .optional()
      .isBoolean()
      .withMessage("Betting enabled must be true or false"),
    body("maintenanceMode")
      .optional()
      .isBoolean()
      .withMessage("Maintenance mode must be true or false"),
    body("withdrawalEnabled")
      .optional()
      .isBoolean()
      .withMessage("Withdrawal enabled must be true or false"),
  ],
  adminWalletController.updateAppSettings
);

module.exports = router;
